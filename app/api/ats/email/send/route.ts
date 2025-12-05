// app/api/ats/email/send/route.ts
import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { prisma } from "@/lib/prisma";
import { getResourcinTenant } from "@/lib/tenant";
import { getServerUser } from "@/lib/auth/getServerUser";

export const runtime = "nodejs";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: NextRequest) {
  try {
    const tenant = await getResourcinTenant();
    if (!tenant) {
      return NextResponse.json(
        { ok: false, error: "No tenant configured" },
        { status: 400 },
      );
    }

    const auth = (await getServerUser().catch(() => null)) as any;
    const appUserId: string | undefined = auth?.appUser?.id;
    if (!appUserId) {
      return NextResponse.json(
        { ok: false, error: "Unauthenticated" },
        { status: 401 },
      );
    }

    const body = await req.json().catch(() => ({} as any));

    const to = ((body.to as string | undefined) ?? "").trim();
    const subject = ((body.subject as string | undefined) ?? "").trim();
    const html = ((body.body as string | undefined) ?? "").trim();
    const candidateId =
      (body.candidateId as string | undefined) ?? null;
    const jobId = (body.jobId as string | undefined) ?? null;
    const templateId =
      (body.templateId as string | undefined) ?? null;

    if (!to || !subject || !html) {
      return NextResponse.json(
        { ok: false, error: "To, subject and body are required." },
        { status: 400 },
      );
    }

    const fromAddress =
      process.env.RESEND_FROM_EMAIL || "ThinkATS <no-reply@resourcin.com>";

    // Attempt to send via Resend
    let providerMessageId: string | null = null;
    try {
      const { data, error } = await resend.emails.send({
        from: fromAddress,
        to: [to],
        subject,
        html,
      });

      if (error) {
        console.error("Resend send error:", error);
        throw error;
      }

      providerMessageId = (data?.id as string | undefined) ?? null;
    } catch (sendErr) {
      console.error("Resend send exception:", sendErr);
      return NextResponse.json(
        {
          ok: false,
          error: "Failed to send email via provider",
        },
        { status: 502 },
      );
    }

    // Persist SentEmail
    const sent = await prisma.sentEmail.create({
      data: {
        tenantId: tenant.id,
        templateId,
        toEmail: to,
        candidateId,
        jobId,
        subject,
        body: html,
        status: "sent",
        providerMessageId: providerMessageId,
        createdById: appUserId,
      },
    });

    // Activity log – best effort
    try {
      await prisma.activityLog.create({
        data: {
          tenantId: tenant.id,
          actorId: appUserId,
          entityType: candidateId ? "candidate" : jobId ? "job" : "tenant",
          entityId: candidateId ?? jobId ?? tenant.id,
          action: "email_sent",
          metadata: {
            to,
            subject,
            candidateId,
            jobId,
            templateId,
            sentEmailId: sent.id,
          } as any,
        },
      });
    } catch (logErr) {
      console.error("SentEmail activity log error:", logErr);
    }

    return NextResponse.json(
      {
        ok: true,
        sentEmailId: sent.id,
        providerMessageId,
      },
      { status: 200 },
    );
  } catch (err) {
    console.error("Email send POST error:", err);
    return NextResponse.json(
      { ok: false, error: "Unexpected error sending email" },
      { status: 500 },
    );
  }
}
