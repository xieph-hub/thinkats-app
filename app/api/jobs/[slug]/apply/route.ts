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
    const contentType = req.headers.get("content-type") || "";

    // Unified payload
    let jobSlugFromBody: string | null = null;
    let fullName: string | null = null;
    let email: string | null = null;
    let phone: string | null = null;
    let location: string | null = null;
    let linkedinUrl: string | null = null;
    let portfolioUrl: string | null = null;
    let headline: string | null = null;
    let notes: string | null = null;
    let cvUrlFromLink: string | null = null;
    let cvFile: File | null = null;

    // --- Branch 1: JSON body (old callers) ---
    if (contentType.includes("application/json")) {
      const body: any = (await req.json().catch(() => ({}))) || {};

      jobSlugFromBody =
        (body.jobSlug || body.job_slug || body.slug || "").toString().trim() ||
        null;

      const rawFullName =
        body.fullName || body.full_name || body.name || null;
      const rawEmail =
        body.email || body.emailAddress || body.email_address || null;

      fullName =
        typeof rawFullName === "string" && rawFullName.trim().length > 0
          ? rawFullName.trim()
          : null;
      email =
        typeof rawEmail === "string" && rawEmail.trim().length > 0
          ? rawEmail.trim()
          : null;

      phone =
        typeof body.phone === "string" && body.phone.trim().length > 0
          ? body.phone.trim()
          : null;
      location =
        typeof body.location === "string" && body.location.trim().length > 0
          ? body.location.trim()
          : null;
      linkedinUrl =
        typeof body.linkedinUrl === "string" &&
        body.linkedinUrl.trim().length > 0
          ? body.linkedinUrl.trim()
          : null;
      portfolioUrl =
        typeof body.portfolioUrl === "string" &&
        body.portfolioUrl.trim().length > 0
          ? body.portfolioUrl.trim()
          : null;
      headline =
        typeof body.headline === "string" && body.headline.trim().length > 0
          ? body.headline.trim()
          : null;
      notes =
        typeof body.notes === "string" && body.notes.trim().length > 0
          ? body.notes.trim()
          : null;

      if (
        typeof body.cvUrl === "string" &&
        body.cvUrl.trim().length > 0
      ) {
        cvUrlFromLink = body.cvUrl.trim();
      }
      // No file if JSON caller
    } else {
      // --- Branch 2: FormData body (current JobApplyForm) ---
      const formData = await req.formData();

      const getText = (key: string): string | null => {
        const v = formData.get(key);
        if (typeof v !== "string") return null;
        const trimmed = v.trim();
        return trimmed.length > 0 ? trimmed : null;
      };

      jobSlugFromBody = getText("jobSlug");

      fullName = getText("fullName") || getText("full_name");
      email = getText("email");

      phone = getText("phone");
      location = getText("location");
      linkedinUrl = getText("linkedinUrl");
      portfolioUrl = getText("portfolioUrl");
      headline = getText("headline");
      notes = getText("notes");

      const cvUrlText = getText("cvUrl");
      cvUrlFromLink = cvUrlText && cvUrlText.length > 0 ? cvUrlText : null;

      // Accept both "cv" (new) and "cvFile" (old)
      const maybeCv = formData.get("cv");
      const maybeCvFile = formData.get("cvFile");
      if (maybeCv instanceof File && maybeCv.size > 0) {
        cvFile = maybeCv;
      } else if (maybeCvFile instanceof File && maybeCvFile.size > 0) {
        cvFile = maybeCvFile;
      }
    }

    // --- Validation ---
    if (!fullName || !email) {
      // Small debug log so you can see what arrived in Vercel logs
      console.warn("Apply route missing fullName or email", {
        fullName,
        email,
        contentType,
      });

      return NextResponse.json(
        { error: "Full name and email are required." },
        { status: 400 }
      );
    }

    const slug = (jobSlugFromBody || params.slug || "").trim();
    if (!slug) {
      return NextResponse.json(
        { error: "Job slug is missing." },
        { status: 400 }
      );
    }

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

    // 3) Determine CV URL: link takes precedence, else upload file if present
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
