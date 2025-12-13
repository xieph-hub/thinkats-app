// app/api/ats/email/send/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getResourcinTenant } from "@/lib/tenant";
import { createSupabaseRouteClient } from "@/lib/supabaseRouteClient";
import { Resend } from "resend";

export const runtime = "nodejs";

const resendApiKey = process.env.RESEND_API_KEY || "";
const resend = resendApiKey ? new Resend(resendApiKey) : null;

type QuickSendPayload = {
  to?: string;
  toEmail?: string;
  subject?: string;
  body?: string;
  candidateId?: string;
  jobId?: string;
  applicationId?: string;
  templateId?: string;
};

function asTrimmedString(v: unknown): string {
  return typeof v === "string" ? v.trim() : "";
}

function asOptionalId(v: unknown): string | null {
  const s = asTrimmedString(v);
  return s.length > 0 ? s : null;
}

export async function POST(req: NextRequest) {
  try {
    const tenant = await getResourcinTenant();
    if (!tenant) {
      return NextResponse.json(
        { ok: false, error: "No tenant configured" },
        { status: 400 },
      );
    }

    // Support both JSON (QuickSend) and form posts
    const contentType = req.headers.get("content-type") || "";
    const isJson = contentType.includes("application/json");

    let toEmail = "";
    let subject = "";
    let body = "";
    let candidateId: string | null = null;
    let jobId: string | null = null;
    let applicationId: string | null = null;
    let templateId: string | null = null;
    let redirectTo: string | null = null;

    if (isJson) {
      const json = (await req.json().catch(() => null)) as QuickSendPayload | null;

      const toRaw = json?.to ?? json?.toEmail ?? "";
      toEmail = asTrimmedString(toRaw).toLowerCase();
      subject = asTrimmedString(json?.subject);
      body = asTrimmedString(json?.body);

      candidateId = asOptionalId(json?.candidateId);
      jobId = asOptionalId(json?.jobId);
      applicationId = asOptionalId(json?.applicationId);
      templateId = asOptionalId(json?.templateId);
    } else {
      const formData = await req.formData();

      const toRaw = formData.get("toEmail") ?? formData.get("to");
      const subjectRaw = formData.get("subject");
      const bodyRaw = formData.get("body");

      toEmail = asTrimmedString(toRaw).toLowerCase();
      subject = asTrimmedString(subjectRaw);
      body = asTrimmedString(bodyRaw);

      candidateId = asOptionalId(formData.get("candidateId"));
      jobId = asOptionalId(formData.get("jobId"));
      applicationId = asOptionalId(formData.get("applicationId"));
      templateId = asOptionalId(formData.get("templateId"));
      redirectTo = asOptionalId(formData.get("redirectTo"));
    }

    // Basic validation
    if (!toEmail || !subject || !body) {
      if (isJson) {
        return NextResponse.json(
          { ok: false, error: "To, subject and body are required." },
          { status: 400 },
        );
      }

      const url = new URL(
        redirectTo || (candidateId ? `/ats/candidates/${candidateId}` : "/ats"),
        req.url,
      );
      url.searchParams.set("emailError", "To, subject and body are required.");
      return NextResponse.redirect(url, { status: 303 });
    }

    // Resolve current app user via Supabase session (for createdById)
    const supabase = createSupabaseRouteClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    let appUser: { id: string; fullName: string | null; email: string } | null =
      null;

    if (!userError && user && user.email) {
      const email = user.email.toLowerCase();
      const existing = await prisma.user.findUnique({
        where: { email },
        select: { id: true, fullName: true, email: true },
      });

      if (existing) {
        appUser = existing;
      } else {
        const created = await prisma.user.create({
          data: {
            email,
            fullName:
              (user.user_metadata as any)?.full_name ??
              (user.user_metadata as any)?.name ??
              null,
            globalRole: "USER",
            isActive: true,
          },
          select: { id: true, fullName: true, email: true },
        });
        appUser = created;
      }
    }

    // Denormalise templateName for chips, if templateId is present
    let templateName: string | null = null;
    if (templateId) {
      const tpl = await prisma.emailTemplate.findUnique({
        where: { id: templateId },
        select: { name: true },
      });
      templateName = tpl?.name ?? null;
    }

    let status: string = "queued";
    let errorMessage: string | null = null;
    let providerMessageId: string | null = null;

    // Try to send via Resend if configured
    if (resend) {
      try {
        const result = await resend.emails.send({
          from:
            process.env.RESEND_FROM_EMAIL ||
            "ThinkATS <no-reply@thinkats.com>",
          to: [toEmail],
          subject,
          text: body,
          html: body.replace(/\n/g, "<br />"),
        });

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const castResult = result as any;
        providerMessageId = castResult?.id ?? null;
        status = "sent";
      } catch (e: any) {
        console.error("Email provider send error:", e);
        status = "failed";
        errorMessage = e?.message || "Failed to send via email provider.";
      }
    } else {
      status = "failed";
      errorMessage =
        "RESEND_API_KEY not configured; email was not actually sent.";
    }

    // Persist sent email record
    const sentEmail = await prisma.sentEmail.create({
      data: {
        tenantId: tenant.id,
        templateId,
        templateName,
        toEmail,
        candidateId,
        jobId,
        subject,
        body,
        status,
        errorMessage,
        providerMessageId,
        createdById: appUser?.id ?? null,
      },
    });

    // If tied to a specific application, log an application event (tenant-scoped)
    if (applicationId) {
      try {
        await prisma.applicationEvent.create({
          data: {
            // ✅ Tenant-scoped by design
            tenant: { connect: { id: tenant.id } },

            // ✅ Must be relation connect (NOT applicationId scalar)
            application: { connect: { id: applicationId } },

            type: "email_sent",
            payload: {
              templateId,
              templateName,
              subject,
              to: toEmail,
              status,
              sentEmailId: sentEmail.id,
            },
          },
        });
      } catch (eventErr) {
        console.error("Failed to write application email_sent event:", eventErr);
      }
    }

    // JSON callers (QuickSend panel) get a JSON response
    if (isJson) {
      return NextResponse.json(
        { ok: true, emailId: sentEmail.id, status },
        { status: 200 },
      );
    }

    // Form posts keep existing redirect behaviour
    const redirectUrl = new URL(
      redirectTo || (candidateId ? `/ats/candidates/${candidateId}` : "/ats"),
      req.url,
    );

    return NextResponse.redirect(redirectUrl, { status: 303 });
  } catch (err) {
    console.error("ATS email/send – unexpected error:", err);
    return NextResponse.json(
      { ok: false, error: "Unexpected error sending email" },
      { status: 500 },
    );
  }
}
