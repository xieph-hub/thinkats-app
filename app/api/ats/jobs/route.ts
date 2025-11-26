// app/api/ats/jobs/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const jobPayloadSchema = z.object({
  // Core
  title: z.string().min(3),
  department: z.string().optional(),
  location: z.string().optional(),
  locationType: z.string().optional(),
  employmentType: z.string().optional(),
  experienceLevel: z.string().optional(),
  seniority: z.string().optional(),
  workMode: z.string().optional(),

  // Client
  clientCompanyId: z.string().optional(),

  // Narrative sections
  overview: z.string().optional(),
  aboutClient: z.string().optional(),
  responsibilities: z.string().optional(),
  requirements: z.string().optional(),
  benefits: z.string().optional(),
  shortDescription: z.string().optional(),

  // Meta / taxonomies (currently mostly UI-level)
  industry: z.string().optional(),
  function: z.string().optional(),

  // Arrays
  tags: z.array(z.string()).optional(),
  requiredSkills: z.array(z.string()).optional(),

  // Compensation
  salaryMin: z.union([z.number(), z.string()]).optional(),
  salaryMax: z.union([z.number(), z.string()]).optional(),
  salaryCurrency: z.string().optional(),
  salaryVisible: z.boolean().optional(),

  // Visibility / flags from the wizard
  isPublic: z.boolean().optional(),
  isPublished: z.boolean().optional(),
  isConfidential: z.boolean().optional(),
  internalOnly: z.boolean().optional(),

  // Optional external / slug
  externalId: z.string().optional(),
  slug: z.string().optional(),
});

const DEFAULT_TENANT_SLUG =
  process.env.RESOURCIN_TENANT_SLUG || "resourcin";

async function getDefaultTenantId() {
  // If you ever set this, we skip the lookup
  if (process.env.RESOURCIN_TENANT_ID) {
    return process.env.RESOURCIN_TENANT_ID;
  }

  const tenant = await prisma.tenant.findFirst({
    where: { slug: DEFAULT_TENANT_SLUG },
  });

  if (!tenant) {
    throw new Error(
      `Default tenant not found for slug "${DEFAULT_TENANT_SLUG}". ` +
        `Create a tenant row or set RESOURCIN_TENANT_ID.`,
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
    const json = await req.json();
    const parsed = jobPayloadSchema.parse(json);

    const tenantId = await getDefaultTenantId();

    const {
      isPublic,
      isPublished,
      isConfidential,
      internalOnly,
      tags,
      requiredSkills,
      salaryMin,
      salaryMax,
      slug,
      // everything else:
      title,
      department,
      location,
      locationType,
      employmentType,
      experienceLevel,
      seniority,
      workMode,
      clientCompanyId,
      overview,
      aboutClient,
      responsibilities,
      requirements,
      benefits,
      shortDescription,
      externalId,
      salaryCurrency,
      salaryVisible,
      // industry, function are currently UI-level only
    } = parsed;

    // ------------------------------------------------------------------
    // Slug generation & uniqueness per tenant
    // ------------------------------------------------------------------
    const baseSlug = slug ? slugify(slug) : slugify(title);
    let finalSlug: string | null = null;

    if (baseSlug) {
      let candidate = baseSlug;
      let suffix = 1;

      // Ensure uniqueness within this tenant
      // (very cheap query at your current scale)
      // If you ever add a unique index on (tenant_id, slug),
      // this logic plus DB constraint will keep it tight.
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
    // Map wizard flags → real Prisma fields
    // ------------------------------------------------------------------
    const visibility = isPublic === false ? "internal" : "public";
    const status = isPublished === false ? "draft" : "open";

    const internalOnlyValue =
      typeof internalOnly === "boolean"
        ? internalOnly
        : isPublic === false
        ? true
        : false;

    const confidentialValue =
      typeof isConfidential === "boolean" ? isConfidential : false;

    // Prisma Decimal columns accept string/number/Decimal.
    const salaryMinValue =
      salaryMin !== undefined && salaryMin !== null
        ? (salaryMin as any)
        : null;
    const salaryMaxValue =
      salaryMax !== undefined && salaryMax !== null
        ? (salaryMax as any)
        : null;

    const job = await prisma.job.create({
      data: {
        tenantId,

        title,
        department: department ?? null,
        location: location ?? null,
        locationType: locationType ?? null,
        employmentType: employmentType ?? null,
        experienceLevel: experienceLevel ?? null,
        seniority: seniority ?? null,
        workMode: workMode ?? null,

        // Client
        clientCompanyId: clientCompanyId ?? null,

        // Narrative sections
        overview: overview ?? null,
        aboutClient: aboutClient ?? null,
        responsibilities: responsibilities ?? null,
        requirements: requirements ?? null,
        benefits: benefits ?? null,
        shortDescription: shortDescription ?? null,

        // Meta
        externalId: externalId ?? null,

        // Arrays
        tags: tags ?? [],
        requiredSkills: requiredSkills ?? [],

        // Compensation
        salaryMin: salaryMinValue,
        salaryMax: salaryMaxValue,
        salaryCurrency: salaryCurrency ?? null,
        salaryVisible: typeof salaryVisible === "boolean" ? salaryVisible : false,

        // Visibility / flags mapped to real fields
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
    // Zod validation error
    if (err?.name === "ZodError") {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid job payload",
          issues: err.issues,
        },
        { status: 400 },
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: "Failed to create job",
      },
      { status: 500 },
    );
  }
}
