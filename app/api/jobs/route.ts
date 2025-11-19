// app/api/jobs/route.ts

import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const prisma = new PrismaClient();

/**
 * Simple slugify helper
 */
function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

/**
 * Ensure a non-empty string for required Prisma fields.
 */
function ensureString(value: unknown, fallback: string): string {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : fallback;
  }
  if (value == null) {
    return fallback;
  }
  const asString = String(value).trim();
  return asString.length > 0 ? asString : fallback;
}

/**
 * Resolve a valid tenantId:
 * - Prefer body.tenantId if it points to an existing tenant
 * - Else try DEFAULT_TENANT_ID
 * - Else fall back to the first tenant in the DB
 */
async function resolveTenantId(bodyTenantId?: string | null): Promise<string> {
  // 1) If body has tenantId and it exists, use it
  if (bodyTenantId) {
    const existing = await prisma.tenant.findUnique({
      where: { id: bodyTenantId },
      select: { id: true },
    });
    if (existing) return existing.id;
  }

  // 2) Try DEFAULT_TENANT_ID from env
  const envTenantId = process.env.DEFAULT_TENANT_ID;
  if (envTenantId) {
    const existing = await prisma.tenant.findUnique({
      where: { id: envTenantId },
      select: { id: true },
    });
    if (existing) return existing.id;
  }

  // 3) Fallback: first tenant in DB
  const firstTenant = await prisma.tenant.findFirst({
    select: { id: true },
  });

  if (!firstTenant) {
    throw new Error(
      "No tenant found. Please create a Tenant row or set DEFAULT_TENANT_ID."
    );
  }

  return firstTenant.id;
}

/**
 * GET /api/jobs
 * Used by ATS and other admin views to list jobs.
 */
export async function GET() {
  try {
    const jobs = await prisma.job.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        tenant: true,
        clientCompany: true,
      },
    });

    return NextResponse.json({ jobs });
  } catch (error) {
    console.error("GET /api/jobs error", error);
    return NextResponse.json(
      { error: "Failed to fetch jobs." },
      { status: 500 }
    );
  }
}

/**
 * POST /api/jobs
 * Create a new job (called from /ats).
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();

    // ---- 1) Title (required) ---------------------------------------------
    const rawTitle =
      body.title ??
      body.roleTitle ??
      body.jobTitle ??
      body.name ??
      "";
    const title = ensureString(rawTitle, "Untitled role");

    // ---- 2) Slug (required, unique) --------------------------------------
    let rawSlug: string =
      (body.slug ?? body.jobSlug ?? "").toString().trim().toLowerCase();

    if (!rawSlug) {
      rawSlug = slugify(title);
    } else {
      rawSlug = slugify(rawSlug);
    }

    let slug = rawSlug;
    let counter = 1;
    // Ensure slug uniqueness per schema (global uniqueness is still fine)
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const existing = await prisma.job.findFirst({
        where: { slug },
        select: { id: true },
      });
      if (!existing) break;
      slug = `${rawSlug}-${counter++}`;
    }

    // ---- 3) Tenant (required relation) -----------------------------------
    const tenantId = await resolveTenantId(body.tenantId as string | undefined);

    // ---- 4) Other required/optional fields -------------------------------
    const location = ensureString(
      body.location ?? body.jobLocation ?? body.city,
      "Location flexible / to be discussed"
    );

    const jobFunction = ensureString(
      body.function ?? body.department ?? body.jobFunction,
      "Generalist / cross-functional"
    );

    const employmentType = ensureString(
      body.employmentType ?? body.type ?? body.workType,
      "Full-time"
    );

    const seniority = ensureString(
      body.seniority ?? body.level ?? body.seniorityLevel,
      "Not specified"
    );

    const summary = ensureString(
      body.summary ?? body.roleSummary,
      "This role is part of an ongoing Resourcin search. A more detailed summary will be shared at screening."
    );

    const description = ensureString(
      body.description ?? body.roleDescription,
      "Full job description will be shared at screening. This listing is part of an active search managed by Resourcin."
    );

    let tags: string[] = [];
    if (Array.isArray(body.tags)) {
      tags = body.tags
        .map((t: any) => t?.toString?.().trim())
        .filter((t: string | undefined) => !!t) as string[];
    } else if (typeof body.tags === "string") {
      tags = body.tags
        .split(",")
        .map((t: string) => t.trim())
        .filter(Boolean);
    }

    const isPublished: boolean = Boolean(
      body.isPublished ?? body.publish ?? true
    );

    const clientCompanyId: string | null =
      (body.clientCompanyId ?? body.companyId ?? null) || null;

    // ---- 5) Create job in Prisma -----------------------------------------
    const job = await prisma.job.create({
      data: {
        // REQUIRED relation: connect to existing tenant
        tenant: {
          connect: { id: tenantId },
        },
        // Optional relation
        clientCompany:
          clientCompanyId != null
            ? {
                connect: { id: clientCompanyId },
              }
            : undefined,

        title,
        slug,
        location,
        function: jobFunction,
        employmentType,
        seniority,
        summary,
        description,
        tags,
        isPublished,
      },
    });

    return NextResponse.json({ job }, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/jobs error", error);

    // Small hint surface for you, but generic message to client
    return NextResponse.json(
      {
        error:
          "Failed to create job. Please try again later or contact support if this persists.",
      },
      { status: 500 }
    );
  }
}
