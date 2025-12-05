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
// Plan-aware scoring config
// ---------------------------------------------------------------------------

type PlanKey = "free" | "trial_pro" | "pro" | "enterprise" | string;

type ScoringConfig = {
  baseScore: number;

  // Location
  locationBonus: number; // when aligned
  locationPenalty: number; // when misaligned and not remote

  // Skills
  skillsPerSkillWeight: number; // per matched skill
  skillsMaxBonus: number; // cap on skills contribution
  skillsNoMatchPenalty: number;

  // Compensation
  compInRangeBonus: number;
  compSlightAbovePenalty: number;
  compAbovePenalty: number;

  // Notice period
  immediateBonus: number;
  longNoticePenalty: number;

  // Feature flags
  enableNlp: boolean; // toggles deeper NLP scoring (future hook)
};

function getScoringConfigForPlan(plan: PlanKey): ScoringConfig {
  const key = (plan || "free").toLowerCase();

  // Free = simple rules, conservative weights
  if (key === "free") {
    return {
      baseScore: 50,

      locationBonus: 8,
      locationPenalty: 4,

      skillsPerSkillWeight: 3,
      skillsMaxBonus: 15,
      skillsNoMatchPenalty: 8,

      compInRangeBonus: 8,
      compSlightAbovePenalty: 4,
      compAbovePenalty: 12,

      immediateBonus: 4,
      longNoticePenalty: 4,

      enableNlp: false,
    };
  }

  // Trial behaves like Pro for scoring
  if (key === "trial_pro") {
    return {
      baseScore: 50,

      locationBonus: 10,
      locationPenalty: 5,

      skillsPerSkillWeight: 4,
      skillsMaxBonus: 20,
      skillsNoMatchPenalty: 10,

      compInRangeBonus: 10,
      compSlightAbovePenalty: 5,
      compAbovePenalty: 15,

      immediateBonus: 5,
      longNoticePenalty: 5,

      enableNlp: true,
    };
  }

  // Pro
  if (key === "pro") {
    return {
      baseScore: 50,

      locationBonus: 10,
      locationPenalty: 5,

      skillsPerSkillWeight: 4,
      skillsMaxBonus: 22,
      skillsNoMatchPenalty: 10,

      compInRangeBonus: 10,
      compSlightAbovePenalty: 5,
      compAbovePenalty: 15,

      immediateBonus: 5,
      longNoticePenalty: 5,

      enableNlp: true,
    };
  }

  // Enterprise – slightly more aggressive weights, also NLP-enabled
  if (key === "enterprise") {
    return {
      baseScore: 50,

      locationBonus: 12,
      locationPenalty: 6,

      skillsPerSkillWeight: 5,
      skillsMaxBonus: 25,
      skillsNoMatchPenalty: 12,

      compInRangeBonus: 12,
      compSlightAbovePenalty: 6,
      compAbovePenalty: 18,

      immediateBonus: 6,
      longNoticePenalty: 6,

      enableNlp: true,
    };
  }

  // Fallback
  return getScoringConfigForPlan("free");
}

function resolveEffectivePlan(
  plan: string | null | undefined,
  trialEndsAt: Date | null | undefined,
): PlanKey {
  const base = (plan || "free").toLowerCase();
  const now = new Date();

  // Simple rule: free + active trial => trial_pro
  if (base === "free" && trialEndsAt && trialEndsAt.getTime() > now.getTime()) {
    return "trial_pro";
  }

  return base;
}

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
  planKey: PlanKey,
  config: ScoringConfig,
) {
  let score = config.baseScore;
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
      score += config.locationBonus;
      reasons.push("Location aligns with the role.");
    } else if (jobLocationType !== "remote") {
      score -= config.locationPenalty;
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
      const contribution = Math.min(
        config.skillsMaxBonus,
        matched * config.skillsPerSkillWeight,
      );
      score += contribution;
      reasons.push(
        `Matches ${matched} of ${requiredSkills.length} key skills.`,
      );
    } else {
      score -= config.skillsNoMatchPenalty;
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
      score += config.compInRangeBonus;
      reasons.push("Compensation expectations sit within the target range.");
    } else if (expectedNum > salaryMax * 1.3) {
      score -= config.compAbovePenalty;
      reasons.push(
        "Compensation expectations are significantly above the range.",
      );
    } else if (expectedNum > salaryMax * 1.05) {
      score -= config.compSlightAbovePenalty;
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
      score += config.immediateBonus;
      reasons.push("Can start immediately or with very short notice.");
    } else if (/90|3\s*months?/.test(notice)) {
      score -= config.longNoticePenalty;
      reasons.push("Long notice period may delay onboarding.");
    }
  }

  // 5) Future: deeper NLP scoring for Pro/Enterprise
  if (config.enableNlp) {
    // Placeholder hook – later you can:
    // - Embed CV / cover letter text
    // - Compare to job description / skills
    // - Add or subtract up to e.g. ±15 points based on semantic fit
    //
    // For now we just leave this as a no-op so behaviour stays deterministic.
    // e.g.
    // const nlpBoost = await computeNlpBoost({ job, input, planKey });
    // score += nlpBoost.delta;
    // reasons.push(nlpBoost.reason);
  }

  // Clamp 0–100
  if (score < 0) score = 0;
  if (score > 100) score = 100;

  const reasonText =
    reasons.length === 0
      ? `Automatically scored based on location, skills, compensation expectations and notice period (plan: ${planKey}).`
      : `${reasons.join(" ")} (Scored using ${String(planKey)} rules.)`;

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

    // 1) Load job + tenant plan for scoring
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
        // tenant for plan
        tenant: {
          select: {
            plan: true,
            trialEndsAt: true,
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

    const tenantPlan = job.tenant?.plan ?? "free";
    const tenantTrialEndsAt = job.tenant?.trialEndsAt ?? null;
    const effectivePlan = resolveEffectivePlan(tenantPlan, tenantTrialEndsAt);
    const scoringConfig = getScoringConfigForPlan(effectivePlan);

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
    // 4) Compute match score / reason (plan-aware)
    // -----------------------------------------------------------------------

    const skillsText =
      ((formData.get("skills") ??
        formData.get("keySkills") ??
        formData.get("summary") ??
        formData.get("coverLetter") ??
        "") as string) || "";

    const { score: matchScore, reason: matchReason } =
      computeMatchScoreAndReason(
        job,
        {
          location,
          noticePeriod,
          currentGrossAnnual,
          grossAnnualExpectation,
          skillsText,
        },
        effectivePlan,
        scoringConfig,
      );

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
