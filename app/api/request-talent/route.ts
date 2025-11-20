// app/api/request-talent/route.ts

import { NextRequest, NextResponse } from "next/server";
// If you already have a Resend helper or email utility, you can import it here instead.
// import { sendEmail } from "@/lib/email";

type RequestTalentPayload = {
  companyName?: string;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  roleTitle?: string;
  roleLevel?: string;
  function?: string;
  location?: string;
  workType?: string;       // Onsite / Remote / Hybrid
  employmentType?: string; // Full-time / Contract, etc.
  budgetCurrency?: string;
  budgetMin?: number;
  budgetMax?: number;
  hiresCount?: number;
  notes?: string;
};

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as RequestTalentPayload;

    // Basic validation: we at least need a contact and some role info
    if (!body.contactEmail || !body.roleTitle) {
      return NextResponse.json(
        {
          ok: false,
          message:
            "Please provide at least contact email and role title to request talent.",
        },
        { status: 400 }
      );
    }

    // --- OPTIONAL: Email notification via Resend or any provider ---
    //
    // This is written in a way that won't crash if env vars are missing.
    // Set these in your Vercel env when you're ready:
    //   RESEND_API_KEY
    //   REQUEST_TALENT_INBOX   (e.g. "hello@resourcin.com")
    //
    try {
      const apiKey = process.env.RESEND_API_KEY;
      const inbox = process.env.REQUEST_TALENT_INBOX;

      if (apiKey && inbox) {
        // Lazy import so build doesn't fail if "resend" isn't installed yet.
        const { Resend } = await import("resend");
        const resend = new Resend(apiKey);

        const subject = `New Talent Request: ${body.roleTitle} @ ${body.companyName ?? "Unknown company"}`;

        const lines = [
          `Company: ${body.companyName ?? "-"}`,
          `Contact: ${body.contactName ?? "-"} (${body.contactEmail}${
            body.contactPhone ? ", " + body.contactPhone : ""
          })`,
          "",
          `Role Title: ${body.roleTitle}`,
          `Role Level: ${body.roleLevel ?? "-"}`,
          `Function: ${body.function ?? "-"}`,
          `Location: ${body.location ?? "-"}`,
          `Work Type: ${body.workType ?? "-"}`,
          `Employment Type: ${body.employmentType ?? "-"}`,
          "",
          `Budget: ${
            body.budgetCurrency && (body.budgetMin || body.budgetMax)
              ? `${body.budgetCurrency} ${body.budgetMin ?? "?"} - ${
                  body.budgetMax ?? "?"
                }`
              : "-"
          }`,
          `Hires Count: ${body.hiresCount ?? "-"}`,
          "",
          `Notes:`,
          body.notes ?? "-",
        ];

        await resend.emails.send({
          from: `Resourcin <no-reply@${new URL(
            process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.resourcin.com"
          ).hostname}>`,
          to: inbox,
          subject,
          text: lines.join("\n"),
        });
      } else {
        console.warn(
          "[request-talent] RESEND_API_KEY or REQUEST_TALENT_INBOX not set. Skipping email send."
        );
      }
    } catch (emailErr) {
      console.error("[request-talent] Failed to send email:", emailErr);
      // We intentionally don't fail the whole request – lead is still accepted.
    }

    // For now we are NOT storing this in a DB table, because the old
    // TalentRequest table has been deleted. When you're ready, we can:
    //   - create a new "talent_requests" table in Supabase, and
    //   - insert this payload there as well.
    //
    // But this endpoint will respond successfully so your frontend
    // UX remains smooth.

    return NextResponse.json(
      {
        ok: true,
        message: "Talent request received. We'll get back to you shortly.",
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("Error in request-talent endpoint:", err);
    return NextResponse.json(
      {
        ok: false,
        message: "Unexpected error while submitting your talent request.",
      },
      { status: 500 }
    );
  }
}
