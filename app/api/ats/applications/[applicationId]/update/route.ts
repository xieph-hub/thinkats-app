// app/api/ats/applications/[applicationId]/update/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAtsTenantScope } from "@/lib/auth/tenantAccess";
import { getServerUser } from "@/lib/auth/getServerUser";
import { cookies } from "next/headers";
import { OTP_COOKIE_NAME } from "@/lib/requireOtp";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";

type ApplicationStatus =
  | "APPLIED"
  | "SCREENING"
  | "INTERVIEW"
  | "OFFER"
  | "REJECTED"
  | "ON_HOLD"
  | "HIRED"
  | "WITHDRAWN";

function normalizeStatus(input: unknown): ApplicationStatus | null {
  if (typeof input !== "string") return null;
  const raw = input.trim();
  if (!raw) return null;

  const upper = raw.toUpperCase();

  // Accept common variants
  const map: Record<string, ApplicationStatus> = {
    APPLIED: "APPLIED",
    SCREEN: "SCREENING",
    SCREENING: "SCREENING",
    INTERVIEW: "INTERVIEW",
    OFFER: "OFFER",
    REJECTED: "REJECTED",
    ON_HOLD: "ON_HOLD",
    ONHOLD: "ON_HOLD",
    HIRED: "HIRED",
    WITHDRAWN: "WITHDRAWN",
  };

  return map[upper] ?? null;
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { applicationId: string } },
) {
  try {
    const applicationId = params.applicationId?.trim();

    if (!applicationId) {
      return NextResponse.json(
        { error: "Missing application id" },
        { status: 400 },
      );
    }

    // ---------------------------------------------------------------------
    // 1) Auth (server-side): must be logged in
    // ---------------------------------------------------------------------
    const ctx = await getServerUser();
    if (!ctx?.user?.id) {
      return NextResponse.json(
        { error: "unauthenticated" },
        { status: 401 },
      );
    }

    // ---------------------------------------------------------------------
    // 2) OTP (server-side): ATS APIs should require OTP too
    // ---------------------------------------------------------------------
    const otpOk = cookies().get(OTP_COOKIE_NAME)?.value === "1";
    if (!otpOk) {
      return NextResponse.json(
        { error: "otp_required" },
        { status: 403 },
      );
    }

    // ---------------------------------------------------------------------
    // 3) Tenant scope enforcement (CRITICAL)
    // ---------------------------------------------------------------------
    const { allowedTenantIds } = await getAtsTenantScope();
    if (!allowedTenantIds || allowedTenantIds.length === 0) {
      return NextResponse.json(
        { error: "tenant_access_denied" },
        { status: 403 },
      );
    }

    const body = await req.json().catch(() => ({}));

    const nextStatus = normalizeStatus(body.status);
    const note = (typeof body.note === "string" ? body.note : "")
      .trim()
      .slice(0, 2000) || null;

    if (!nextStatus && !note) {
      return NextResponse.json(
        { error: "Nothing to update. Provide at least a new status or a note." },
        { status: 400 },
      );
    }

    // Load the application tenant-safely via job.tenantId
    const existing = await prisma.jobApplication.findFirst({
      where: {
        id: applicationId,
        job: { tenantId: { in: allowedTenantIds } },
      },
      select: {
        id: true,
        status: true,
        jobId: true,
        fullName: true,
        email: true,
      },
    });

    if (!existing) {
      // Important: do not reveal whether it exists outside tenant scope
      return NextResponse.json(
        { error: "not_found" },
        { status: 404 },
      );
    }

    // ---------------------------------------------------------------------
    // 4) Update (Prisma) — only update fields we *know* exist
    // ---------------------------------------------------------------------
    const updated = await prisma.jobApplication.update({
      where: { id: existing.id },
      data: {
        ...(nextStatus ? { status: nextStatus } : {}),
      },
      select: {
        id: true,
        status: true,
        jobId: true,
        fullName: true,
        email: true,
      },
    });

    // ---------------------------------------------------------------------
    // 5) Best-effort event logging (non-blocking)
    // ---------------------------------------------------------------------
    // If you don’t actually have application_events yet, this will just no-op gracefully.
    try {
      await supabaseAdmin.from("application_events").insert({
        application_id: updated.id,
        type: "status_change",
        payload: {
          old_status: existing.status,
          new_status: nextStatus ?? updated.status,
          note,
          actor_user_id: ctx.user.id,
          actor_email: ctx.user.email,
        },
      });
    } catch (eventErr) {
      console.error("application_events insert failed (ignored):", eventErr);
    }

    // Optional email hooks (still non-blocking)
    if (nextStatus === "INTERVIEW" || nextStatus === "OFFER" || nextStatus === "REJECTED") {
      const templateKey =
        nextStatus === "INTERVIEW"
          ? "interview_invite"
          : nextStatus === "OFFER"
            ? "offer"
            : "rejection";

      try {
        await supabaseAdmin.from("application_events").insert({
          application_id: updated.id,
          type: "email_queued",
          payload: {
            template: templateKey,
            to: updated.email,
            candidate_name: updated.fullName,
            actor_user_id: ctx.user.id,
          },
        });
      } catch (emailErr) {
        console.error("email_queued event insert failed (ignored):", emailErr);
      }
    }

    return NextResponse.json(
      { id: updated.id, status: updated.status },
      { status: 200 },
    );
  } catch (err) {
    console.error("ATS applications/update – unexpected error:", err);
    return NextResponse.json(
      { error: "Unexpected error" },
      { status: 500 },
    );
  }
}
