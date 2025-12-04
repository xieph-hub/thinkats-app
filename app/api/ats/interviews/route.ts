// app/api/ats/interviews/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getResourcinTenant } from "@/lib/tenant";
import { resend } from "@/lib/resendClient";
import InterviewInviteEmail from "@/emails/InterviewInviteEmail";
import { buildIcsForInterview } from "@/lib/ics/interview";

export async function POST(req: Request) {
  const tenant = await getResourcinTenant();
  if (!tenant) {
    return NextResponse.json(
      { ok: false, error: "No tenant context." },
      { status: 400 },
    );
  }

  const body = await req.json();

  const {
    jobId,
    candidateId,
    applicationId,
    title,
    interviewType,
    scheduledAt,
    durationMins,
    location,
    notes,
    participants,
  } = body;

  if (!jobId || !title || !scheduledAt || !durationMins || !participants?.length) {
    return NextResponse.json(
      { ok: false, error: "Missing required fields." },
      { status: 400 },
    );
  }

  // 1) Create interview + participants
  const interview = await prisma.interview.create({
    data: {
      tenantId: tenant.id,
      jobId,
      candidateId: candidateId || null,
      applicationId: applicationId || null,
      title,
      interviewType: interviewType || "VIRTUAL",
      status: "SCHEDULED",
      scheduledAt: new Date(scheduledAt),
      durationMins,
      location: location || null,
      notes: notes || null,
      participants: {
        create: participants.map((p: any) => ({
          name: p.name,
          email: p.email.toLowerCase(),
          role: p.role || "Interviewer",
        })),
      },
    },
    include: {
      job: true,
      participants: true,
    },
  });

  // 2) Build ICS calendar invite
  const icsContent = buildIcsForInterview(interview);

  // 3) Email participants (including candidate)
  const sendPromises: Promise<unknown>[] = [];

  for (const participant of interview.participants) {
    sendPromises.push(
      resend.emails.send({
        from:
          process.env.RESEND_FROM_EMAIL ||
          "ThinkATS <no-reply@mail.thinkats.com>",
        to: participant.email,
        subject: `Interview scheduled: ${interview.title}`,
        react: InterviewInviteEmail({ interview, participant }),
        attachments: [
          {
            fileName: "interview.ics",
            content: icsContent,
            mimeType: "text/calendar",
          },
        ],
      }),
    );
  }

  await Promise.allSettled(sendPromises);

  return NextResponse.json({ ok: true, interviewId: interview.id });
}
