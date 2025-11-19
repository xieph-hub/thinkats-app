// app/api/jobs/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabaseServerClient";
import { getCurrentUserAndTenants } from "@/lib/getCurrentUserAndTenants";

// Small helper to create a URL-friendly slug from the job title
function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "") // remove weird chars
    .replace(/\s+/g, "-") // spaces -> -
    .replace(/-+/g, "-"); // collapse ---
}

/**
 * POST /api/jobs
 * Creates a new job under the current tenant in the canonical `Jobs` table.
 */
export async function POST(req: NextRequest) {
  try {
    const { user, currentTenant } = await getCurrentUserAndTenants();

    if (!user || !currentTenant) {
      return NextResponse.json(
        {
          error:
            "You must be logged in and linked to a tenant to create jobs.",
        },
        { status: 401 }
      );
    }

    const body = await req.json();

    // ── 1) Normalise basic fields ────────────────────────────────────────────
    const rawTitle = body.title ? String(body.title).trim() : "";
    if (!rawTitle) {
      return NextResponse.json(
        { error: "Title is required" },
        { status: 400 }
      );
    }

    const rawSlug = body.slug ? String(body.slug).trim() : "";
    const slug = rawSlug || slugify(rawTitle);

    const location =
      body.location && String(body.location).trim().length > 0
        ? String(body.location).trim()
        : null;

    const department =
      body.department && String(body.department).trim().length > 0
        ? String(body.department).trim()
        : null;

    const jobType =
      body.jobType && String(body.jobType).trim().length > 0
        ? String(body.jobType).trim()
        : null;

    const level =
      body.level && String(body.level).trim().length > 0
        ? String(body.level).trim()
        : null;

    const jobFunction =
      body.function && String(body.function).trim().length > 0
        ? String(body.function).trim()
        : null;

    const industry =
      body.industry && String(body.industry).trim().length > 0
        ? String(body.industry).trim()
        : null;

    const remoteOption =
      body.remoteOption && String(body.remoteOption).trim().length > 0
        ? String(body.remoteOption).trim()
        : null;

    const employmentType =
      body.employmentType && String(body.employmentType).trim().length > 0
        ? String(body.employmentType).trim()
        : null;

    const seniority =
      body.seniority && String(body.seniority).trim().length > 0
        ? String(body.seniority).trim()
        : null;

    const salaryCurrency =
      body.salaryCurrency && String(body.salaryCurrency).trim().length > 0
        ? String(body.salaryCurrency).trim()
        : null;

    const salaryMin =
      body.salaryMin !== undefined && body.salaryMin !== null && body.salaryMin !== ""
        ? Number(body.salaryMin)
        : null;

    const salaryMax =
      body.salaryMax !== undefined && body.salaryMax !== null && body.salaryMax !== ""
        ? Number(body.salaryMax)
        : null;

    const experienceMax =
      body.experienceMax !== undefined &&
      body.experienceMax !== null &&
      body.experienceMax !== ""
        ? Number(body.experienceMax)
        : null;

    const summary =
      body.summary && String(body.summary).trim().length > 0
        ? String(body.summary).trim()
        : null;

    const description =
      body.description && String(body.description).trim().length > 0
        ? String(body.description).trim()
        : null;

    const requirements =
      body.requirements && String(body.requirements).trim().length > 0
        ? String(body.requirements).trim()
        : null;

    const clientName =
      body.clientName && String(body.clientName).trim().length > 0
        ? String(body.clientName).trim()
        : null;

    const clientSlug =
      body.clientSlug && String(body.clientSlug).trim().length > 0
        ? String(body.clientSlug).trim()
        : null;

    const clientCompanyId =
      body.clientCompanyId && String(body.clientCompanyId).trim().length > 0
        ? String(body.clientCompanyId).trim()
        : null;

    const status =
      body.status && String(body.status).trim().length > 0
        ? String(body.status).trim()
        : "draft";

    const isPublished = Boolean(body.isPublished);

    // tags can be sent as array OR comma-separated string
    let tags: string[] = [];
    if (Array.isArray(body.tags)) {
      tags = body.tags.map((t: any) => String(t).trim()).filter(Boolean);
    } else if (typeof body.tags === "string") {
      tags = body.tags
        .split(",")
        .map((t: string) => t.trim())
        .filter(Boolean);
    }

    const supabase = await createSupabaseServerClient();
    const nowIso = new Date().toISOString();

    // ── 2) Insert into the canonical `Jobs` table ───────────────────────────
    const { data, error } = await supabase
      .from("Jobs") // ⚠️ use whatever exact table name Supabase shows here
      .insert([
        {
          slug,
          title: rawTitle,
          excerpt: summary, // optional: short summary
          department,
          location,
          description,
          postedAt: nowIso,
          isPublished,
          clientName,
          clientSlug,
          status,
          ClientID: null, // legacy / unused for now
          jobType,
          level,
          function: jobFunction,
          industry,
          remoteOption,
          experienceMax,
          salaryCurrency,
          salaryMin,
          salaryMax,
          summary,
          requirements,
          createdAt: nowIso,
          updatedAt: nowIso,
          tenantId: currentTenant.id,
          clientCompanyId,
          employmentType,
          seniority,
          tags,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error("❌ Error creating job in Jobs table:", error);
      return NextResponse.json(
        { error: "Failed to create job. Check logs for details." },
        { status: 500 }
      );
    }

    return NextResponse.json(data, { status: 201 });
  } catch (err) {
    console.error("❌ Unexpected error in POST /api/jobs:", err);
    return NextResponse.json(
      { error: "An unexpected error occurred while creating the job." },
      { status: 500 }
    );
  }
}

/**
 * GET /api/jobs
 * Returns a list of jobs for the current tenant from `Jobs`.
 */
export async function GET() {
  try {
    const { user, currentTenant } = await getCurrentUserAndTenants();

    if (!user || !currentTenant) {
      return NextResponse.json(
        { error: "You must be logged in and linked to a tenant." },
        { status: 401 }
      );
    }

    const supabase = await createSupabaseServerClient();

    const { data, error } = await supabase
      .from("Jobs") // ⚠️ same canonical table
      .select(
        `
          id,
          slug,
          title,
          department,
          location,
          employmentType,
          isPublished,
          createdAt,
          tenantId
        `
      )
      .eq("tenantId", currentTenant.id)
      .order("createdAt", { ascending: false });

    if (error) {
      console.error("⚠️ Error fetching jobs from Jobs table:", error);
      return NextResponse.json(
        { error: "Unable to load jobs" },
        { status: 500 }
      );
    }

    return NextResponse.json(data ?? [], { status: 200 });
  } catch (err) {
    console.error("⚠️ Unexpected error in GET /api/jobs:", err);
    return NextResponse.json(
      { error: "Unexpected server error" },
      { status: 500 }
    );
  }
}
