// app/api/jobs/apply/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { Resend } from "resend";

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

    const linkedinUrl = (formData.get("linkedinUrl") || "")
      .toString()
      .trim();
    const githubUrl = (formData.get("githubUrl") || "")
      .toString()
      .trim();

    const currentGrossAnnual = (
      formData.get("currentGrossAnnual") || ""
    )
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

    const howHeard = (formData.get("howHeard") || "")
      .toString()
      .trim();
    const source = (formData.get("source") || "")
      .toString()
      .trim(); // internal tracking source

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

    // 5) Fire emails via Resend (candidate + internal), but never break the UX if this fails
    if (process.env.RESEND_API_KEY) {
      const resend = new Resend(process.env.RESEND_API_KEY);

      const candidateSubject = `We've received your application – ${job.title}`;
      const safeName = fullName || "there";

      const canonicalPath = job.slug
        ? `/jobs/${encodeURIComponent(job.slug)}`
        : `/jobs/${encodeURIComponent(job.id)}`;
      const publicJobUrl = `${PUBLIC_SITE_URL}${canonicalPath}`;

      const candidateHtml = `
        <p>Hi ${safeName},</p>
        <p>Thank you for applying for the <strong>${job.title}</strong>${
          job.location ? ` in <strong>${job.location}</strong>` : ""
        } via Resourcin.</p>
        <p>We’ve received your application and our recruitment team will review it carefully. If your profile is a close match for the role, we'll reach out to discuss next steps.</p>
        <p style="margin-top: 16px; font-size: 13px; color: #4b5563;">
          Job: <a href="${publicJobUrl}" style="color: #172965; text-decoration: none;">${job.title}</a><br />
          Submitted with email: <strong>${email}</strong>${
            source ? `<br />Application source: <strong>${source}</strong>` : ""
          }
        </p>
        <p style="margin-top: 16px;">Best regards,<br/>Resourcin Recruitment Team<br/><span style="font-size: 12px; color: #6b7280;">Powered by ThinkATS</span></p>
      `;

      const candidateText = `
Hi ${safeName},

Thank you for applying for the "${job.title}" role${
        job.location ? ` in ${job.location}` : ""
      } via Resourcin.

We’ve received your application and our recruitment team will review it carefully. If your profile is a close match for the role, we'll reach out to discuss next steps.

Job: ${job.title}
Link: ${publicJobUrl}
Submitted with email: ${email}${
        source ? `\nApplication source: ${source}` : ""
      }

Best regards,
Resourcin Recruitment Team
(Powered by ThinkATS)
      `.trim();

      const internalSubject = `New application: ${fullName} → ${job.title}`;
      const internalHtml = `
        <p>A new application has been submitted via ThinkATS.</p>
        <p>
          <strong>Candidate:</strong> ${fullName} (${email})<br/>
          <strong>Location:</strong> ${location || "Not specified"}<br/>
          <strong>Role:</strong> ${job.title}${
            job.location ? ` – ${job.location}` : ""
          }<br/>
          <strong>Stage:</strong> APPLIED<br/>
          <strong>Status:</strong> PENDING<br/>
          ${source ? `<strong>Source:</strong> ${source}<br/>` : ""}
          ${
            howHeard
              ? `<strong>How they heard:</strong> ${howHeard}<br/>`
              : ""
          }
        </p>
        <p>
          <strong>ATS links:</strong><br/>
          Job in ATS: <a href="${PUBLIC_SITE_URL}/ats/jobs/${
            job.id
          }" style="color:#172965;">Open job</a><br/>
          Candidate profile: <a href="${PUBLIC_SITE_URL}/ats/candidates/${
            candidate.id
          }" style="color:#172965;">Open candidate</a>
        </p>
        ${
          candidateCvUrl
            ? `<p><strong>CV:</strong> <a href="${candidateCvUrl}" style="color:#172965;">View CV</a></p>`
            : ""
        }
        <p style="margin-top: 16px; font-size: 12px; color: #6b7280;">
          This notification was generated automatically by ThinkATS.
        </p>
      `;

      const internalText = `
A new application has been submitted via ThinkATS.

Candidate: ${fullName} (${email})
Location: ${location || "Not specified"}

Role: ${job.title}${job.location ? ` – ${job.location}` : ""}
Stage: APPLIED
Status: PENDING
${source ? `Source: ${source}\n` : ""}${
        howHeard ? `How they heard: ${howHeard}\n` : ""
      }
${candidateCvUrl ? `CV: ${candidateCvUrl}\n` : ""}

ATS links:
- Job: ${PUBLIC_SITE_URL}/ats/jobs/${job.id}
- Candidate: ${PUBLIC_SITE_URL}/ats/candidates/${candidate.id}

This notification was generated automatically by ThinkATS.
      `.trim();

      try {
        const promises: Promise<unknown>[] = [];

        // Candidate acknowledgement
        promises.push(
          resend.emails.send({
            from: RESEND_FROM_EMAIL,
            to: email,
            subject: candidateSubject,
            html: candidateHtml,
            text: candidateText,
          }),
        );

        // Internal notification (optional)
        if (ATS_NOTIFICATIONS_EMAIL) {
          promises.push(
            resend.emails.send({
              from: RESEND_FROM_EMAIL,
              to: ATS_NOTIFICATIONS_EMAIL,
              subject: internalSubject,
              html: internalHtml,
              text: internalText,
            }),
          );
        }

        await Promise.allSettled(promises);
      } catch (emailError) {
        console.error("Resend email error (job application):", emailError);
        // Intentionally do not fail the response — email is best-effort
      }
    } else {
      console.warn(
        "RESEND_API_KEY not set; skipping candidate + internal emails for job application.",
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
