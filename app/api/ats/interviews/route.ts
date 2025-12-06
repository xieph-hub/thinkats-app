// app/api/ats/interviews/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { resend } from "@/lib/resendClient";
import InterviewInviteEmail from "@/emails/InterviewInviteEmail";
import { buildInterviewIcs } from "@/lib/ics/interview";
import { getResourcinTenant } from "@/lib/tenant";

const RESEND_FROM_EMAIL =
  process.env.RESEND_FROM_EMAIL ||
  "ThinkATS <no-reply@mail.resourcin.com>";

const PUBLIC_SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://www.resourcin.com";

type PostBody = {
  applicationId: string;
  scheduledAt: string; // ISO string from the client
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

type PatchBody = {
  interviewId: string;
  status?: string | null;
  rating?: number | null;
  ratingScaleMax?: number | null;
  feedbackNotes?: string | null;
  outcome?: string | null;
  competencies?: {
    label: string;
    rating?: number | null;
    comment?: string | null;
  }[];
};

const VALID_STATUSES = [
  "SCHEDULED",
  "COMPLETED",
  "NO_SHOW",
  "CANCELLED_CLIENT",
  "CANCELLED_CANDIDATE",
  "CANCELLED_OTHER",
] as const;
type ValidStatus = (typeof VALID_STATUSES)[number];

function normalizeStatus(raw?: string | null): ValidStatus | undefined {
  if (!raw) return undefined;
  const upper = raw.toUpperCase() as ValidStatus;
  return VALID_STATUSES.includes(upper) ? upper : undefined;
}

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

// ---------------------------------------------------------------------------
// POST – schedule interview + send invite
// ---------------------------------------------------------------------------
export async function POST(req: NextRequest) {
  try {
    const tenant = await getResourcinTenant();
    if (!tenant) {
      return NextResponse.json(
        { ok: false, error: "No tenant configured." },
        { status: 500 },
      );
    }

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

    if (
      !application ||
      !application.job ||
      application.job.tenantId !== tenant.id
    ) {
      return NextResponse.json(
        { ok: false, error: "Application or job not found for this tenant." },
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
    const clientName = job.clientCompany?.name ?? null;

    const orgName =
      inviterOrgName?.trim() ||
      clientName ||
      tenant.name ||
      "Hiring organisation";

    // 1) Persist interview record – lifecycle starts as SCHEDULED
    const interview = await prisma.applicationInterview.create({
      data: {
        applicationId: application.id,
        scheduledAt: start,
        durationMins,
        type: type || null,
        location: location || null,
        videoUrl: videoUrl || null,
        notes: notes || null,
        status: "SCHEDULED",
      },
    });

    // 2) Optional participants (interviewers, observers, etc.)
    if (attendees && attendees.length > 0) {
      await prisma.interviewParticipant.createMany({
        data: attendees
          .filter((p) => p.email)
          .map((p) => ({
            interviewId: interview.id,
            name: p.name || p.email,
            email: p.email,
            role: p.role || "Interviewer",
          })),
      });
    }

    // 3) Build ICS payload
    const ics = buildInterviewIcs({
      summary: `${jobTitle} – Interview (${orgName})`,
      description:
        notes ||
        `Interview for ${jobTitle}${
          clientName ? ` at ${clientName}` : ""
        } – organised by ${orgName}.`,
      start,
      end,
      organizer: {
        name: organiserName || orgName,
        email: organiserEmail || "no-reply@mail.resourcin.com",
      },
      attendees: [
        {
          name: candidateName,
          email: candidateEmail,
        },
        ...attendees
          .filter((p) => p.email)
          .map((p) => ({
            name: p.name || p.email,
            email: p.email,
          })),
      ],
      location: videoUrl || location || undefined,
    });

    const interviewDateLabel = formatInterviewDateRange(start, end);

    // 4) Send invite to candidate (and optionally CC interviewers)
    const to: string[] = [candidateEmail];
    const cc: string[] = attendees
      .map((p) => p.email)
      .filter((email) => !!email);

    await resend.emails.send({
      from: RESEND_FROM_EMAIL,
      to,
      cc: cc.length > 0 ? cc : undefined,
      subject: `Interview scheduled – ${jobTitle} (${orgName})`,
      react: InterviewInviteEmail({
        candidateName,
        jobTitle,
        interviewDate: interviewDateLabel,
        interviewType: type,
        location,
        videoUrl,
        notes,
        organiserName: organiserName || orgName,
        inviterOrgName: orgName,
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

// ---------------------------------------------------------------------------
// PATCH – update lifecycle + rating + competencies
// ---------------------------------------------------------------------------
export async function PATCH(req: NextRequest) {
  try {
    const tenant = await getResourcinTenant();
    if (!tenant) {
      return NextResponse.json(
        { ok: false, error: "No tenant configured." },
        { status: 500 },
      );
    }

    const body = (await req.json()) as PatchBody;
    const {
      interviewId,
      status,
      rating,
      ratingScaleMax,
      feedbackNotes,
      outcome,
      competencies = [],
    } = body;

    if (!interviewId) {
      return NextResponse.json(
        { ok: false, error: "interviewId is required." },
        { status: 400 },
      );
    }

    const interview = await prisma.applicationInterview.findUnique({
      where: { id: interviewId },
    });

    if (!interview) {
      return NextResponse.json(
        { ok: false, error: "Interview not found." },
        { status: 404 },
      );
    }

    // Ensure the interview belongs to the current tenant via jobApplication -> job
    const application = await prisma.jobApplication.findUnique({
      where: { id: interview.applicationId },
      include: {
        job: true,
      },
    });

    if (!application || !application.job || application.job.tenantId !== tenant.id) {
      return NextResponse.json(
        { ok: false, error: "Interview does not belong to this tenant." },
        { status: 403 },
      );
    }

    const normalisedStatus = normalizeStatus(status ?? undefined);

    const safeRating =
      typeof rating === "number" && rating > 0 ? Math.round(rating) : null;

    const safeScale =
      typeof ratingScaleMax === "number" && ratingScaleMax > 0
        ? Math.round(ratingScaleMax)
        : null;

    const updateData: any = {
      feedbackNotes: feedbackNotes?.trim() || null,
      outcome: outcome?.trim() || null,
    };

    if (normalisedStatus) {
      updateData.status = normalisedStatus;
    }

    if (safeRating !== null) {
      updateData.rating = safeRating;
    }

    if (safeScale !== null) {
      updateData.ratingScaleMax = safeScale;
    }

    await prisma.applicationInterview.update({
      where: { id: interviewId },
      data: updateData,
    });

    // Upsert competencies – simple strategy: wipe and recreate for this interview
    if (Array.isArray(competencies)) {
      const cleaned = competencies
        .map((c) => ({
          label: (c.label || "").trim(),
          rating:
            typeof c.rating === "number" && c.rating > 0
              ? Math.round(c.rating)
              : null,
          comment: c.comment?.trim() || null,
        }))
        .filter((c) => c.label.length > 0);

      await prisma.interviewCompetencyRating.deleteMany({
        where: { interviewId },
      });

      if (cleaned.length > 0) {
        await prisma.interviewCompetencyRating.createMany({
          data: cleaned.map((c) => ({
            interviewId,
            label: c.label,
            rating: c.rating,
            comment: c.comment,
          })),
        });
      }
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Error updating interview feedback:", error);
    return NextResponse.json(
      {
        ok: false,
        error:
          "Something went wrong while saving interview feedback. Please try again.",
      },
      { status: 500 },
    );
  }
}
