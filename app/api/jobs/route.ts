// app/api/jobs/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabaseServerClient";
import { getCurrentUserAndTenants } from "@/lib/getCurrentUserAndTenants";

export const dynamic = "force-dynamic";

// Utility: simple slugifier for job titles
function slugify(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

// GET /api/jobs
// - view=public or view=careers → open, public jobs (for resourcin.com/jobs)
// - default → tenant-scoped jobs for logged-in ATS/client users
export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const view = url.searchParams.get("view");

    const supabase = await createSupabaseServerClient();

    // Public careers view
    if (view === "public" || view === "careers") {
      const { data, error } = await supabase
        .from("jobs")
        .select(
          `
          id,
          slug,
          title,
          department,
          location,
          employment_type,
          seniority,
          description,
          tags,
          status,
          visibility,
          created_at
        `
        )
        .eq("status", "open")
        .eq("visibility", "public")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("GET /api/jobs (public) error", error);
        return NextResponse.json(
          { error: "Failed to load jobs" },
          { status: 500 }
        );
      }

      return NextResponse.json({ jobs: data ?? [] });
    }

    // ATS / internal view – require user + tenant
    const { user, currentTenant } = await getCurrentUserAndTenants();

    if (!user || !currentTenant) {
      return NextResponse.json(
        { error: "Not authenticated or no tenant configured." },
        { status: 401 }
      );
    }

    const { data, error } = await supabase
      .from("jobs")
      .select(
        `
        id,
        slug,
        title,
        department,
        location,
        employment_type,
        seniority,
        description,
        tags,
        status,
        visibility,
        created_at
      `
      )
      .eq("tenant_id", currentTenant.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("GET /api/jobs (tenant) error", error);
      return NextResponse.json(
        { error: "Failed to load jobs" },
        { status: 500 }
      );
    }

    return NextResponse.json({ jobs: data ?? [] });
  } catch (err) {
    console.error("GET /api/jobs unexpected error", err);
    return NextResponse.json(
      { error: "Failed to load jobs" },
      { status: 500 }
    );
  }
}

// POST /api/jobs
// Creates a new job for the current tenant (ATS side)
export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => ({}))) as any;

    const {
      title,
      department,
      location,
      employmentType,
      seniority,
      description,
      tags,
      status,
      visibility,
    } = body || {};

    if (!title || typeof title !== "string" || !title.trim()) {
      return NextResponse.json(
        { error: "Job title is required." },
        { status: 400 }
      );
    }

    const { user, currentTenant } = await getCurrentUserAndTenants();
    if (!user || !currentTenant) {
      return NextResponse.json(
        { error: "You must be signed in and linked to a tenant to create jobs." },
        { status: 401 }
      );
    }

    const supabase = await createSupabaseServerClient();

    const baseSlug = slugify(title);
    let finalSlug = baseSlug || null;

    if (baseSlug) {
      const { data: existing } = await supabase
        .from("jobs")
        .select("slug")
        .eq("tenant_id", currentTenant.id)
        .ilike("slug", `${baseSlug}%`);

      if (existing && existing.length > 0) {
        const suffix = existing.length + 1;
        finalSlug = `${baseSlug}-${suffix}`;
      }
    }

    const insertPayload: any = {
      tenant_id: currentTenant.id,
      title: title.trim(),
      department: department ?? null,
      location: location ?? null,
      employment_type: employmentType ?? null,
      seniority: seniority ?? null,
      description: description ?? null,
      tags: Array.isArray(tags) ? tags : null,
      status: status ?? "open",
      visibility: visibility ?? "public",
      slug: finalSlug,
      created_by: user.id ?? null,
    };

    const { data, error } = await supabase
      .from("jobs")
      .insert(insertPayload)
      .select("id, slug")
      .single();

    if (error || !data) {
      console.error("POST /api/jobs insert error", error);
      return NextResponse.json(
        { error: "Failed to create job. Please check server logs for more detail." },
        { status: 500 }
      );
    }

    return NextResponse.json({ job: data }, { status: 201 });
  } catch (err) {
    console.error("POST /api/jobs unexpected error", err);
    return NextResponse.json(
      { error: "Failed to create job. Please check server logs for more detail." },
      { status: 500 }
    );
  }
}
