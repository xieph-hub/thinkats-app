// app/api/ats/jobs/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";

type Intent = "draft" | "publish";

function slugify(title: string) {
  const base = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  const suffix = Math.random().toString(36).slice(2, 8);
  return `${base}-${suffix}`;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const tenantId = body.tenantId as string | undefined;

    // --- submit_mode / intent normalisation ---
    const submitModeRaw =
      (body.submit_mode as string | undefined) ??
      (body.submitMode as string | undefined) ??
      (body.intent as Intent | string | undefined) ??
      "draft";

    const submitMode = submitModeRaw.toLowerCase();

    if (!tenantId) {
      return NextResponse.json(
        { error: "Missing tenantId" },
        { status: 400 }
      );
    }

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

    const shortDescription =
      (body.shortDescription as string | undefined)?.trim() || null;
    const department =
      (body.department as string | undefined)?.trim() || null;

    const locationType =
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

    const internalOnly =
      (body.internalOnly as boolean | undefined) ?? false;
    const confidential =
      (body.confidential as boolean | undefined) ?? false;

    // --- NEW: tags_raw handling ---
    const rawTagsInput =
      (body.tags_raw as string | undefined) ??
      (body.tagsRaw as string | undefined) ??
      "";

    const tagsFromRaw =
      rawTagsInput
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean) || [];

    // --- Map locationType to work_mode (ATS-facing field) ---
    let workMode: "remote" | "hybrid" | "onsite" | "flexible" | null = null;
    switch (locationType) {
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

    // --- NEW: visibility normalisation (public / internal / confidential) ---
    const visibilityInput = (body.visibility as string | undefined)
      ?.toLowerCase()
      .trim();

    let visibility: "public" | "internal" | "confidential" = "public";

    if (visibilityInput === "internal") {
      visibility = "internal";
    } else if (visibilityInput === "confidential") {
      visibility = "confidential";
    } else if (internalOnly) {
      visibility = "internal";
    } else if (confidential) {
      visibility = "confidential";
    } else {
      visibility = "public";
    }

    // Keep booleans consistent with final visibility
    const internalOnlyFinal = visibility === "internal";
    const confidentialFinal = visibility === "confidential";

    // --- NEW: status normalisation from submit_mode ---
    // You can extend this later (e.g. "on_hold", "closed").
    let status: string = "draft";
    if (submitMode === "publish" || submitMode === "open") {
      status = "open";
    } else if (submitMode === "close" || submitMode === "closed") {
      status = "closed";
    } else if (submitMode === "hold" || submitMode === "on_hold") {
      status = "on_hold";
    } else {
      status = "draft";
    }

    // --- NEW: send work_mode as a normalised tag so /jobs + detail can derive work mode ---
    let workModeTag: string | null = null;
    if (workMode === "remote") workModeTag = "remote";
    else if (workMode === "hybrid") workModeTag = "hybrid";
    else if (workMode === "flexible") workModeTag = "flexible";
    else if (workMode === "onsite") workModeTag = "on-site";

    const tags = Array.from(
      new Set(
        [
          ...tagsFromRaw,
          ...(workModeTag ? [workModeTag] : []),
        ].filter(Boolean)
      )
    );

    const slug = slugify(title);

    const insertPayload: Record<string, unknown> = {
      tenant_id: tenantId,
      title,
      short_description: shortDescription,
      description,
      department,
      location,
      location_type: locationType,
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
      internal_only: internalOnlyFinal,
      confidential: confidentialFinal,
      status,
      visibility,
      work_mode: workMode,
      slug,
      // NEW: tags array for public site + filters + deriveWorkMode
      tags: tags.length ? tags : null,
    };

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
