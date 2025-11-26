// app/api/ats/jobs/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const DEFAULT_TENANT_SLUG =
  process.env.RESOURCIN_TENANT_SLUG || "resourcin";

// Resolve the default tenant ID once per request
async function getDefaultTenantId() {
  if (process.env.RESOURCIN_TENANT_ID) {
    return process.env.RESOURCIN_TENANT_ID;
  }

  const tenant = await prisma.tenant.findFirst({
    where: { slug: DEFAULT_TENANT_SLUG },
  });

  if (!tenant) {
    throw new Error(
      `Default tenant not found for slug "${DEFAULT_TENANT_SLUG}". ` +
        `Create a tenant row in Supabase (tenants table) or set RESOURCIN_TENANT_ID.`,
    );
  }

  return tenant.id;
}

function slugify(raw: string): string {
  return raw
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // ------------------------------------------------------------------
    // Minimal validation (no zod)
    // ------------------------------------------------------------------
    if (
      !body ||
      typeof body.title !== "string" ||
      body.title.trim().length < 3
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Job title is required and must be at least 3 characters.",
        },
        { status: 400 },
      );
    }

    const tenantId = await getDefaultTenantId();

    // Destructure expected fields from the wizard payload
    const {
      // Core
      title,
      department,
      location,
      locationType,
      employmentType,
      experienceLevel,
      seniority,
      workMode,

      // Client
      clientCompanyId,

      // Narrative
      overview,
      aboutClient,
      responsibilities,
      requirements,
      benefits,
      shortDescription,

      // Meta
      externalId,

      // Arrays
      tags,
      requiredSkills,

      // Compensation
      salaryMin,
      salaryMax,
      salaryCurrency,
      salaryVisible,

      // Visibility flags from UI
      isPublic,
      isPublished,
      isConfidential,
      internalOnly,

      // Optional slug override
      slug,
    } = body;

    // ------------------------------------------------------------------
    // Slug generation & uniqueness per tenant
    // ------------------------------------------------------------------
    const baseSlug = slug ? slugify(slug) : slugify(title);
    let finalSlug: string | null = null;

    if (baseSlug) {
      let candidate = baseSlug;
      let suffix = 1;

      // Keep incrementing suffix until free
      // (cheap at your current scale)
      // eslint-disable-next-line no-constant-condition
      while (true) {
        const existing = await prisma.job.findFirst({
          where: { tenantId, slug: candidate },
        });

        if (!existing) {
          finalSlug = candidate;
          break;
        }

        suffix += 1;
        candidate = `${baseSlug}-${suffix}`;
      }
    }

    // ------------------------------------------------------------------
    // Map UI flags → actual DB fields
    // ------------------------------------------------------------------
    let visibility: "public" | "internal" =
      typeof isPublic === "boolean" && isPublic === false
        ? "internal"
        : "public";

    const status: string =
      typeof isPublished === "boolean" && isPublished === false
        ? "draft"
        : "open";

    const internalOnlyValue: boolean =
      typeof internalOnly === "boolean"
        ? internalOnly
        : typeof isPublic === "boolean" && isPublic === false
        ? true
        : false;

    const confidentialValue: boolean =
      typeof isConfidential === "boolean" ? isConfidential : false;

    // If internalOnly is true, force visibility to internal
    if (internalOnlyValue) {
      visibility = "internal";
    }

    // Prisma Decimal accepts string/number/Decimal
    const salaryMinValue =
      salaryMin !== undefined && salaryMin !== null && salaryMin !== ""
        ? (salaryMin as any)
        : null;

    const salaryMaxValue =
      salaryMax !== undefined && salaryMax !== null && salaryMax !== ""
        ? (salaryMax as any)
        : null;

    const safeClientCompanyId =
      typeof clientCompanyId === "string" &&
      clientCompanyId.trim().length > 0
        ? clientCompanyId
        : null;

    const job = await prisma.job.create({
      data: {
        tenantId,

        // Core
        title,
        department: department ?? null,
        location: location ?? null,
        locationType: locationType ?? null,
        employmentType: employmentType ?? null,
        experienceLevel: experienceLevel ?? null,
        seniority: seniority ?? null,
        workMode: workMode ?? null,

        // Client
        clientCompanyId: safeClientCompanyId,

        // Narrative
        overview: overview ?? null,
        aboutClient: aboutClient ?? null,
        responsibilities: responsibilities ?? null,
        requirements: requirements ?? null,
        benefits: benefits ?? null,
        shortDescription: shortDescription ?? null,

        // Meta
        externalId: externalId ?? null,

        // Arrays
        tags: Array.isArray(tags) ? tags : [],
        requiredSkills: Array.isArray(requiredSkills)
          ? requiredSkills
          : [],

        // Compensation
        salaryMin: salaryMinValue,
        salaryMax: salaryMaxValue,
        salaryCurrency: salaryCurrency ?? null,
        salaryVisible:
          typeof salaryVisible === "boolean" ? salaryVisible : false,

        // Visibility / flags
        visibility,
        status,
        internalOnly: internalOnlyValue,
        confidential: confidentialValue,

        // Slug
        slug: finalSlug,
      },
    });

    return NextResponse.json(
      {
        success: true,
        job,
      },
      { status: 201 },
    );
  } catch (err: any) {
    console.error("POST /api/ats/jobs error", err);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to create job",
      },
      { status: 500 },
    );
  }
}
