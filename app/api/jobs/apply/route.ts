// app/api/jobs/apply/route.ts
import * as React from "react";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { resend } from "@/lib/resendClient";

import CandidateApplicationReceived from "@/emails/CandidateApplicationReceived";

// scoring engine hook (non-blocking)
import { scoreAndPersistApplication } from "@/lib/scoring/server";

// Helper: safe string for file paths
function safeSlug(input: string) {
  return (input || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const PUBLIC_SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://www.thinkats.com";

const RESEND_FROM_EMAIL =
  process.env.RESEND_FROM_EMAIL || "ThinkATS <no-reply@mail.thinkats.com>";

// If you want a single global bucket name, set NEXT_PUBLIC_UPLOADS_BUCKET in env.
// Otherwise, fallback to old name for backwards-compat (but you should rename it).
const UPLOADS_BUCKET =
  process.env.NEXT_PUBLIC_UPLOADS_BUCKET ||
  process.env.NEXT_PUBLIC_CV_UPLOADS_BUCKET ||
  "resourcin-uploads";

// ---------------------------------------------------------------------------
// POST /api/jobs/apply
// ---------------------------------------------------------------------------
export async function POST(req: Request) {
  try {
    const formData = await req.formData();

    const jobId = (formData.get("jobId") || "").toString().trim();
    const fullName = (formData.get("fullName") || "").toString().trim();
    const email = (formData.get("email") || "").toString().trim().toLowerCase();

    const phone = (formData.get("phone") || "").toString().trim();
    const location = (formData.get("location") || "").toString().trim();

    const linkedinUrl = (formData.get("linkedinUrl") || "")
      .toString()
      .trim();
    const githubUrl = (formData.get("githubUrl") || "").toString().trim();

    const currentGrossAnnual = (formData.get("currentGrossAnnual") || "")
      .toString()
      .trim();
    const grossAnnualExpectation = (
      formData.get("grossAnnualExpectation") || ""
    )
      .toString()
      .trim();
    const noticePeriod = (formData.get("noticePeriod") || "")
      .toString()
      .trim();

    const howHeard = (formData.get("howHeard") || "").toString().trim();
    const source = (formData.get("source") || "").toString().trim();

    const coverLetter = (formData.get("coverLetter") || "")
      .toString()
      .trim();

    const cvFile = formData.get("cv");

    if (!jobId || !fullName || !email) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Missing required fields. Please provide your name, email and the job you are applying for.",
        },
        { status: 400 },
      );
    }

    // 1) Load job to get tenantId + title (+ slug for nice URLs)
    const job = await prisma.job.findUnique({
      where: { id: jobId },
      select: {
        id: true,
        slug: true,
        tenantId: true,
        title: true,
        location: true,
        visibility: true,
        status: true,
        workMode: true,
        experienceLevel: true,
        requiredSkills: true,
      },
    });

    if (!job) {
      return NextResponse.json(
        { success: false, error: "Job not found or no longer available." },
        { status: 404 },
      );
    }

    // Guard: only accept public + open jobs
    if (job.status !== "open" || job.visibility !== "public") {
      return NextResponse.json(
        {
          success: false,
          error:
            "This role is not currently accepting applications. Please check back later.",
        },
        { status: 400 },
      );
    }

    const tenantId = job.tenantId;

    // 2) Find or create candidate for this tenant + email
    let candidate = await prisma.candidate.findFirst({
      where: {
        tenantId,
        email,
      },
      select: {
        id: true,
        cvUrl: true,
      },
    });

    let candidateCvUrl: string | null =
      (candidate?.cvUrl as string | null | undefined) || null;

    if (!candidate) {
      candidate = await prisma.candidate.create({
        data: {
          tenantId,
          fullName,
          email,
          phone: phone || null,
          location: location || null,
          linkedinUrl: linkedinUrl || null,
          cvUrl: candidateCvUrl,
        },
        select: {
          id: true,
          cvUrl: true,
        },
      });
    } else {
      // Light touch update with fresher data
      await prisma.candidate.update({
        where: { id: candidate.id },
        data: {
          fullName,
          phone: phone || undefined,
          location: location || undefined,
          linkedinUrl: linkedinUrl || undefined,
        },
      });
    }

    // 3) Optional CV upload to Supabase Storage (tenant-scoped path)
    let applicationCvUrl: string | null = null;

    if (cvFile instanceof File && cvFile.size > 0) {
      try {
        const ext =
          cvFile.name && cvFile.name.includes(".")
            ? cvFile.name.split(".").pop()
            : "pdf";

        const safeEmailPart = safeSlug(email || fullName || "candidate");

        // ✅ tenant-scoped path (no “resourcin” leakage)
        // and includes jobId for easy cleanup/exports.
        const filePath = `tenants/${tenantId}/jobs/${job.id}/cvs/${safeEmailPart}-${Date.now()}.${ext}`;

        const { error: uploadError } = await supabaseAdmin.storage
          .from(UPLOADS_BUCKET)
          .upload(filePath, cvFile, {
            cacheControl: "3600",
            upsert: false,
            contentType: cvFile.type || "application/octet-stream",
          });

        if (uploadError) {
          console.error("Supabase CV upload error:", uploadError);
        } else {
          const { data: publicData } = supabaseAdmin.storage
            .from(UPLOADS_BUCKET)
            .getPublicUrl(filePath);

          applicationCvUrl = publicData?.publicUrl || null;
        }
      } catch (e) {
        console.error("Unexpected CV upload error:", e);
      }
    }

    // If we got a CV URL, also sync it to candidate profile
    if (applicationCvUrl && applicationCvUrl !== candidateCvUrl) {
      await prisma.candidate.update({
        where: { id: candidate.id },
        data: { cvUrl: applicationCvUrl },
      });
      candidateCvUrl = applicationCvUrl;
    }

    // 4) Create the job application (✅ tenant-hardened)
    // NOTE: This assumes your schema now includes JobApplication.tenantId
    const application = await prisma.jobApplication.create({
      data: {
        tenantId, // ✅ REQUIRED after tenant-hardening

        jobId: job.id,
        candidateId: candidate.id,

        fullName,
        email,
        location: location || null,
        phone: phone || null,

        linkedinUrl: linkedinUrl || null,
        githubUrl: githubUrl || null,

        currentGrossAnnual: currentGrossAnnual || null,
        grossAnnualExpectation: grossAnnualExpectation || null,
        noticePeriod: noticePeriod || null,

        howHeard: howHeard || null,
        source: source || null,

        cvUrl: applicationCvUrl || candidateCvUrl || null,
        coverLetter: coverLetter || null,

        stage: "APPLIED",
        status: "PENDING",
      },
      select: {
        id: true,
      },
    });

    // 4b) FIRE SCORING ENGINE (non-blocking)
    try {
      await scoreAndPersistApplication(application.id);
    } catch (scoringError) {
      console.error(
        "Error in scoring pipeline for application",
        application.id,
        scoringError,
      );
    }

    // 5) Candidate acknowledgement email (best-effort)
    try {
      const jobTitle = job.title;
      const candidateName = fullName;
      const candidateEmail = email;

      const canonicalPath = job.slug
        ? `/jobs/${encodeURIComponent(job.slug)}`
        : `/jobs/${encodeURIComponent(job.id)}`;
      const publicJobUrl = `${PUBLIC_SITE_URL}${canonicalPath}`;

      await resend.emails.send({
        from: RESEND_FROM_EMAIL,
        to: candidateEmail,
        subject: `We've received your application – ${jobTitle}`,
        react: CandidateApplicationReceived({
          candidateName,
          jobTitle,
          jobPublicUrl: publicJobUrl,
          candidateEmail,
        }),
      });
    } catch (emailError) {
      console.error(
        "Resend email error (candidate acknowledgement):",
        emailError,
      );
    }

    return NextResponse.json({
      success: true,
      applicationId: application.id,
      message:
        "This is to acknowledge receipt of your application. A member of our recruitment team will reach out to you if you are a good fit for the role.",
    });
  } catch (err) {
    console.error("Error handling job application:", err);
    return NextResponse.json(
      {
        success: false,
        error:
          "Something went wrong while submitting your application. Please try again in a moment.",
      },
      { status: 500 },
    );
  }
}
