// app/api/ats/email/send/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getResourcinTenant } from "@/lib/tenant";
import { createSupabaseRouteClient } from "@/lib/supabaseRouteClient";
import { Resend } from "resend";

export const runtime = "nodejs";

const resendApiKey = process.env.RESEND_API_KEY || "";
const resend = resendApiKey ? new Resend(resendApiKey) : null;

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
      const json = (await req.json().catch(() => null)) as
        | {
            to?: string;
            toEmail?: string;
            subject?: string;
            body?: string;
            candidateId?: string;
            jobId?: string;
            applicationId?: string;
            templateId?: string;
          }
        | null;

      const toRaw = json?.to ?? json?.toEmail ?? "";
      const subjectRaw = json?.subject ?? "";
      const bodyRaw = json?.body ?? "";

      toEmail =
        typeof toRaw === "string" ? toRaw.trim().toLowerCase() : "";
      subject =
        typeof subjectRaw === "string" ? subjectRaw.trim() : "";
      body = typeof bodyRaw === "string" ? bodyRaw.trim() : "";

      candidateId =
        typeof json?.candidateId === "string" &&
        json.candidateId.trim().length > 0
          ? json.candidateId.trim()
          : null;

      jobId =
        typeof json?.jobId === "string" && json.jobId.trim().length > 0
          ? json.jobId.trim()
          : null;

      applicationId =
        typeof json?.applicationId === "string" &&
        json.applicationId.trim().length > 0
          ? json.applicationId.trim()
          : null;

      templateId =
        typeof json?.templateId === "string" &&
        json.templateId.trim().length > 0
          ? json.templateId.trim()
          : null;
    } else {
      const formData = await req.formData();

      const toRaw = formData.get("toEmail") ?? formData.get("to");
      const subjectRaw = formData.get("subject");
      const bodyRaw = formData.get("body");

      toEmail =
        typeof toRaw === "string" ? toRaw.trim().toLowerCase() : "";
      subject =
        typeof subjectRaw === "string" ? subjectRaw.trim() : "";
      body =
        typeof bodyRaw === "string" ? bodyRaw.trim() : "";

      const candidateIdRaw = formData.get("candidateId");
      const jobIdRaw = formData.get("jobId");
      const applicationIdRaw = formData.get("applicationId");
      const templateIdRaw = formData.get("templateId");
      const redirectToRaw = formData.get("redirectTo");

      candidateId =
        typeof candidateIdRaw === "string" && candidateIdRaw
          ? candidateIdRaw
          : null;
      jobId =
        typeof jobIdRaw === "string" && jobIdRaw ? jobIdRaw : null;
      applicationId =
        typeof applicationIdRaw === "string" && applicationIdRaw
          ? applicationIdRaw
          : null;
      templateId =
        typeof templateIdRaw === "string" && templateIdRaw
          ? templateIdRaw
          : null;
      redirectTo =
        typeof redirectToRaw === "string" && redirectToRaw
          ? redirectToRaw
          : null;
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
      url.searchParams.set(
        "emailError",
        "To, subject and body are required.",
      );
      return NextResponse.redirect(url, { status: 303 });
    }

    // Resolve current app user via Supabase session
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

        // Resend typically returns an { id } on success
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const castResult = result as any;
        providerMessageId = castResult?.id ?? null;
        status = "sent";
      } catch (err: any) {
        console.error("Email provider send error:", err);
        status = "failed";
        errorMessage =
          err?.message || "Failed to send via email provider.";
      }
    } else {
      // No provider configured – keep record but mark as failed
      status = "failed";
      errorMessage =
        "RESEND_API_KEY not configured; email was not actually sent.";
    }

    // Persist sent email record
    const sentEmail = await prisma.sentEmail.create({
      data: {
        tenantId: tenant.id,
        templateId,
        templateName, // <– chips can now safely use this
        toEmail,
        candidateId,
        jobId,
        subject,
        body,
        status,
        errorMessage,
        providerMessageId,
        createdById: appUser?.id ?? null,
        // sentAt has default now()
      },
    });

    // If tied to a specific application, log an application event
    if (applicationId) {
      try {
        await prisma.applicationEvent.create({
          data: {
            applicationId,
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
        console.error(
          "Failed to write application email_sent event:",
          eventErr,
        );
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

    // Best-effort JSON error; if this was a form, the browser will just show a generic error anyway
    return NextResponse.json(
      { ok: false, error: "Unexpected error sending email" },
      { status: 500 },
    );
  }
}
