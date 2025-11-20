// app/api/request-talent/route.ts

import { NextRequest, NextResponse } from "next/server";

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
  employmentType?: string; // Full-time / Contract / etc.
  budgetCurrency?: string;
  budgetMin?: number;
  budgetMax?: number;
  hiresCount?: number;
  notes?: string;
};

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as RequestTalentPayload;

    // Minimal validation so we don't store/send empty junk
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

    // ─────────────────────────────────────────────
    // Email notification via Resend
    // ─────────────────────────────────────────────
    try {
      const apiKey = process.env.RESEND_API_KEY;
      const fromAddress = process.env.RESEND_FROM_EMAIL;

      if (apiKey && fromAddress) {
        // Lazy import so build doesn’t break if "resend" is missing in future
        const { Resend } = await import("resend");
        const resend = new Resend(apiKey);

        const subject = `New Talent Request: ${body.roleTitle} @ ${
          body.companyName ?? "Unknown company"
        }`;

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
          "Notes:",
          body.notes ?? "-",
        ];

        await resend.emails.send({
          // Let RESEND_FROM_EMAIL define the full from-value:
          //   e.g. "Resourcin <no-reply@resourcin.com>"
          from: fromAddress,
          // For now we send to the same address; later we can add a
          // dedicated SALES_INBOX env if you want separation.
          to: fromAddress,
          subject,
          text: lines.join("\n"),
        });
      } else {
        console.warn(
          "[request-talent] RESEND_API_KEY or RESEND_FROM_EMAIL not set. Skipping email send."
        );
      }
    } catch (emailErr) {
      console.error("[request-talent] Failed to send email:", emailErr);
      // We don't fail the whole request – lead is still accepted.
    }

    // For now we are not writing to a DB table, because the legacy
    // TalentRequest table has been deleted. When you're ready, we can
    // create a new `talent_requests` table in Supabase and insert here.

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
