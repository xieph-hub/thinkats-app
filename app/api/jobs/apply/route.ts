// app/api/jobs/apply/route.ts
import * as React from "react";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { resend } from "@/lib/resendClient";

import CandidateApplicationReceived from "@/emails/CandidateApplicationReceived";
import {
  defaultScoringConfigForPlan,
  mergeScoringConfig,
  computeApplicationScore,
} from "@/lib/scoring";

// Helper: safe string for file paths
function safeSlug(input: string) {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const PUBLIC_SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://www.thinkats.com";

const RESEND_FROM_EMAIL =
  process.env.RESEND_FROM_EMAIL || "ThinkATS <no-reply@mail.thinkats.com>";

// We’re no longer using ATS_NOTIFICATIONS_EMAIL here (weekly digest will)
const ATS_NOTIFICATIONS_EMAIL =
  process.env.ATS_NOTIFICATIONS_EMAIL ||
  process.env.RESOURCIN_ADMIN_EMAIL ||
  "";

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
    const source = (formData.get("source") || "").toString().trim(); // internal tracking source

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

    // 1) Load job + tenant plan + scoringConfig
    const job = await prisma.job.findUnique({
      where: { id: jobId },
      select: {
        id: true,
        slug: true,
        tenantId: true,
        title: true,
        location: true,
        locationType: true,
        experienceLevel: true,
        seniority: true,
        requiredSkills: true,
        salaryMin: true,
        salaryMax: true,
        salaryCurrency: true,
        visibility: true,
        status: true,
        tenant: {
          select: {
            plan: true,
            trialEndsAt: true,
            scoringConfig: true,
          },
        },
      },
    });

    if (!job) {
      return NextResponse.json(
        { success: false, error: "Job not found or no longer available." },
        { status: 404 },
      );
    }

    // Optional but sensible: block applications to non-open/non-public roles
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

    // 2) Find or create candidate for this tenant + email
    let candidate = await prisma.candidate.findFirst({
      where: {
        tenantId: job.tenantId,
        email,
      },
    });

    let candidateCvUrl: string | null =
      (candidate?.cvUrl as string | null | undefined) || null;

    if (!candidate) {
      candidate = await prisma.candidate.create({
        data: {
          tenantId: job.tenantId,
          fullName,
          email,
          location: location || null,
          linkedinUrl: linkedinUrl || null,
          cvUrl: candidateCvUrl,
        },
      });
    } else {
      candidate = await prisma.candidate.update({
        where: { id: candidate.id },
        data: {
          fullName,
          location: location || undefined,
          linkedinUrl: linkedinUrl || undefined,
        },
      });
    }

    // 3) Optional CV upload to Supabase Storage
    let applicationCvUrl: string | null = null;

    if (cvFile instanceof File && cvFile.size > 0) {
      try {
        const bucket = "resourcin-uploads";

        const ext =
          cvFile.name && cvFile.name.includes(".")
            ? cvFile.name.split(".").pop()
            : "pdf";

        const safeEmailPart = safeSlug(email || fullName || "candidate");
        const filePath = `cvs/${job.id}/${safeEmailPart}-${Date.now()}.${ext}`;

        const { error: uploadError } = await supabaseAdmin.storage
          .from(bucket)
          .upload(filePath, cvFile, {
            cacheControl: "3600",
            upsert: false,
            contentType: cvFile.type || "application/octet-stream",
          });

        if (uploadError) {
          console.error("Supabase CV upload error:", uploadError);
        } else {
          const { data: publicData } = supabaseAdmin.storage
            .from(bucket)
            .getPublicUrl(filePath);

          applicationCvUrl = publicData?.publicUrl || null;
        }
      } catch (e) {
        console.error("Unexpected CV upload error:", e);
      }
    }

    if (applicationCvUrl && applicationCvUrl !== candidateCvUrl) {
      candidate = await prisma.candidate.update({
        where: { id: candidate.id },
        data: {
          cvUrl: applicationCvUrl,
        },
      });
      candidateCvUrl = applicationCvUrl;
    }

    // 4) Resolve scoring config (plan defaults + tenant overrides)
    const plan = job.tenant?.plan ?? "free";
    const baseConfig = defaultScoringConfigForPlan(plan);
    const overrides = (job.tenant as any)?.scoringConfig || null;
    const scoringConfig = mergeScoringConfig(baseConfig, overrides || undefined);

    const scoringResult = computeApplicationScore({
      job: {
        title: job.title,
        location: job.location,
        locationType: job.locationType,
        experienceLevel: job.experienceLevel,
        seniority: job.seniority,
        requiredSkills: job.requiredSkills || [],
        salaryMin: job.salaryMin,
        salaryMax: job.salaryMax,
        salaryCurrency: job.salaryCurrency,
      },
      candidate: candidate
        ? {
            location: candidate.location,
            currentTitle: candidate.currentTitle,
            currentCompany: candidate.currentCompany,
          }
        : null,
      application: {
        location,
        currentGrossAnnual,
        grossAnnualExpectation,
        noticePeriod,
        coverLetter,
        screeningAnswers: null, // future: structured answers
        howHeard,
      },
      config: scoringConfig,
    });

    const matchScore = scoringResult.score;
    const matchReason = scoringResult.summary;

    // 5) Create the job application with scoring fields
    const application = await prisma.jobApplication.create({
      data: {
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

        matchScore,
        matchReason,
      },
    });

    // 6) Candidate acknowledgement email
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
