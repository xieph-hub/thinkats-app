// app/api/jobs/[slug]/apply/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { uploadCv } from "@/lib/uploadCv";

export const runtime = "nodejs";

type IdRow = { id: string };

export async function POST(
  req: Request,
  { params }: { params: { slug: string } }
) {
  try {
    const formData = await req.formData();

    const jobSlugFromBody =
      ((formData.get("jobSlug") as string | null) || "").trim();

    const fullName = (formData.get("fullName") as string | null)?.trim();
    const email = (formData.get("email") as string | null)?.trim();
    const phone = (formData.get("phone") as string | null) || null;
    const location = (formData.get("location") as string | null) || null;
    const linkedinUrl = (formData.get("linkedinUrl") as string | null) || null;
    const portfolioUrl =
      (formData.get("portfolioUrl") as string | null) || null;

    // Optional candidate notes/headline
    const headline = (formData.get("headline") as string | null) || null;
    const notes = (formData.get("notes") as string | null) || null;

    // Optional CV link
    const cvUrlFromLinkRaw = (formData.get("cvUrl") as string | null) || "";
    const cvUrlFromLink =
      cvUrlFromLinkRaw.trim().length > 0 ? cvUrlFromLinkRaw.trim() : null;

    // Uploaded CV file from <input name="cv" />
    const cvFile = formData.get("cv") as File | null;

    if (!fullName || !email) {
      return NextResponse.json(
        { error: "Full name and email are required." },
        { status: 400 }
      );
    }

    const slug = (jobSlugFromBody || params.slug).trim();

    // Build cover_letter from headline + notes
    let coverLetter: string | null = null;
    if (headline || notes) {
      const parts: string[] = [];
      if (headline) {
        parts.push(`Headline / value areas:\n${headline}`);
      }
      if (notes) {
        parts.push(`Additional context:\n${notes}`);
      }
      coverLetter = parts.join("\n\n");
    }

    // 1) Resolve tenant id from tenants table using slug
    const tenantSlug = process.env.RESOURCIN_TENANT_SLUG || "resourcin";

    const tenants = await prisma.$queryRaw<IdRow[]>`
      SELECT id
      FROM tenants
      WHERE slug = ${tenantSlug}
      LIMIT 1
    `;

    if (!tenants || tenants.length === 0) {
      console.error("No tenant found for slug:", tenantSlug);
      return NextResponse.json(
        { error: "Tenant configuration missing." },
        { status: 500 }
      );
    }

    const tenantId = tenants[0].id;

    // 2) Find the job by slug within this tenant
    const jobs = await prisma.$queryRaw<IdRow[]>`
      SELECT id
      FROM jobs
      WHERE slug = ${slug} AND tenant_id = ${tenantId}
      LIMIT 1
    `;

    if (!jobs || jobs.length === 0) {
      return NextResponse.json(
        { error: "Job not found for this slug." },
        { status: 404 }
      );
    }

    const jobId = jobs[0].id;

    // 3) Determine CV URL: link takes precedence, else upload file
    let cvUrl: string | null = cvUrlFromLink;

    if (!cvUrl && cvFile && cvFile.size > 0) {
      cvUrl = await uploadCv({
        file: cvFile,
        jobId,
        candidateEmail: email,
      });
    }

    // 4) Upsert candidate (by email + tenant)
    const existingCandidates = await prisma.$queryRaw<IdRow[]>`
      SELECT id
      FROM candidates
      WHERE email = ${email} AND tenant_id = ${tenantId}
      LIMIT 1
    `;

    let candidateId: string;

    if (existingCandidates.length > 0) {
      candidateId = existingCandidates[0].id;

      // Update candidate
      await prisma.$executeRaw`
        UPDATE candidates
        SET
          full_name    = ${fullName},
          phone        = ${phone},
          location     = ${location},
          linkedin_url = ${linkedinUrl},
          cv_url       = ${cvUrl},
          updated_at   = NOW()
        WHERE id = ${candidateId}
      `;
    } else {
      // Insert new candidate
      const insertedCandidates = await prisma.$queryRaw<IdRow[]>`
        INSERT INTO candidates (
          tenant_id,
          full_name,
          email,
          phone,
          location,
          linkedin_url,
          cv_url,
          source
        )
        VALUES (
          ${tenantId},
          ${fullName},
          ${email},
          ${phone},
          ${location},
          ${linkedinUrl},
          ${cvUrl},
          ${"Website"}
        )
        RETURNING id
      `;

      candidateId = insertedCandidates[0].id;
    }

    // 5) Create job_application row
    const insertedApplications = await prisma.$queryRaw<IdRow[]>`
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
        source
      )
      VALUES (
        ${jobId},
        ${candidateId},
        ${fullName},
        ${email},
        ${phone},
        ${location},
        ${linkedinUrl},
        ${portfolioUrl},
        ${cvUrl},
        ${coverLetter},
        ${"Website"}
      )
      RETURNING id
    `;

    const applicationId = insertedApplications[0].id;

    return NextResponse.json(
      { ok: true, applicationId },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating application", error);
    return NextResponse.json(
      {
        error:
          "Unexpected error while creating your application. Please try again.",
      },
      { status: 500 }
    );
  }
}
