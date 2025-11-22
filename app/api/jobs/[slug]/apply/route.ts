// app/api/jobs/[slug]/apply/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type RouteParams = { params: { slug: string } };

function looksLikeUuid(value: string): boolean {
  return /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(
    value
  );
}

type JobRowDb = {
  id: string;
};

export async function POST(req: NextRequest, { params }: RouteParams) {
  const slugOrId = params.slug;

  try {
    // Parse JSON body safely
    let body: any;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { ok: false, error: "Invalid JSON body." },
        { status: 400 }
      );
    }

    const {
      fullName,
      email,
      phone,
      location,
      linkedinUrl,
      portfolioUrl,
      cvUrl,
      coverLetter,
      source,
    } = body ?? {};

    if (
      !fullName ||
      typeof fullName !== "string" ||
      !email ||
      typeof email !== "string"
    ) {
      return NextResponse.json(
        { ok: false, error: "Full name and email are required." },
        { status: 400 }
      );
    }

    // 1) Find open + public job either by slug or by id (uuid)
    let jobRow: JobRowDb | null = null;

    if (looksLikeUuid(slugOrId)) {
      const rowsById = await prisma.$queryRaw<JobRowDb[]>`
        SELECT id
        FROM jobs
        WHERE id = ${slugOrId}::uuid
          AND status = 'open'
          AND visibility = 'public'
        LIMIT 1;
      `;
      jobRow = rowsById[0] ?? null;
    } else {
      const rowsBySlug = await prisma.$queryRaw<JobRowDb[]>`
        SELECT id
        FROM jobs
        WHERE slug = ${slugOrId}
          AND status = 'open'
          AND visibility = 'public'
        LIMIT 1;
      `;
      jobRow = rowsBySlug[0] ?? null;
    }

    if (!jobRow) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Job not found, closed, or not publicly visible. Please check the job link.",
        },
        { status: 404 }
      );
    }

    // 2) Insert application row directly into job_applications
    const inserted = await prisma.$queryRaw<{ id: string }[]>`
      INSERT INTO job_applications (
        job_id,
        candidate_id,
        full_name,
        email,
        phone,
        location,
        linkedin_url,
        portfolio_url,
        cv_url,
        cover_letter,
        source,
        stage,
        status
      )
      VALUES (
        ${jobRow.id}::uuid,
        NULL,
        ${fullName},
        ${email},
        ${phone || null},
        ${location || null},
        ${linkedinUrl || null},
        ${portfolioUrl || null},
        ${cvUrl || null},
        ${coverLetter || null},
        ${source || "Website"},
        'APPLIED',
        'PENDING'
      )
      RETURNING id;
    `;

    const applicationId = inserted[0]?.id;

    return NextResponse.json(
      { ok: true, applicationId },
      { status: 200 }
    );
  } catch (err: any) {
    console.error("Error creating application", err);
    return NextResponse.json(
      {
        ok: false,
        error: "Unexpected error while creating your application.",
        details:
          process.env.NODE_ENV === "development"
            ? String(err?.message ?? err)
            : undefined,
      },
      { status: 500 }
    );
  }
}
