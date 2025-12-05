// app/api/jobs/apply/route.ts
import * as React from "react";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { resend } from "@/lib/resendClient";

import CandidateApplicationReceived from "@/emails/CandidateApplicationReceived";

// Helper: safe string for file paths
function safeSlug(input: string) {
  return input.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
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
// Match-scoring helpers
// ---------------------------------------------------------------------------

function parseMoneyNumber(value?: string | null): number | null {
  if (!value) return null;
  const cleaned = value.replace(/[^0-9.]/g, "");
  if (!cleaned) return null;
  const n = Number(cleaned);
  if (!Number.isFinite(n)) return null;
  return n;
}

function computeMatchScoreAndReason(
  job: any,
  input: {
    location?: string | null;
    noticePeriod?: string | null;
    currentGrossAnnual?: string | null;
    grossAnnualExpectation?: string | null;
    skillsText?: string | null;
  },
) {
  let score = 50; // baseline
  const reasons: string[] = [];

  const jobLocation = (job.location ?? "").toString().toLowerCase().trim();
  const jobLocationType = (
    job.locationType ??
    (job as any).location_type ??
    ""
  )
    .toString()
    .toLowerCase()
    .trim();

  const candidateLocation = (input.location ?? "")
    .toString()
    .toLowerCase()
    .trim();

  // 1) Location match
  if (jobLocation) {
    if (
      candidateLocation &&
      (candidateLocation.includes(jobLocation) ||
        jobLocation.includes(candidateLocation))
    ) {
      score += 10;
      reasons.push("Location aligns with the role.");
    } else if (jobLocationType !== "remote") {
      score -= 5;
      reasons.push("Location may not align with the role.");
    }
  }

  // 2) Skills match based on job.requiredSkills vs free-text skillsText
  const requiredSkills: string[] = Array.isArray(job.requiredSkills)
    ? job.requiredSkills
    : [];

  const skillsText = (input.skillsText ?? "")
    .toString()
    .toLowerCase();

  if (requiredSkills.length && skillsText) {
    let matched = 0;

    for (const skill of requiredSkills) {
      const s = (skill || "").toLowerCase();
      if (!s) continue;
      if (skillsText.includes(s)) {
        matched += 1;
      }
    }

    if (matched > 0) {
      const contribution = Math.min(20, matched * 4); // up to +20
      score += contribution;
      reasons.push(
        `Matches ${matched} of ${requiredSkills.length} key skills.`,
      );
    } else {
      score -= 10;
      reasons.push("Key skills are not clearly mentioned in the application.");
    }
  }

  // 3) Compensation expectations vs salary range
  const salaryMin =
    job.salaryMin != null ? Number(job.salaryMin) : null;
  const salaryMax =
    job.salaryMax != null ? Number(job.salaryMax) : null;

  const expectedNum =
    parseMoneyNumber(input.grossAnnualExpectation ?? null) ??
    parseMoneyNumber(input.currentGrossAnnual ?? null);

  if (salaryMin != null && salaryMax != null && expectedNum != null) {
    if (expectedNum >= salaryMin && expectedNum <= salaryMax * 1.05) {
      score += 10;
      reasons.push("Compensation expectations sit within the target range.");
    } else if (expectedNum > salaryMax * 1.3) {
      score -= 15;
      reasons.push(
        "Compensation expectations are significantly above the range.",
      );
    } else if (expectedNum > salaryMax * 1.05) {
      score -= 5;
      reasons.push(
        "Compensation expectations are slightly above the target range.",
      );
    } else if (expectedNum < salaryMin * 0.8) {
      reasons.push(
        "Compensation expectations are below the target range (could still be workable).",
      );
    }
  }

  // 4) Notice period
  const notice = (input.noticePeriod ?? "")
    .toString()
    .toLowerCase();

  if (notice) {
    if (
      /\b(immediate|0 ?day|no[t]?ice:? ?none)\b/.test(notice) ||
      /\b(asap)\b/.test(notice)
    ) {
      score += 5;
      reasons.push("Can start immediately or with very short notice.");
    } else if (/90|3\s*months?/.test(notice)) {
      score -= 5;
      reasons.push("Long notice period may delay onboarding.");
    }
  }

  // Clamp 0–100
  if (score < 0) score = 0;
  if (score > 100) score = 100;

  const reasonText =
    reasons.length === 0
      ? "Automatically scored based on location, skills, compensation expectations and notice period."
      : reasons.join(" ");

  return {
    score: Math.round(score),
    reason: reasonText,
  };
}

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

    const linkedinUrl = (formData.get("linkedinUrl") || "").toString().trim();
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

    // 1) Load job to get tenant id + title (+ slug for nice URLs, plus fields for scoring)
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
        // for scoring:
        locationType: true,
        requiredSkills: true,
        salaryMin: true,
        salaryMax: true,
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

    // We’ll keep / override CV URL on candidate if we successfully upload one
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
      // Light touch update with fresher data
      candidate = await prisma.candidate.update({
        where: { id: candidate.id },
        data: {
          fullName,
          location: location || undefined,
          linkedinUrl: linkedinUrl || undefined,
        },
      });
    }

    // 3) Optional CV upload to Supabase Storage (bucket: resourcin-uploads)
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

    // If we got a CV URL, also sync it to candidate profile
    if (applicationCvUrl && applicationCvUrl !== candidateCvUrl) {
      candidate = await prisma.candidate.update({
        where: { id: candidate.id },
        data: {
          cvUrl: applicationCvUrl,
        },
      });
      candidateCvUrl = applicationCvUrl;
    }

    // -----------------------------------------------------------------------
    // 4) Compute match score / reason
    // -----------------------------------------------------------------------

    const skillsText =
      ((formData.get("skills") ??
        formData.get("keySkills") ??
        formData.get("summary") ??
        formData.get("coverLetter") ??
        "") as string) || "";

    const { score: matchScore, reason: matchReason } =
      computeMatchScoreAndReason(job, {
        location,
        noticePeriod,
        currentGrossAnnual,
        grossAnnualExpectation,
        skillsText,
      });

    // 5) Create the job application (this is where `source`, `cvUrl` and match_* get saved)
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

        // sensible defaults
        stage: "APPLIED",
        status: "PENDING",

        // auto-screening fields
        matchScore,
        matchReason,
      },
    });

    // -----------------------------------------------------------------------
    // 6) Fire emails via Resend – CANDIDATE ONLY
    // -----------------------------------------------------------------------
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
      // Don’t fail the request – DB is still the source of truth
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
