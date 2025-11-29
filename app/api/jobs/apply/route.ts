// app/api/jobs/apply/route.ts
import * as React from "react";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { resend } from "@/lib/resendClient";

// 🔹 IMPORTANT: match your actual filenames
// You said you have emails/CandidateApplicationReceived.tsx
import CandidateApplicationReceivedEmail from "@/emails/CandidateApplicationReceived";
import ClientNewApplicationNotificationEmail from "@/emails/ClientNewApplicationNotificationEmail";
import InternalNewApplicationNotificationEmail from "@/emails/InternalNewApplicationNotificationEmail";

// Helper: safe string for file paths
function safeSlug(input: string) {
  return input.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

const PUBLIC_SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://www.resourcin.com";

const RESEND_FROM_EMAIL =
  process.env.RESEND_FROM_EMAIL || "Resourcin <no-reply@mail.resourcin.com>";

// Internal notification email:
// - Prefer ATS_NOTIFICATIONS_EMAIL if set (future per-tenant override)
// - Fallback to RESOURCIN_ADMIN_EMAIL (hello@resourcin.com in your case)
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

    // 1) Load job to get tenant id + title (+ slug for nice URLs)
    const job = await prisma.job.findUnique({
      where: { id: jobId },
      select: {
        id: true,
        slug: true,
        tenantId: true,
        title: true,
        location: true,
      },
    });

    if (!job) {
      return NextResponse.json(
        { success: false, error: "Job not found or no longer available." },
        { status: 404 },
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

    // 4) Create the job application (this is where `source` + `cvUrl` get saved)
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
      },
    });

    // -----------------------------------------------------------------------
    // 5) Fire emails via Resend (candidate + internal + optional client)
    //    using the shared React email layout family.
    // -----------------------------------------------------------------------

    try {
      const jobTitle = job.title;
      const jobLocation: string | undefined = job.location || undefined;
      const candidateName = fullName;
      const candidateEmail = email;

      const trackingSource = (source || "CAREERS_SITE")
        .toString()
        .toUpperCase();

      const canonicalPath = job.slug
        ? `/jobs/${encodeURIComponent(job.slug)}`
        : `/jobs/${encodeURIComponent(job.id)}`;
      const publicJobUrl = `${PUBLIC_SITE_URL}${canonicalPath}`;

      const atsJobLink = `${PUBLIC_SITE_URL}/ats/jobs/${job.id}`;

      const sendPromises: Promise<unknown>[] = [];

      // 5a) Candidate acknowledgement (branded React email)
      sendPromises.push(
        resend.emails.send({
          from: RESEND_FROM_EMAIL,
          to: candidateEmail,
          subject: `We've received your application – ${jobTitle}`,
          // Call the component function (no JSX in .ts file)
          react: CandidateApplicationReceivedEmail({
            candidateName,
            jobTitle,
            jobLocation,
            jobPublicUrl: publicJobUrl,
            candidateEmail,
            source: trackingSource,
          }),
        }),
      );

      // 5b) Internal notification (Resourcin team)
      if (ATS_NOTIFICATIONS_EMAIL) {
        sendPromises.push(
          resend.emails.send({
            from: RESEND_FROM_EMAIL,
            to: ATS_NOTIFICATIONS_EMAIL,
            subject: `New application: ${candidateName} → ${jobTitle}`,
            react: InternalNewApplicationNotificationEmail({
              jobTitle,
              jobLocation,
              candidateName,
              candidateEmail,
              source: trackingSource,
              atsLink: atsJobLink,
              linkedinUrl: linkedinUrl || undefined,
              currentGrossAnnual: currentGrossAnnual || undefined,
              expectation: grossAnnualExpectation || undefined,
              noticePeriod: noticePeriod || undefined,
              cvUrl: candidateCvUrl || undefined,
            }),
          }),
        );
      }

      // 5c) Client-facing notification (for now still to internal inbox).
      // When you add a per-job client contact email, plug it in here.
      if (ATS_NOTIFICATIONS_EMAIL) {
        sendPromises.push(
          resend.emails.send({
            from: RESEND_FROM_EMAIL,
            to: ATS_NOTIFICATIONS_EMAIL,
            subject: `New candidate for ${jobTitle}`,
            react: ClientNewApplicationNotificationEmail({
              // clientName omitted for now; template should handle undefined gracefully
              jobTitle,
              jobLocation,
              candidateName,
              candidateEmail,
              source: trackingSource,
              atsLink: atsJobLink,
            }),
          }),
        );
      }

      await Promise.allSettled(sendPromises);
    } catch (emailError) {
      console.error("Resend email error (job application):", emailError);
      // Deliberately don't fail the request – DB save is the source of truth
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
