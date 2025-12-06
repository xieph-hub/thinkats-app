// app/api/ats/interviews/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { resend } from "@/lib/resendClient";
import InterviewInviteEmail from "@/emails/InterviewInviteEmail";
import { buildInterviewIcs } from "@/lib/ics/interview";

const RESEND_FROM_EMAIL =
  process.env.RESEND_FROM_EMAIL ||
  "ThinkATS <no-reply@mail.resourcin.com>";

const PUBLIC_SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://www.resourcin.com";

type PostBody = {
  applicationId: string;
  scheduledAt: string; // ISO string
  durationMins?: number;
  type?: string;
  location?: string | null;
  videoUrl?: string | null;
  notes?: string | null;
  organiserName?: string | null;
  organiserEmail?: string | null;
  inviterOrgName?: string | null;
  attendees?: {
    name?: string;
    email: string;
    role?: string;
  }[];
};

function formatInterviewDateRange(start: Date, end: Date): string {
  try {
    const startStr = start.toLocaleString("en-GB", {
      weekday: "short",
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    const endStr = end.toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
    });

    return `${startStr} – ${endStr}`;
  } catch {
    return start.toISOString();
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as PostBody;

    const {
      applicationId,
      scheduledAt,
      durationMins = 60,
      type,
      location,
      videoUrl,
      notes,
      organiserName,
      organiserEmail,
      inviterOrgName,
      attendees = [],
    } = body;

    if (!applicationId || !scheduledAt) {
      return NextResponse.json(
        {
          ok: false,
          error: "applicationId and scheduledAt are required.",
        },
        { status: 400 },
      );
    }

    const start = new Date(scheduledAt);
    if (Number.isNaN(start.getTime())) {
      return NextResponse.json(
        { ok: false, error: "scheduledAt must be a valid ISO date string." },
        { status: 400 },
      );
    }
    const end = new Date(start.getTime() + durationMins * 60 * 1000);

    // Load application + job + candidate
    const application = await prisma.jobApplication.findUnique({
      where: { id: applicationId },
      include: {
        candidate: true,
        job: {
          include: {
            clientCompany: true,
          },
        },
      },
    });

    if (!application || !application.job) {
      return NextResponse.json(
        { ok: false, error: "Application or job not found." },
        { status: 404 },
      );
    }

    const job = application.job;
    const candidate = application.candidate;

    const candidateName =
      candidate?.fullName || application.fullName || "Candidate";
    const candidateEmail =
      candidate?.email || application.email || undefined;

    if (!candidateEmail) {
      return NextResponse.json(
        {
          ok: false,
          error: "Application has no candidate email to send an invite to.",
        },
        { status: 400 },
      );
    }

    const jobTitle = job.title || "Untitled role";
    const clientName = job.clientCompany?.name || null;
    const orgLabel = inviterOrgName || clientName || null;

    // 1) Persist interview record
    const interview = await prisma.applicationInterview.create({
      data: {
        applicationId: application.id,
        scheduledAt: start,
        durationMins,
        type: type || null,
        location: location || null,
        videoUrl: videoUrl || null,
        notes: notes || null,
      },
    });

    // 2) Optional participants
    const cleanedAttendees = (attendees || []).filter((p) => p.email);
    if (cleanedAttendees.length > 0) {
      await prisma.interviewParticipant.createMany({
        data: cleanedAttendees.map((p) => ({
          interviewId: interview.id,
          name: p.name || p.email,
          email: p.email,
          role: p.role || "Interviewer",
        })),
      });
    }

    // 3) Build ICS payload
    const ics = buildInterviewIcs({
      summary: `${jobTitle} – Interview`,
      description:
        notes ||
        `Interview for ${jobTitle}${
          orgLabel ? ` at ${orgLabel}` : clientName ? ` at ${clientName}` : ""
        }`,
      start,
      end,
      organizer: {
        name: organiserName || orgLabel || "ThinkATS",
        email: organiserEmail || "no-reply@mail.resourcin.com",
      },
      attendees: [
        {
          name: candidateName,
          email: candidateEmail,
        },
        ...cleanedAttendees.map((p) => ({
          name: p.name || p.email,
          email: p.email,
        })),
      ],
      location: videoUrl || location || undefined,
    });

    const interviewDateLabel = formatInterviewDateRange(start, end);

    // 4) Send invite email
    const to: string[] = [candidateEmail];
    const cc: string[] = cleanedAttendees
      .map((p) => p.email)
      .filter((email) => !!email);

    const subjectBase = `Interview scheduled – ${jobTitle}`;
    const subject = orgLabel
      ? `${orgLabel} · ${subjectBase}`
      : subjectBase;

    await resend.emails.send({
      from: RESEND_FROM_EMAIL,
      to,
      cc: cc.length > 0 ? cc : undefined,
      subject,
      react: InterviewInviteEmail({
        candidateName,
        jobTitle,
        interviewDate: interviewDateLabel,
        interviewType: type,
        location: location || null,
        videoUrl: videoUrl || null,
        notes,
        organiserName: organiserName || null,
        organisationName: orgLabel,
        dashboardUrl: `${PUBLIC_SITE_URL}/ats/jobs/${job.id}`,
      }),
      attachments: [
        {
          filename: "interview.ics",
          content: ics,
        },
      ],
    });

    return NextResponse.json({
      ok: true,
      interviewId: interview.id,
    });
  } catch (error) {
    console.error("Error scheduling interview:", error);
    return NextResponse.json(
      {
        ok: false,
        error:
          "Something went wrong while scheduling the interview. Please try again.",
      },
      { status: 500 },
    );
  }
}
