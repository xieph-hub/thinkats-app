// app/api/ats/jobs/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";

function slugify(title: string) {
  const base = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  const suffix = Math.random().toString(36).slice(2, 8);
  return `${base}-${suffix}`;
}

type Status = "open" | "draft";
type Visibility = "public" | "internal" | "confidential";
type WorkMode = "remote" | "hybrid" | "onsite" | "flexible" | null;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const tenantId = body.tenantId as string | undefined;
    if (!tenantId) {
      return NextResponse.json(
        { error: "Missing tenantId" },
        { status: 400 }
      );
    }

    // --- NEW: optional client company id (for multi-client posting) ---
    const clientCompanyId =
      (body.clientCompanyId as string | undefined) ??
      (body.client_company_id as string | undefined) ??
      undefined;

    // ---- CORE FIELDS ----
    const title = (body.title as string | undefined)?.trim();
    const description = (body.description as string | undefined)?.trim();
    const location = (body.location as string | undefined)?.trim();
    const employmentType = body.employmentType as string | undefined;

    if (!title || !description || !location || !employmentType) {
      return NextResponse.json(
        {
          error:
            "Job title, description, location and employment type are required.",
        },
        { status: 400 }
      );
    }

    // ---- BASIC OPTIONALS ----
    const shortDescription =
      (body.shortDescription as string | undefined)?.trim() || null;
    const department =
      (body.department as string | undefined)?.trim() || null;

    const locationTypeRaw =
      (body.locationType as string | undefined)?.toLowerCase() || null;

    const experienceLevel =
      (body.experienceLevel as string | undefined) || null;

    const yearsMinRaw = body.yearsExperienceMin as string | null;
    const yearsMaxRaw = body.yearsExperienceMax as string | null;

    const yearsExperienceMin =
      yearsMinRaw && yearsMinRaw !== "" ? parseInt(yearsMinRaw, 10) : null;
    const yearsExperienceMax =
      yearsMaxRaw && yearsMaxRaw !== "" ? parseInt(yearsMaxRaw, 10) : null;

    const salaryMinRaw = body.salaryMin as string | null;
    const salaryMaxRaw = body.salaryMax as string | null;

    const salaryMin =
      salaryMinRaw && salaryMinRaw !== "" ? parseFloat(salaryMinRaw) : null;
    const salaryMax =
      salaryMaxRaw && salaryMaxRaw !== "" ? parseFloat(salaryMaxRaw) : null;

    const salaryCurrency =
      (body.salaryCurrency as string | undefined) || null;
    const salaryVisible =
      (body.salaryVisible as boolean | undefined) ?? false;

    const requiredSkillsRaw =
      (body.requiredSkills as string | undefined) || "";
    const requiredSkills =
      requiredSkillsRaw
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean) || [];

    const educationRequired =
      (body.educationRequired as string | undefined) || null;
    const educationField =
      (body.educationField as string | undefined) || null;

    // ---- SUBMIT MODE → status ----
    const submitModeRaw =
      (body.submit_mode as string | undefined) ??
      (body.submitMode as string | undefined) ??
      (body.intent as string | undefined);

    let status: Status = "draft";
    if (
      submitModeRaw &&
      submitModeRaw.toString().toLowerCase() === "publish"
    ) {
      status = "open";
    }

    // ---- VISIBILITY + INTERNAL / CONFIDENTIAL ----
    const visibilityRaw = (body.visibility as string | undefined)?.toLowerCase();

    const legacyInternalOnly =
      (body.internalOnly as boolean | undefined) ?? false;
    const legacyConfidential =
      (body.confidential as boolean | undefined) ?? false;

    let visibility: Visibility = "public";

    if (visibilityRaw === "internal") {
      visibility = "internal";
    } else if (visibilityRaw === "confidential") {
      visibility = "confidential";
    } else {
      if (legacyConfidential) {
        visibility = "confidential";
      } else if (legacyInternalOnly) {
        visibility = "internal";
      }
    }

    const internalOnly = visibility === "internal";
    const confidential = visibility === "confidential";

    // ---- WORK MODE ----
    const workModeRaw =
      (body.work_mode as string | undefined)?.toLowerCase() || null;

    let workMode: WorkMode = null;

    const workSource = workModeRaw || locationTypeRaw;

    switch (workSource) {
      case "remote":
        workMode = "remote";
        break;
      case "hybrid":
        workMode = "hybrid";
        break;
      case "onsite":
      case "on-site":
        workMode = "onsite";
        break;
      case "flexible":
        workMode = "flexible";
        break;
      default:
        workMode = null;
    }

    // ---- TAGS (tags_raw → tags[]) ----
    const tagsRaw =
      (body.tags_raw as string | undefined) ||
      (body.tagsRaw as string | undefined) ||
      "";
    const tags =
      tagsRaw
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean) || [];

    const slug = slugify(title);

    const insertPayload: Record<string, unknown> = {
      tenant_id: tenantId,
      title,
      short_description: shortDescription,
      description,
      department,
      location,
      location_type: locationTypeRaw,
      employment_type: employmentType,
      experience_level: experienceLevel,
      years_experience_min: yearsExperienceMin,
      years_experience_max: yearsExperienceMax,
      salary_min: salaryMin,
      salary_max: salaryMax,
      salary_currency: salaryMin || salaryMax ? salaryCurrency : null,
      salary_visible: salaryMin || salaryMax ? salaryVisible : false,
      required_skills: requiredSkills.length ? requiredSkills : null,
      education_required: educationRequired,
      education_field: educationField,
      internal_only: internalOnly,
      confidential,
      status,
      visibility,
      work_mode: workMode,
      tags: tags.length ? tags : null,
      slug,
    };

    // --- NEW: attach client company if provided ---
    if (clientCompanyId) {
      insertPayload.client_company_id = clientCompanyId;
    }

    const { data, error } = await supabaseAdmin
      .from("jobs")
      .insert(insertPayload)
      .select("id, slug")
      .single();

    if (error || !data) {
      console.error("Error inserting job", error);
      return NextResponse.json(
        { error: "Failed to create job" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        jobId: data.id as string,
        slug: (data.slug as string | null) ?? null,
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("Unexpected error in ATS job creation", err);
    return NextResponse.json(
      { error: "Unexpected error" },
      { status: 500 }
    );
  }
}
