// app/api/ats/jobs/bulk-actions/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getResourcinTenant } from "@/lib/tenant";

type BulkAction = "publish" | "unpublish" | "close" | "delete";

export async function POST(req: NextRequest) {
  try {
    const tenant = await getResourcinTenant();

    if (!tenant) {
      return NextResponse.json(
        { error: "No default tenant configured." },
        { status: 500 },
      );
    }

    const body = await req.json().catch(() => null);

    if (!body) {
      return NextResponse.json(
        { error: "Invalid JSON body." },
        { status: 400 },
      );
    }

    const { jobIds, action } = body as {
      jobIds?: string[];
      action?: BulkAction;
    };

    if (!Array.isArray(jobIds) || jobIds.length === 0) {
      return NextResponse.json(
        { error: "jobIds must be a non-empty array." },
        { status: 400 },
      );
    }

    if (!action || !["publish", "unpublish", "close", "delete"].includes(action)) {
      return NextResponse.json(
        { error: "Invalid or missing action." },
        { status: 400 },
      );
    }

    // Always scope by tenant
    const jobWhere = {
      id: { in: jobIds },
      tenantId: tenant.id,
    } as const;

    if (action === "publish") {
      await prisma.job.updateMany({
        where: jobWhere,
        data: {
          status: "open",
          visibility: "public",
        },
      });
    } else if (action === "unpublish") {
      await prisma.job.updateMany({
        where: jobWhere,
        data: {
          visibility: "internal",
        },
      });
    } else if (action === "close") {
      await prisma.job.updateMany({
        where: jobWhere,
        data: {
          status: "closed",
        },
      });
    } else if (action === "delete") {
      // Hard delete: wipe dependent records first to avoid FK issues.
      await prisma.jobApplication.deleteMany({
        where: {
          jobId: { in: jobIds },
          job: {
            tenantId: tenant.id,
          },
        },
      });

      await prisma.jobStage.deleteMany({
        where: {
          jobId: { in: jobIds },
          tenantId: tenant.id,
        },
      });

      await prisma.sentEmail.deleteMany({
        where: {
          jobId: { in: jobIds },
          tenantId: tenant.id,
        },
      });

      await prisma.job.deleteMany({
        where: jobWhere,
      });

      return NextResponse.json({
        ok: true,
        deletedIds: jobIds,
      });
    }

    const updatedJobs = await prisma.job.findMany({
      where: jobWhere,
      select: {
        id: true,
        status: true,
        visibility: true,
      },
    });

    return NextResponse.json({
      ok: true,
      updatedJobs,
    });
  } catch (error) {
    console.error("POST /api/ats/jobs/bulk-actions error", error);
    return NextResponse.json(
      { error: "Failed to run bulk action." },
      { status: 500 },
    );
  }
}
