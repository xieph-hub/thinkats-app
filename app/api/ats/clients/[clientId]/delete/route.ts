// app/api/ats/clients/[clientId]/delete/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerUser } from "@/lib/auth/getServerUser";

export const runtime = "nodejs";

/**
 * POST /api/ats/clients/:clientId/delete
 *
 * Only SUPER_ADMIN (or later, tenant owners/admins) can delete.
 * Will refuse to delete if there are jobs linked to this clientCompany.
 */
export async function POST(
  _req: NextRequest,
  { params }: { params: { clientId: string } },
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

    const clientId = params.clientId;
    if (!clientId) {
      return NextResponse.json(
        { ok: false, error: "missing_client_id" },
        { status: 400 },
      );
    }

    const client = await prisma.clientCompany.findUnique({
      where: { id: clientId },
    });

    if (!client) {
      return NextResponse.json(
        { ok: false, error: "client_not_found" },
        { status: 404 },
      );
    }

    const jobCount = await prisma.job.count({
      where: { clientCompanyId: clientId },
    });

    if (jobCount > 0) {
      return NextResponse.json(
        {
          ok: false,
          error: "client_has_jobs",
          jobCount,
        },
        { status: 400 },
      );
    }

    await prisma.clientCompany.delete({
      where: { id: clientId },
    });

    return NextResponse.json({ ok: true, deleted: true });
  } catch (err) {
    console.error("[client-delete] Unexpected error", err);
    return NextResponse.json(
      { ok: false, error: "server_error" },
      { status: 500 },
    );
  }
}
