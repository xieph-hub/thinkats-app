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
    // TEMP legacy tenant resolution (we’ll remove later)
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
    const statusRaw = formData.get("status");
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
      const parsed = new Date(scheduledAtRaw);
      if (!Number.isNaN(parsed.getTime())) scheduledAt = parsed;
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
      if (!Number.isNaN(parsed) && parsed > 0) durationMins = parsed;
    }

    // Load application + tenant guard
    const application = await prisma.jobApplication.findFirst({
      where: { id: applicationId },
      select: {
        id: true,
        tenantId: true,
        candidateId: true,
        fullName: true,
        email: true,
        job: { select: { tenantId: true } },
      },
    });

    if (!application || !application.job) {
      return NextResponse.json(
        { ok: false, error: "Application not found" },
        { status: 404 },
      );
    }

    // Strict tenant scope
    if (application.job.tenantId !== tenant.id) {
      return NextResponse.json(
        { ok: false, error: "Application does not belong to this tenant" },
        { status: 403 },
      );
    }

    // Resolve current user (interviewer) via Supabase session
    const supabase = createSupabaseRouteClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    let appUserId: string | null = null;
    let appUserName: string | null = null;
    let appUserEmail: string | null = null;

    if (user?.email) {
      appUserEmail = user.email.toLowerCase();
      appUserName =
        (user.user_metadata as any)?.full_name ??
        (user.user_metadata as any)?.name ??
        null;

      let appUser = await prisma.user.findUnique({
        where: { email: appUserEmail },
      });

      if (!appUser) {
        appUser = await prisma.user.create({
          data: {
            email: appUserEmail,
            fullName: appUserName,
            globalRole: "USER",
            isActive: true,
          },
        });
      }

      appUserId = appUser.id;
    }

    // ─────────────────────────────────────────────
    // CREATE INTERVIEW (tenant + application scoped)
    // ─────────────────────────────────────────────
    const interview = await prisma.applicationInterview.create({
      data: {
        tenant: { connect: { id: application.tenantId } },
        application: { connect: { id: application.id } },

        scheduledAt,
        type,
        location,
        videoUrl,
        status,
        durationMins,
        notes,
      },
      select: { id: true },
    });

    // ─────────────────────────────────────────────
    // PARTICIPANTS (tenant required ✅)
    // ─────────────────────────────────────────────

    // Candidate participant
    if (application.fullName || application.email) {
      await prisma.interviewParticipant.create({
        data: {
          tenant: { connect: { id: application.tenantId } }, // ✅ required
          interview: { connect: { id: interview.id } }, // ✅ relation connect

          name: application.fullName || application.email || "Candidate",
          email: application.email || "",
          role: "Candidate",
        },
      });
    }

    // Interviewer participant (current user)
    if (appUserEmail) {
      await prisma.interviewParticipant.create({
        data: {
          tenant: { connect: { id: application.tenantId } }, // ✅ required
          interview: { connect: { id: interview.id } }, // ✅ relation connect

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
          status,
          hasNotes: Boolean(notes),
        },
      },
    });

    const redirectTo =
      typeof redirectToRaw === "string" && redirectToRaw.trim()
        ? redirectToRaw
        : `/ats/candidates/${application.candidateId || ""}`;

    return NextResponse.redirect(new URL(redirectTo, req.url), { status: 303 });
  } catch (err) {
    console.error("Schedule interview error:", err);
    return NextResponse.json(
      { ok: false, error: "Unexpected error scheduling interview" },
      { status: 500 },
    );
  }
}
