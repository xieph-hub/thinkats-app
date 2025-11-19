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
 * GET /api/jobs
 * Used by admin (/ats) or elsewhere to list jobs.
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
 *
 * This is intentionally tolerant of different field names that might already
 * exist on your /ats form (title/roleTitle, function/department, etc.).
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();

    // ---- 1) Required: title ---------------------------------------------
    const rawTitle: string =
      (body.title ??
        body.roleTitle ??
        body.jobTitle ??
        body.name ??
        ""
      ).toString();

    const title = rawTitle.trim();
    if (!title) {
      return NextResponse.json(
        { error: "Job title is required." },
        { status: 400 }
      );
    }

    // ---- 2) Slug (auto-generate if missing) ------------------------------
    let rawSlug: string =
      (body.slug ?? body.jobSlug ?? "").toString().trim().toLowerCase();

    if (!rawSlug) {
      rawSlug = slugify(title);
    } else {
      rawSlug = slugify(rawSlug);
    }

    // Ensure slug is unique
    let slug = rawSlug;
    let counter = 1;
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const existing = await prisma.job.findFirst({
        where: { slug },
        select: { id: true },
      });
      if (!existing) break;
      slug = `${rawSlug}-${counter++}`;
    }

    // ---- 3) Tenant: use provided tenantId, env, or first tenant ----------
    let tenantId: string | null =
      (body.tenantId as string | undefined) ??
      (process.env.DEFAULT_TENANT_ID as string | undefined) ??
      null;

    if (!tenantId) {
      const tenant = await prisma.tenant.findFirst({
        select: { id: true },
      });

      if (!tenant) {
        console.error(
          "POST /api/jobs error: no tenant found and no DEFAULT_TENANT_ID set."
        );
        return NextResponse.json(
          {
            error:
              "No tenant found. Please create a tenant record or set DEFAULT_TENANT_ID.",
          },
          { status: 500 }
        );
      }

      tenantId = tenant.id;
    }

    // ---- 4) Optional fields (tolerant to multiple naming styles) ---------
    const location: string | null =
      (body.location ??
        body.jobLocation ??
        body.city ??
        ""
      )
        .toString()
        .trim() || null;

    const jobFunction: string | null =
      (body.function ??
        body.department ??
        body.jobFunction ??
        ""
      )
        .toString()
        .trim() || null;

    const employmentType: string | null =
      (body.employmentType ??
        body.type ??
        body.workType ??
        ""
      )
        .toString()
        .trim() || null;

    const seniority: string | null =
      (body.seniority ??
        body.level ??
        body.seniorityLevel ??
        ""
      )
        .toString()
        .trim() || null;

    const summary: string | null =
      (body.summary ??
        body.roleSummary ??
        ""
      )
        .toString()
        .trim() || null;

    const description: string | null =
      (body.description ??
        body.roleDescription ??
        ""
      )
        .toString()
        .trim() || null;

    let tags: string[] = [];
    if (Array.isArray(body.tags)) {
      tags = body.tags.map((t: any) => t?.toString?.().trim()).filter(Boolean);
    } else if (typeof body.tags === "string") {
      tags = body.tags
        .split(",")
        .map((t: string) => t.trim())
        .filter(Boolean);
    }

    const isPublished: boolean = Boolean(
      body.isPublished ?? body.publish ?? false
    );

    // Optional clientCompanyId (if your /ats passes it)
    const clientCompanyId: string | null =
      (body.clientCompanyId ?? body.companyId ?? null) || null;

    // ---- 5) Actually create the job in Prisma ----------------------------
    const job = await prisma.job.create({
      data: {
        tenantId,
        clientCompanyId,
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
    return NextResponse.json(
      {
        error:
          "Failed to create job. Please check server logs for more detail.",
      },
      { status: 500 }
    );
  }
}
