// app/api/jobs/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabaseServerClient";
import { getCurrentUserAndTenants } from "@/lib/getCurrentUserAndTenants";

// simple slug generator from title
function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export async function POST(req: NextRequest) {
  try {
    // 1) Who is this and which tenant?
    const { user, currentTenant } = await getCurrentUserAndTenants();

    if (!user || !currentTenant) {
      return NextResponse.json(
        { error: "Not authenticated or no tenant found" },
        { status: 401 }
      );
    }

    // 2) Read data from the form (JSON body)
    const body = await req.json();
    const {
      title,
      department,
      location,
      employmentType,
      seniority,
      description,
      tags,
      visibility,
      publishNow,
    } = body;

    // 3) Basic validation
    if (!title || !location) {
      return NextResponse.json(
        { error: "Missing required fields: title and location" },
        { status: 400 }
      );
    }

    const supabase = await createSupabaseServerClient();

    // 4) Generate a slug, make it unique per tenant
    const baseSlug = slugify(title);
    let slug = baseSlug;

    const { data: existing, error: existingErr } = await supabase
      .from("jobs")
      .select("id, slug")
      .eq("tenant_id", currentTenant.id)
      .ilike("slug", `${baseSlug}%`);

    if (!existingErr && existing && existing.length > 0) {
      slug = `${baseSlug}-${existing.length + 1}`;
    }

    // 5) Status + visibility logic
    const status = publishNow ? "open" : "draft";
    const visibilityValue = visibility || "public";

    // 6) Normalise tags to a string[]
    const tagsArray: string[] =
      Array.isArray(tags)
        ? tags
        : typeof tags === "string" && tags.trim().length > 0
        ? tags
            .split(",")
            .map((t: string) => t.trim())
            .filter(Boolean)
        : [];

    // 7) Insert into the REAL `jobs` table
    const { data, error } = await supabase
      .from("jobs")
      .insert({
        tenant_id: currentTenant.id,
        title,
        department: department || null,
        location,
        employment_type: employmentType || null,
        seniority: seniority || null,
        description: description || "",
        status,
        visibility: visibilityValue,
        tags: tagsArray.length > 0 ? tagsArray : null,
        created_by: user.id,
        slug,
      })
      .select("id, slug")
      .single();

    if (error || !data) {
      console.error("❌ Error creating ATS job:", error);
      return NextResponse.json(
        { error: "Failed to create job. Check logs for details." },
        { status: 500 }
      );
    }

    // 8) All good – return the job id + slug
    return NextResponse.json(
      {
        id: data.id,
        slug: data.slug,
        status,
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("❌ Unexpected error in POST /api/jobs:", err);
    return NextResponse.json(
      { error: "Unexpected error creating job" },
      { status: 500 }
    );
  }
}
