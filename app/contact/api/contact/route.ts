// app/api/contact/route.ts
import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

type ContactPayload = {
  name?: string;
  email?: string;
  company?: string;
  role?: string;
  message?: string;
};

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as ContactPayload;

    const name = (body.name || "").trim();
    const email = (body.email || "").trim();
    const company = (body.company || "").trim();
    const role = (body.role || "").trim();
    const message = (body.message || "").trim();

    if (!name || !email || !message) {
      return NextResponse.json(
        {
          ok: false,
          error: "Missing required fields: name, email, message.",
        },
        { status: 400 },
      );
    }

    const toEmail = process.env.CONTACT_TO_EMAIL;
    const fromEmail =
      process.env.CONTACT_FROM_EMAIL || toEmail || "onboarding@resend.dev";

    if (!toEmail) {
      console.error(
        "CONTACT_TO_EMAIL is not configured – cannot deliver contact messages.",
      );
      return NextResponse.json(
        {
          ok: false,
          error: "Contact inbox is not configured.",
        },
        { status: 500 },
      );
    }

    const subject = `New ThinkATS contact from ${name}`;
    const safeCompany = company || "Not specified";
    const safeRole = role || "Not specified";

    const html = `
      <div style="font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; font-size: 14px; color: #0f172a;">
        <p>You have a new contact request from the ThinkATS website.</p>
        <p><strong>Details</strong></p>
        <ul>
          <li><strong>Name:</strong> ${name}</li>
          <li><strong>Email:</strong> ${email}</li>
          <li><strong>Company:</strong> ${safeCompany}</li>
          <li><strong>Role / Title:</strong> ${safeRole}</li>
        </ul>
        <p><strong>Message:</strong></p>
        <p style="white-space: pre-wrap; background: #f9fafb; padding: 8px 10px; border-radius: 6px; border: 1px solid #e5e7eb;">
          ${message.replace(/</g, "&lt;")}
        </p>
      </div>
    `;

    const text = `
New ThinkATS contact from ${name}

Name: ${name}
Email: ${email}
Company: ${safeCompany}
Role / Title: ${safeRole}

Message:
${message}
    `.trim();

    await resend.emails.send({
      from: `ThinkATS Contact <${fromEmail}>`,
      to: [toEmail],
      subject,
      html,
      text,
      reply_to: email,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Error handling contact form:", err);
    return NextResponse.json(
      {
        ok: false,
        error: "Failed to send contact message.",
      },
      { status: 500 },
    );
  }
}
