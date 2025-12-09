// app/api/ats/tenants/[tenantId]/status/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerUser } from "@/lib/auth/getServerUser";

export const runtime = "nodejs";

/**
 * POST /api/ats/tenants/:tenantId/status
 *
 * Body:
 *  - { action: "update_status", status: "active" | "trial" | "suspended" | "archived" }
 *  - OR { action: "delete" }
 *
 * Only SUPER_ADMIN can do this.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { tenantId: string } },
) {
  try {
    const ctx = await getServerUser();

    if (!ctx || !ctx.user) {
      return NextResponse.json(
        { ok: false, error: "unauthenticated" },
        { status: 401 },
      );
    }

    if (!ctx.isSuperAdmin) {
      return NextResponse.json(
        { ok: false, error: "forbidden" },
        { status: 403 },
      );
    }

    const tenantId = params.tenantId;
    if (!tenantId) {
      return NextResponse.json(
        { ok: false, error: "missing_tenant_id" },
        { status: 400 },
      );
    }

    const body = await req.json().catch(() => null);
    const action = body?.action as string | undefined;

    if (!action) {
      return NextResponse.json(
        { ok: false, error: "missing_action" },
        { status: 400 },
      );
    }

    if (action === "delete") {
      // Protect against deleting tenants that still have data
      const [jobCount, clientCount, candidateCount] = await Promise.all([
        prisma.job.count({ where: { tenantId } }),
        prisma.clientCompany.count({ where: { tenantId } }),
        prisma.candidate.count({ where: { tenantId } }),
      ]);

      if (jobCount > 0 || clientCount > 0 || candidateCount > 0) {
        return NextResponse.json(
          {
            ok: false,
            error: "tenant_has_dependencies",
            jobCount,
            clientCount,
            candidateCount,
          },
          { status: 400 },
        );
      }

      await prisma.tenant.delete({ where: { id: tenantId } });

      return NextResponse.json({ ok: true, deleted: true });
    }

    if (action === "update_status") {
      const statusRaw = (body?.status as string | undefined) ?? "";
      const allowed = ["active", "trial", "suspended", "archived"];
      const status = statusRaw.toLowerCase();

      if (!allowed.includes(status)) {
        return NextResponse.json(
          { ok: false, error: "invalid_status" },
          { status: 400 },
        );
      }

      const updated = await prisma.tenant.update({
        where: { id: tenantId },
        data: { status },
      });

      return NextResponse.json({
        ok: true,
        status: updated.status,
      });
    }

    return NextResponse.json(
      { ok: false, error: "unknown_action" },
      { status: 400 },
    );
  } catch (err) {
    console.error("[tenant-status] Unexpected error", err);
    return NextResponse.json(
      { ok: false, error: "server_error" },
      { status: 500 },
    );
  }
}
