// app/api/ats/email/send/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getResourcinTenant } from "@/lib/tenant";
import { createSupabaseRouteClient } from "@/lib/supabaseRouteClient";
import { Resend } from "resend";

export const runtime = "nodejs";

const resendApiKey = process.env.RESEND_API_KEY || "";
const resend = resendApiKey ? new Resend(resendApiKey) : null;

// Optional but nice to be explicit for anything that uses cookies/Supabase
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const tenant = await getResourcinTenant();
    if (!tenant) {
      // For JSON callers, we return JSON; for form callers we’ll redirect later.
      // Here, there is no redirectTo context yet, so just JSON error:
      return NextResponse.json(
        { ok: false, error: "No tenant configured" },
        { status: 400 },
      );
    }

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
      // QuickSendEmailPanel and any JS clients
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

      if (!json || typeof json !== "object") {
        return NextResponse.json(
          { ok: false, error: "Invalid JSON body" },
          { status: 400 },
        );
      }

      toEmail = (json.toEmail || json.to || "").trim().toLowerCase();
      subject = (json.subject || "").trim();
      body = (json.body || "").trim();
      candidateId = json.candidateId || null;
      jobId = json.jobId || null;
      applicationId = json.applicationId || null;
      templateId = json.templateId || null;
      redirectTo = null; // JSON callers expect JSON, not redirects
    } else {
      // Legacy / form-based callers (HTML <form> posts)
      const formData = await req.formData();

      const toRaw = formData.get("toEmail");
      const subjectRaw = formData.get("subject");
      const bodyRaw = formData.get("body");

      toEmail =
        typeof toRaw === "string" ? toRaw.trim().toLowerCase() : "";
      subject = typeof subjectRaw === "string" ? subjectRaw.trim() : "";
      body = typeof bodyRaw === "string" ? bodyRaw.trim() : "";

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
      const msg = "To, subject and body are required.";

      if (isJson) {
        return NextResponse.json(
          { ok: false, error: msg },
          { status: 400 },
        );
      }

      const url = new URL(
        redirectTo || (candidateId ? `/ats/candidates/${candidateId}` : "/ats"),
        req.url,
      );
      url.searchParams.set("emailError", msg);
      return NextResponse.redirect(url, { status: 303 });
    }

    // Resolve current app user via Supabase session
    const supabase = createSupabaseRouteClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    let appUser: Awaited<
      ReturnType<typeof prisma.user.findUnique>
    > | null = null;

    if (!userError && user && user.email) {
      const email = user.email.toLowerCase();
      appUser = await prisma.user.findUnique({
        where: { email },
      });

      if (!appUser) {
        appUser = await prisma.user.create({
          data: {
            email,
            fullName:
              (user.user_metadata as any)?.full_name ??
              (user.user_metadata as any)?.name ??
              null,
            globalRole: "USER",
            isActive: true,
          },
        });
      }
    }

    // Resolve template name (for chips) if provided
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
    if (resend && process.env.RESEND_FROM_EMAIL) {
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
        "RESEND_API_KEY / RESEND_FROM_EMAIL not configured; email was not actually sent.";
    }

    // Persist sent email record (including templateName + createdByName)
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
        createdByName: appUser?.fullName ?? appUser?.email ?? null,
        // sentAt defaults to now()
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

    // Response: JSON for JS callers, redirect for form posts
    if (isJson) {
      return NextResponse.json({
        ok: true,
        status,
        sentEmailId: sentEmail.id,
        providerMessageId,
      });
    }

    const redirectUrl = new URL(
      redirectTo || (candidateId ? `/ats/candidates/${candidateId}` : "/ats"),
      req.url,
    );

    return NextResponse.redirect(redirectUrl, { status: 303 });
  } catch (err) {
    console.error("ATS email/send – unexpected error:", err);

    // For JSON callers
    const contentType = req.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      return NextResponse.json(
        { ok: false, error: "Unexpected error sending email" },
        { status: 500 },
      );
    }

    // For form callers, bounce back to ATS root
    const fallbackUrl = new URL("/ats", req.url);
    fallbackUrl.searchParams.set("emailError", "Unexpected error sending email");
    return NextResponse.redirect(fallbackUrl, { status: 303 });
  }
}
