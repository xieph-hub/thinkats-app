// app/api/jobs/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabaseServerClient";
import { getCurrentUserAndTenants } from "@/lib/getCurrentUserAndTenants";

// Make a URL-safe slug from the job title
function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "") // remove weird chars
    .replace(/\s+/g, "-") // spaces → dashes
    .replace(/-+/g, "-"); // collapse multiple dashes
}

// POST /api/jobs  → create a new job in `jobs`
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

    // === REQUIRED FIELDS ===
    const rawTitle =
      typeof body.title === "string" ? body.title.trim() : "";
    const rawLocation =
      typeof body.location === "string" ? body.location.trim() : "";

    if (!rawTitle) {
      return NextResponse.json(
        { error: "Job title is required." },
        { status: 400 }
      );
    }

    if (!rawLocation) {
      return NextResponse.json(
        { error: "Location is required." },
        { status: 400 }
      );
    }

    // === OPTIONAL FIELDS FROM FORM ===

    const rawSlug =
      typeof body.slug === "string" ? body.slug.trim() : "";
    const slug = slugify(rawSlug || rawTitle);

    const department =
      typeof body.department === "string" && body.department.trim().length
        ? body.department.trim()
        : null;

    const employmentType =
      typeof body.employmentType === "string" &&
      body.employmentType.trim().length
        ? body.employmentType.trim()
        : null;

    const seniority =
      typeof body.seniority === "string" && body.seniority.trim().length
        ? body.seniority.trim()
        : null;

    const jobFunction =
      typeof body.function === "string" && body.function.trim().length
        ? body.function.trim()
        : null;

    const industry =
      typeof body.industry === "string" && body.industry.trim().length
        ? body.industry.trim()
        : null;

    const remoteOption =
      typeof body.remoteOption === "string" &&
      body.remoteOption.trim().length
        ? body.remoteOption.trim()
        : null;

    const salaryCurrency =
      typeof body.salaryCurrency === "string" &&
      body.salaryCurrency.trim().length
        ? body.salaryCurrency.trim()
        : null;

    const salaryMinRaw =
      typeof body.salaryMin === "string" || typeof body.salaryMin === "number"
        ? Number(body.salaryMin)
        : NaN;
    const salaryMaxRaw =
      typeof body.salaryMax === "string" || typeof body.salaryMax === "number"
        ? Number(body.salaryMax)
        : NaN;

    const salaryMin = Number.isFinite(salaryMinRaw)
      ? salaryMinRaw
      : null;
    const salaryMax = Number.isFinite(salaryMaxRaw)
      ? salaryMaxRaw
      : null;

    const experienceMaxRaw =
      typeof body.experienceMax === "string" ||
      typeof body.experienceMax === "number"
        ? Number(body.experienceMax)
        : NaN;
    const experienceMax = Number.isFinite(experienceMaxRaw)
      ? experienceMaxRaw
      : null;

    const summary =
      typeof body.summary === "string" && body.summary.trim().length
        ? body.summary.trim()
        : null;

    const description =
      typeof body.description === "string" &&
      body.description.trim().length
        ? body.description.trim()
        : null;

    const requirements =
      typeof body.requirements === "string" &&
      body.requirements.trim().length
        ? body.requirements.trim()
        : null;

    const clientName =
      typeof body.clientName === "string" &&
      body.clientName.trim().length
        ? body.clientName.trim()
        : null;

    const clientSlug =
      typeof body.clientSlug === "string" &&
      body.clientSlug.trim().length
        ? body.clientSlug.trim()
        : null;

    const clientCompanyId =
      typeof body.clientCompanyId === "string" &&
      body.clientCompanyId.trim().length
        ? body.clientCompanyId.trim()
        : null;

    const isPublished = Boolean(body.isPublished);

    const rawStatus =
      typeof body.status === "string" ? body.status.trim() : "";
    const status = rawStatus || (isPublished ? "open" : "draft");

    // Tags = your skill / keyword taxonomy for now
    let tags: string[] | null = null;
    if (Array.isArray(body.tags)) {
      tags = body.tags
        .map((t: any) => String(t).trim())
        .filter(Boolean);
    } else if (typeof body.tags === "string") {
      tags = body.tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);
    }

    const nowIso = new Date().toISOString();
    const postedAt = isPublished ? nowIso : null;

    const supabase = await createSupabaseServerClient();

    // === INSERT INTO `jobs` USING YOUR REAL COLUMN NAMES ===
    const insertPayload: any = {
      slug,
      title: rawTitle,
      location: rawLocation,
      department,
      description,
      summary,
      requirements,
      // jobType & level left null for now – we’ll use them later if needed
      jobType: null,
      level: null,
      function: jobFunction,
      industry,
      remoteOption,
      experienceMax,
      salaryCurrency,
      salaryMin,
      salaryMax,
      isPublished,
      status,
      postedAt,
      createdAt: nowIso,
      updatedAt: nowIso,
      tenantId: currentTenant.id,
      employmentType,
      seniority,
      clientName,
      clientSlug,
      clientCompanyId,
    };

    if (tags && tags.length) {
      insertPayload.tags = tags;
    }

    const { data, error } = await supabase
      .from("jobs") // ✅ LOWERCASE jobs
      .insert([insertPayload])
      .select()
      .single();

    if (error) {
      console.error("❌ Error creating job in jobs table:", error);
      return NextResponse.json(
        {
          error:
            error.message ||
            error.details ||
            "Failed to create job in the database.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json(data, { status: 201 });
  } catch (err: any) {
    console.error("❌ Unexpected error in POST /api/jobs:", err);
    return NextResponse.json(
      {
        error:
          err?.message ||
          "An unexpected error occurred while creating the job.",
      },
      { status: 500 }
    );
  }
}

// GET /api/jobs  → list jobs for current tenant from `jobs`
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
      .from("jobs")
      .select(
        `
          id,
          title,
          department,
          location,
          employmentType,
          isPublished,
          status,
          createdAt,
          tenantId
        `
      )
      .eq("tenantId", currentTenant.id)
      .order("createdAt", { ascending: false });

    if (error) {
      console.error("⚠️ Error fetching jobs from jobs table:", error);
      return NextResponse.json(
        { error: "Unable to load jobs" },
        { status: 500 }
      );
    }

    return NextResponse.json(data ?? [], { status: 200 });
  } catch (err: any) {
    console.error("⚠️ Unexpected error in GET /api/jobs:", err);
    return NextResponse.json(
      { error: "Unexpected server error while loading jobs." },
      { status: 500 }
    );
  }
}
