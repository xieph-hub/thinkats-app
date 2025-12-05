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

    const formData = await req.formData();

    const toRaw = formData.get("toEmail");
    const subjectRaw = formData.get("subject");
    const bodyRaw = formData.get("body");

    const toEmail =
      typeof toRaw === "string" ? toRaw.trim().toLowerCase() : "";
    const subject =
      typeof subjectRaw === "string" ? subjectRaw.trim() : "";
    const body =
      typeof bodyRaw === "string" ? bodyRaw.trim() : "";

    const candidateIdRaw = formData.get("candidateId");
    const jobIdRaw = formData.get("jobId");
    const applicationIdRaw = formData.get("applicationId");
    const templateIdRaw = formData.get("templateId");
    const redirectToRaw = formData.get("redirectTo");

    const candidateId =
      typeof candidateIdRaw === "string" && candidateIdRaw
        ? candidateIdRaw
        : null;
    const jobId =
      typeof jobIdRaw === "string" && jobIdRaw ? jobIdRaw : null;
    const applicationId =
      typeof applicationIdRaw === "string" && applicationIdRaw
        ? applicationIdRaw
        : null;
    const templateId =
      typeof templateIdRaw === "string" && templateIdRaw
        ? templateIdRaw
        : null;
    const redirectTo =
      typeof redirectToRaw === "string" && redirectToRaw
        ? redirectToRaw
        : null;

    // Basic validation
    if (!toEmail || !subject || !body) {
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

    let appUser = null;
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
      // No provider configured – keep record but mark as failed/queued
      status = "failed";
      errorMessage =
        "RESEND_API_KEY not configured; email was not actually sent.";
    }

    // Persist sent email record
    const sentEmail = await prisma.sentEmail.create({
      data: {
        tenantId: tenant.id,
        templateId,
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
