// app/api/ats/jobs/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getResourcinTenant } from "@/lib/tenant";

function slugify(input: string): string {
  return input
    .toString()
    .trim()
    .toLowerCase()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function toStringOrNull(value: FormDataEntryValue | null): string | null {
  if (!value) return null;
  const s = value.toString().trim();
  return s.length ? s : null;
}

function parseNumberValue(
  value: FormDataEntryValue | null,
): number | null {
  if (!value) return null;
  const s = value.toString().replace(/,/g, "").trim();
  if (!s) return null;
  const n = Number(s);
  if (Number.isNaN(n)) return null;
  return n;
}

function parseStringList(raw: string | null): string[] {
  if (!raw) return [];
  return raw
    .split(/[\n,]+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

export async function POST(req: NextRequest) {
  try {
    const tenant = await getResourcinTenant();

    if (!tenant) {
      return NextResponse.json(
        { error: "No default tenant configured." },
        { status: 500 },
      );
    }

    const formData = await req.formData();

    // ----- Required: title -----
    const titleRaw = formData.get("title");
    const title =
      typeof titleRaw === "string" ? titleRaw.trim() : "";

    if (!title) {
      return NextResponse.json(
        { error: "Title is required." },
        { status: 400 },
      );
    }

    // ----- Core relations / ownership -----
    const clientCompanyId = toStringOrNull(
      formData.get("clientCompanyId"),
    );

    const hiringManagerId = toStringOrNull(
      formData.get("hiringManagerId"),
    );

    // ----- Basic classification -----
    const location = toStringOrNull(formData.get("location"));

    // We label this as “Work mode” in the UI
    const workMode = toStringOrNull(formData.get("workMode"));

    const employmentType = toStringOrNull(
      formData.get("employmentType"),
    );

    const experienceLevel = toStringOrNull(
      formData.get("experienceLevel"),
    );

    const yearsExperienceMin = parseNumberValue(
      formData.get("yearsExperienceMin"),
    );
    const yearsExperienceMax = parseNumberValue(
      formData.get("yearsExperienceMax"),
    );

    // Function / discipline mapped to Job.department
    const department = toStringOrNull(formData.get("department"));

    // ----- Narrative fields -----
    const shortDescription = toStringOrNull(
      formData.get("shortDescription"),
    );
    const overview = toStringOrNull(formData.get("overview"));
    const aboutClient = toStringOrNull(
      formData.get("aboutClient"),
    );
    const responsibilities = toStringOrNull(
      formData.get("responsibilities"),
    );
    const requirements = toStringOrNull(
      formData.get("requirements"),
    );
    const benefits = toStringOrNull(formData.get("benefits"));

    // ----- Education -----
    const educationRequired = toStringOrNull(
      formData.get("educationRequired"),
    );
    const educationField = toStringOrNull(
      formData.get("educationField"),
    );

    // ----- Tags & skills (String[]) -----
    const tagsRaw = toStringOrNull(formData.get("tags"));
    const requiredSkillsRaw = toStringOrNull(
      formData.get("requiredSkills"),
    );

    const tags = parseStringList(tagsRaw);
    const requiredSkills = parseStringList(requiredSkillsRaw);

    // ----- Status / visibility -----
    const statusRaw = toStringOrNull(formData.get("status"));
    const visibilityRaw = toStringOrNull(
      formData.get("visibility"),
    );

    const status =
      statusRaw && ["draft", "open", "closed"].includes(statusRaw)
        ? statusRaw
        : "draft";

    const visibility =
      visibilityRaw &&
      ["public", "internal"].includes(visibilityRaw)
        ? visibilityRaw
        : "public";

    const internalOnly =
      formData.get("internalOnly") === "on" ? true : false;
    const confidential =
      formData.get("confidential") === "on" ? true : false;
    const salaryVisible =
      formData.get("salaryVisible") === "on" ? true : false;

    // ----- Compensation -----
    const salaryMin = parseNumberValue(formData.get("salaryMin"));
    const salaryMax = parseNumberValue(formData.get("salaryMax"));
    const salaryCurrency =
      toStringOrNull(formData.get("salaryCurrency")) ?? "NGN";

    // ----- Slug generation (per tenant) -----
    const slugSource =
      toStringOrNull(formData.get("slug")) ?? title;
    const baseSlug = slugify(slugSource);
    let slug: string | null = baseSlug || null;

    if (slug) {
      const existing = await prisma.job.findFirst({
        where: {
          tenantId: tenant.id,
          slug,
        },
        select: { id: true },
      });

      if (existing) {
        slug = `${baseSlug}-${Date.now().toString(36)}`;
      }
    }

    // ----- Create job -----
    const job = await prisma.job.create({
      data: {
        tenantId: tenant.id,
        clientCompanyId,
        title,
        slug,

        // Classification
        department,
        location,
        workMode,
        // Keep locationType in sync for now (backwards-compat chips, etc.)
        locationType: workMode ?? null,
        employmentType,
        experienceLevel,
        yearsExperienceMin: yearsExperienceMin ?? null,
        yearsExperienceMax: yearsExperienceMax ?? null,

        // Narrative
        shortDescription,
        overview,
        aboutClient,
        responsibilities,
        requirements,
        benefits,

        // Education
        educationRequired,
        educationField,

        // Arrays
        tags,
        requiredSkills,

        // Status & flags
        status,
        visibility,
        internalOnly,
        confidential,

        // Compensation
        salaryMin,
        salaryMax,
        salaryCurrency,
        salaryVisible,

        // Owner / recruiter
        hiringManagerId,
      },
    });

    // Redirect to the ATS job pipeline view for this role
    const redirectUrl = new URL(
      `/ats/jobs/${job.id}`,
      req.url,
    ).toString();

    return NextResponse.redirect(redirectUrl, {
      status: 303,
    });
  } catch (error) {
    console.error("POST /api/ats/jobs error", error);
    return NextResponse.json(
      { error: "Failed to create job." },
      { status: 500 },
    );
  }
}
