// app/api/ats/applications/[applicationId]/interviews/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getResourcinTenant } from "@/lib/tenant";
import { createSupabaseRouteClient } from "@/lib/supabaseRouteClient";

export const runtime = "nodejs";

export async function POST(
  req: NextRequest,
  { params }: { params: { applicationId: string } },
) {
  try {
    // NOTE: you asked to keep this for now; later we’ll replace with host/slug-based tenant resolution
    const tenant = await getResourcinTenant();
    if (!tenant) {
      return NextResponse.json(
        { ok: false, error: "No tenant configured" },
        { status: 400 },
      );
    }

    const applicationId = params.applicationId;
    if (!applicationId) {
      return NextResponse.json(
        { ok: false, error: "Missing applicationId" },
        { status: 400 },
      );
    }

    const formData = await req.formData();

    const scheduledAtRaw = formData.get("scheduledAt");
    const durationMinsRaw = formData.get("durationMins");
    const typeRaw = formData.get("type");
    const locationRaw = formData.get("location");
    const videoUrlRaw = formData.get("videoUrl");
    const notesRaw = formData.get("notes");
    const statusRaw = formData.get("status"); // ✅ add status support (it was missing)
    const redirectToRaw = formData.get("redirectTo");

    const type =
      typeof typeRaw === "string" && typeRaw.trim() ? typeRaw.trim() : null;

    const location =
      typeof locationRaw === "string" && locationRaw.trim()
        ? locationRaw.trim()
        : null;

    const videoUrl =
      typeof videoUrlRaw === "string" && videoUrlRaw.trim()
        ? videoUrlRaw.trim()
        : null;

    const notes =
      typeof notesRaw === "string" && notesRaw.trim() ? notesRaw.trim() : null;

    const status =
      typeof statusRaw === "string" && statusRaw.trim()
        ? statusRaw.trim()
        : "SCHEDULED";

    let scheduledAt: Date | null = null;
    if (typeof scheduledAtRaw === "string" && scheduledAtRaw.trim()) {
      // from <input type="datetime-local"> (interpreted by JS Date in local/server tz)
      const parsed = new Date(scheduledAtRaw);
      if (!Number.isNaN(parsed.getTime())) {
        scheduledAt = parsed;
      }
    }

    if (!scheduledAt) {
      return NextResponse.json(
        { ok: false, error: "Scheduled date/time is required" },
        { status: 400 },
      );
    }

    let durationMins: number | null = null;
    if (typeof durationMinsRaw === "string" && durationMinsRaw.trim()) {
      const parsed = parseInt(durationMinsRaw, 10);
      if (!Number.isNaN(parsed) && parsed > 0) {
        durationMins = parsed;
      }
    }

    // Load application + verify tenant scope (by job.tenantId)
    const application = await prisma.jobApplication.findFirst({
      where: { id: applicationId },
      select: {
        id: true,
        tenantId: true, // ✅ needed for tenant-scoped interview create
        candidateId: true,
        fullName: true,
        email: true,
        job: {
          select: {
            id: true,
            tenantId: true,
          },
        },
      },
    });

    if (!application || !application.job) {
      return NextResponse.json(
        { ok: false, error: "Application not found" },
        { status: 404 },
      );
    }

    if (application.job.tenantId !== tenant.id) {
      return NextResponse.json(
        { ok: false, error: "Application does not belong to this tenant" },
        { status: 403 },
      );
    }

    // Resolve current app user (interviewer / host) via Supabase session
    const supabase = createSupabaseRouteClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    let appUserId: string | null = null;
    let appUserName: string | null = null;
    let appUserEmail: string | null = null;

    if (!userError && user && user.email) {
      const email = user.email.toLowerCase();
      appUserEmail = email;
      appUserName =
        (user.user_metadata as any)?.full_name ??
        (user.user_metadata as any)?.name ??
        null;

      let appUser = await prisma.user.findUnique({
        where: { email },
      });

      if (!appUser) {
        appUser = await prisma.user.create({
          data: {
            email,
            fullName: appUserName,
            globalRole: "USER",
            isActive: true,
          },
        });
      }

      appUserId = appUser.id;
    }

    // ✅ Create interview (FIXED: tenant required + application relation)
    const interview = await prisma.applicationInterview.create({
      data: {
        // tenant is REQUIRED in your schema
        tenant: { connect: { id: application.tenantId } },

        // application relation (do not pass applicationId directly)
        application: { connect: { id: application.id } },

        scheduledAt,

        type,
        location,
        videoUrl,

        status,
        durationMins,
        notes,
      },
    });

    // Participants (Candidate)
    if (application.fullName || application.email) {
      await prisma.interviewParticipant.create({
        data: {
          interviewId: interview.id,
          name: application.fullName || application.email || "Candidate",
          email: application.email || "",
          role: "Candidate",
        },
      });
    }

    // Participants (Host / interviewer)
    if (appUserEmail) {
      await prisma.interviewParticipant.create({
        data: {
          interviewId: interview.id,
          name: appUserName || appUserEmail,
          email: appUserEmail,
          role: "Interviewer",
        },
      });
    }

    // Activity log
    await prisma.activityLog.create({
      data: {
        tenantId: tenant.id,
        actorId: appUserId,
        entityType: "application",
        entityId: application.id,
        action: "interview_scheduled",
        metadata: {
          interviewId: interview.id,
          scheduledAt: scheduledAt.toISOString(),
          type,
          location,
          videoUrl,
          durationMins,
          hasNotes: Boolean(notes),
          status,
        },
      },
    });

    const redirectTo =
      typeof redirectToRaw === "string" && redirectToRaw.trim()
        ? redirectToRaw
        : `/ats/candidates/${application.candidateId || ""}`;

    const redirectUrl = new URL(redirectTo, req.url);
    return NextResponse.redirect(redirectUrl, { status: 303 });
  } catch (err) {
    console.error("Schedule interview error:", err);
    return NextResponse.json(
      { ok: false, error: "Unexpected error scheduling interview" },
      { status: 500 },
    );
  }
}
