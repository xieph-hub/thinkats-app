// lib/email.ts
import { Resend } from "resend";

const resendApiKey = process.env.RESEND_API_KEY;
const fromEmail = process.env.RESEND_FROM_EMAIL;
const adminEmail = process.env.THINKATS_ADMIN_EMAIL;
const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ||
  process.env.SITE_URL ||
  "https://www.thinkats.com";

let resend: Resend | null = null;

if (!resendApiKey) {
  console.warn("RESEND_API_KEY is not set. Email notifications will be disabled.");
} else {
  resend = new Resend(resendApiKey);
}

type CandidateConfirmationArgs = {
  to: string;
  candidateName: string;
  jobTitle: string;
  timelineDays?: number;
};

export async function sendCandidateApplicationConfirmationEmail({
  to,
  candidateName,
  jobTitle,
  timelineDays = 7,
}: CandidateConfirmationArgs) {
  if (!resend || !fromEmail) return;

  const safeName = candidateName || "there";

  const subject = `Application received – ${jobTitle}`;
  const text = `
Hi ${safeName},

Thank you for applying for the role of "${jobTitle}".

We’ve received your application and our team will review it shortly.
If you’re shortlisted, we’ll contact you within ${timelineDays} days.

Best regards,
ThinkATS Team
`.trim();

  const html = `
  <p>Hi ${safeName},</p>
  <p>Thank you for applying for the role of <strong>${jobTitle}</strong>.</p>
  <p>We’ve received your application and our team will review it shortly.
  If you’re shortlisted, we’ll contact you within <strong>${timelineDays} days</strong>.</p>
  <p>Best regards,<br/>ThinkATS Team</p>
  `.trim();

  try {
    await resend.emails.send({
      from: fromEmail,
      to,
      subject,
      text,
      html,
    });
  } catch (err) {
    console.error("Failed to send candidate confirmation email:", err);
  }
}

type InternalNotificationArgs = {
  jobId: string;
  jobTitle: string;
  candidateName: string;
  candidateEmail: string;
};

export async function sendInternalNewApplicationEmail({
  jobId,
  jobTitle,
  candidateName,
  candidateEmail,
}: InternalNotificationArgs) {
  if (!resend || !fromEmail || !adminEmail) return;

  const base = siteUrl.replace(/\/$/, "");
  const pipelineUrl = `${base}/ats/jobs/${jobId}`;

  const subject = `New application – ${candidateName} for ${jobTitle}`;
  const text = `
New application received.

Candidate: ${candidateName} (${candidateEmail})
Role: ${jobTitle}

View pipeline:
${pipelineUrl}
`.trim();

  const html = `
  <p><strong>New application received.</strong></p>
  <p>
    <strong>Candidate:</strong> ${candidateName} (${candidateEmail})<br/>
    <strong>Role:</strong> ${jobTitle}
  </p>
  <p>
    <a href="${pipelineUrl}" target="_blank" rel="noreferrer">
      View in ATS pipeline
    </a>
  </p>
  `.trim();

  try {
    await resend.emails.send({
      from: fromEmail,
      to: adminEmail,
      subject,
      text,
      html,
    });
  } catch (err) {
    console.error("Failed to send internal application email:", err);
  }
}
