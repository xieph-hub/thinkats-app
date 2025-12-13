// app/api/ats/applications/[applicationId]/update/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAtsTenantScope } from "@/lib/auth/tenantAccess";
import { ensureOtpVerified } from "@/lib/requireOtp";

export const runtime = "nodejs";

type ApplicationStatus =
  | "applied"
  | "screening"
  | "interview"
  | "offer"
  | "rejected";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { applicationId: string } },
) {
  try {
    // ATS step-up auth
    ensureOtpVerified(`/ats/applications/${params.applicationId}`);

    const scope = await getAtsTenantScope();
    const applicationId = params.applicationId;

    if (!applicationId) {
      return NextResponse.json({ error: "Missing application id" }, { status: 400 });
    }

    if (!scope.activeTenantId) {
      return NextResponse.json({ error: "No active tenant" }, { status: 403 });
    }

    // Non-admin must belong to the active tenant
    if (!scope.isSuperAdmin && scope.allowedTenantIds && !scope.allowedTenantIds.includes(scope.activeTenantId)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const status = body.status as ApplicationStatus | undefined;
    const note = (body.note as string | undefined)?.trim() || null;

    if (!status && !note) {
      return NextResponse.json(
        { error: "Nothing to update. Provide at least a new status or a note." },
        { status: 400 },
      );
    }

    // Ensure the application belongs to the active tenant (via its job)
    const existing = await prisma.jobApplication.findFirst({
      where: { id: applicationId, job: { tenantId: scope.activeTenantId } },
      include: { job: true },
    });

    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const updated = await prisma.jobApplication.update({
      where: { id: applicationId },
      data: status ? { status } : {},
      select: { id: true, status: true, jobId: true, fullName: true, email: true },
    });

    // Event log (if you have application_events in Prisma, use it; otherwise skip)
    // If you don't yet have an ApplicationEvent model, remove this block.
    try {
      await prisma.applicationEvent.create({
        data: {
          applicationId: updated.id,
          type: "status_change",
          payload: {
            new_status: status ?? updated.status,
            note,
          },
        } as any,
      });
    } catch {
      // ignore logging if table/model isn't present yet
    }

    return NextResponse.json({ id: updated.id, status: updated.status }, { status: 200 });
  } catch (err) {
    console.error("ATS applications/update – unexpected error:", err);
    return NextResponse.json({ error: "Unexpected error" }, { status: 500 });
  }
}
