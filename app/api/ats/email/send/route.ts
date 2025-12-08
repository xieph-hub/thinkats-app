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

    // ------------------------------
    // Parse JSON (QuickSend) or form
    // ------------------------------
    if (isJson) {
      const json = await req.json().catch(() => null);
      if (!json || typeof json !== "object") {
        return NextResponse.json(
          { ok: false, error: "Invalid JSON body" },
          { status: 400 },
        );
      }

      const j = json as Record<string, unknown>;

      const toRaw = (j.to ?? j.toEmail) as string | undefined;
      const subjectRaw = j.subject as string | undefined;
      const bodyRaw = j.body as string | undefined;

      toEmail = (toRaw ?? "").trim().toLowerCase();
      subject = (subjectRaw ?? "").trim();
      body = (bodyRaw ?? "").trim();

      candidateId = j.candidateId ? String(j.candidateId) : null;
      jobId = j.jobId ? String(j.jobId) : null;
      applicationId = j.applicationId ? String(j.applicationId) : null;
      templateId = j.templateId ? String(j.templateId) : null;
      redirectTo = j.redirectTo ? String(j.redirectTo) : null;
    } else {
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

    // ------------------------------
    // Basic validation
    // ------------------------------
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

    // ------------------------------
    // Resolve current app user via Supabase session
    // ------------------------------
    const supabase = createSupabaseRouteClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user || !user.email) {
      if (isJson) {
        return NextResponse.json(
          { ok: false, error: "Unauthenticated" },
          { status: 401 },
        );
      }
      const loginUrl = new URL("/login", req.url);
      return NextResponse.redirect(loginUrl, { status: 303 });
    }

    const userEmail = user.email.toLowerCase();
    const metadata = (user.user_metadata ?? {}) as Record<string, any>;

    let appUser = await prisma.user.findUnique({
      where: { email: userEmail },
    });

    if (!appUser) {
      appUser = await prisma.user.create({
        data: {
          email: userEmail,
          fullName: metadata.full_name ?? metadata.name ?? null,
          globalRole: "USER",
          isActive: true,
        },
      });
    }

    // ------------------------------
    // Optional: look up templateName
    // ------------------------------
    let templateName: string | null = null;
    if (templateId) {
      const tpl = await prisma.emailTemplate.findFirst({
        where: { id: templateId, tenantId: tenant.id },
        select: { name: true },
      });
      templateName = tpl?.name ?? null;
    }

    // ------------------------------
    // Send via Resend (best-effort)
    // ------------------------------
    let status: string = "queued";
    let errorMessage: string | null = null;
    let providerMessageId: string | null = null;

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

        // Resend SDK returns { data, error } in newer versions; keep it loose
        const castResult = result as any;
        providerMessageId =
          castResult?.id ||
          castResult?.data?.id ||
          null;
        status = castResult?.error ? "failed" : "sent";
        if (castResult?.error) {
          errorMessage =
            castResult.error.message ?? "Email provider error";
        }
      } catch (err: any) {
        console.error("Email provider send error:", err);
        status = "failed";
        errorMessage =
          err?.message || "Failed to send via email provider.";
      }
    } else {
      status = "failed";
      errorMessage =
        "RESEND_API_KEY not configured; email was not actually sent.";
    }

    // ------------------------------
    // Persist sent email record (with templateName)
    // ------------------------------
    const sentEmail = await prisma.sentEmail.create({
      data: {
        tenantId: tenant.id,
        templateId,
        templateName, // 👈 NEW
        toEmail,
        candidateId,
        jobId,
        subject,
        body,
        status,
        errorMessage,
        providerMessageId,
        createdById: appUser.id,
        // sentAt has default now()
      },
    });

    // ------------------------------
    // If tied to a specific application, log an event
    // ------------------------------
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

    // ------------------------------
    // Response: JSON for XHR, redirect for forms
    // ------------------------------
    if (isJson) {
      return NextResponse.json({
        ok: true,
        emailId: sentEmail.id,
        status,
      });
    }

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
