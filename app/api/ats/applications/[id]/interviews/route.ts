// app/api/ats/applications/[id]/interviews/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getResourcinTenant } from "@/lib/tenant";

export const runtime = "nodejs";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const applicationId = params.id;

    if (!applicationId) {
      return NextResponse.json(
        { ok: false, error: "Missing application id" },
        { status: 400 },
      );
    }

    const tenant = await getResourcinTenant();
    if (!tenant) {
      return NextResponse.json(
        { ok: false, error: "Tenant not configured" },
        { status: 400 },
      );
    }

    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json(
        { ok: false, error: "Invalid JSON body" },
        { status: 400 },
      );
    }

    const {
      scheduledAt,
      durationMins,
      type,
      location,
      videoUrl,
      notes,
      participants,
    } = body as {
      scheduledAt?: string;
      durationMins?: number;
      type?: string;
      location?: string;
      videoUrl?: string;
      notes?: string;
      participants?: { name?: string; email: string; role?: string }[];
    };

    if (!scheduledAt) {
      return NextResponse.json(
        { ok: false, error: "scheduledAt is required" },
        { status: 400 },
      );
    }

    const scheduledDate = new Date(scheduledAt);
    if (Number.isNaN(scheduledDate.getTime())) {
      return NextResponse.json(
        { ok: false, error: "scheduledAt must be a valid date" },
        { status: 400 },
      );
    }

    // Make sure this application belongs to the current tenant
    const application = await prisma.jobApplication.findFirst({
      where: {
        id: applicationId,
        job: {
          tenantId: tenant.id,
        },
      },
      include: {
        job: true,
      },
    });

    if (!application) {
      return NextResponse.json(
        { ok: false, error: "Application not found for this tenant" },
        { status: 404 },
      );
    }

    const interview = await prisma.applicationInterview.create({
      data: {
        applicationId: application.id,
        scheduledAt: scheduledDate,
        durationMins:
          typeof durationMins === "number" && durationMins > 0
            ? durationMins
            : null,
        type:
          typeof type === "string" && type.trim()
            ? type.trim().toUpperCase()
            : null,
        location:
          typeof location === "string" && location.trim()
            ? location.trim()
            : null,
        videoUrl:
          typeof videoUrl === "string" && videoUrl.trim()
            ? videoUrl.trim()
            : null,
        notes:
          typeof notes === "string" && notes.trim() ? notes.trim() : null,
      },
    });

    // Participants
    if (Array.isArray(participants) && participants.length > 0) {
      const rows = participants
        .filter((p) => p && typeof p.email === "string" && p.email.trim())
        .map((p) => ({
          interviewId: interview.id,
          name:
            (p.name && p.name.toString().trim()) ||
            application.fullName ||
            p.email,
          email: p.email.toString().trim(),
          role: p.role ? p.role.toString().trim() : "Interviewer",
        }));

      if (rows.length > 0) {
        await prisma.interviewParticipant.createMany({ data: rows });
      }
    } else {
      // Default: at least the candidate as a participant
      await prisma.interviewParticipant.create({
        data: {
          interviewId: interview.id,
          name: application.fullName,
          email: application.email,
          role: "Candidate",
        },
      });
    }

    // Application-level event
    await prisma.applicationEvent.create({
      data: {
        applicationId: application.id,
        type: "interview_scheduled",
        payload: {
          interviewId: interview.id,
          scheduledAt: scheduledDate.toISOString(),
          type: interview.type,
          durationMins: interview.durationMins,
        },
      },
    });

    // Tenant-level activity log
    await prisma.activityLog.create({
      data: {
        tenantId: tenant.id,
        actorId: null, // TODO: wire current user id here later
        entityType: "application",
        entityId: application.id,
        action: "interview_scheduled",
        metadata: {
          interviewId: interview.id,
          scheduledAt: scheduledDate.toISOString(),
          type: interview.type,
        },
      },
    });

    return NextResponse.json(
      {
        ok: true,
        interview: {
          id: interview.id,
          scheduledAt: interview.scheduledAt,
          status: interview.status,
          type: interview.type,
          durationMins: interview.durationMins,
        },
      },
      { status: 201 },
    );
  } catch (err) {
    console.error("Schedule interview error:", err);
    return NextResponse.json(
      { ok: false, error: "Unexpected error scheduling interview" },
      { status: 500 },
    );
  }
}
