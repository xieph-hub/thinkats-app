// app/ats/jobs/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();

    const tenantIdRaw = formData.get("tenantId");
    const tenantId =
      typeof tenantIdRaw === "string" ? tenantIdRaw : null;

    const qRaw = formData.get("q");
    const statusRaw = formData.get("status");

    const q = typeof qRaw === "string" ? qRaw : "";
    const status =
      typeof statusRaw === "string" ? statusRaw : "all";

    const singleActionRaw = formData.get("singleAction");
    const bulkActionRaw = formData.get("bulkAction");

    // Build redirect URL preserving filters + tenant
    const redirectUrl = new URL("/ats/jobs", req.url);
    if (tenantId) redirectUrl.searchParams.set("tenantId", tenantId);
    if (q) redirectUrl.searchParams.set("q", q);
    if (status && status !== "all") {
      redirectUrl.searchParams.set("status", status);
    }

    const hasSingle =
      typeof singleActionRaw === "string" &&
      singleActionRaw.length > 0;

    if (hasSingle) {
      const [action, jobId] = (singleActionRaw as string).split(":");

      if (!jobId) {
        return NextResponse.redirect(redirectUrl);
      }

      await performJobAction(action, [jobId], tenantId || undefined);
      return NextResponse.redirect(redirectUrl);
    }

    const bulkAction =
      typeof bulkActionRaw === "string" ? bulkActionRaw : "";

    if (!bulkAction) {
      // No action selected; just go back
      return NextResponse.redirect(redirectUrl);
    }

    const jobIdsRaw = formData.getAll("jobIds") ?? [];
    const jobIds = jobIdsRaw
      .map((v) => (typeof v === "string" ? v : String(v)))
      .filter(Boolean);

    if (!jobIds.length) {
      return NextResponse.redirect(redirectUrl);
    }

    await performJobAction(bulkAction, jobIds, tenantId || undefined);

    return NextResponse.redirect(redirectUrl);
  } catch (err) {
    console.error("POST /ats/jobs error", err);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to process job action.",
      },
      { status: 500 },
    );
  }
}

async function performJobAction(
  action: string,
  jobIds: string[],
  tenantId?: string,
) {
  const whereClause: any = {
    id: { in: jobIds },
  };

  if (tenantId) {
    whereClause.tenantId = tenantId;
  }

  // Publish
  if (action === "publish") {
    await prisma.job.updateMany({
      where: whereClause,
      data: {
        isPublished: true,
        isPublic: true,
        visibility: "public",
        status: "open",
      },
    });
    return;
  }

  // Unpublish
  if (action === "unpublish") {
    await prisma.job.updateMany({
      where: whereClause,
      data: {
        isPublished: false,
        isPublic: false,
      },
    });
    return;
  }

  // Close
  if (action === "close") {
    await prisma.job.updateMany({
      where: whereClause,
      data: {
        status: "closed",
        isPublished: false,
      },
    });
    return;
  }

  // Reopen (kept in case you later expose it)
  if (action === "reopen") {
    await prisma.job.updateMany({
      where: whereClause,
      data: {
        status: "open",
      },
    });
    return;
  }

  // Duplicate
  if (action === "duplicate") {
    const jobs = await prisma.job.findMany({
      where: whereClause,
    });

    for (const job of jobs) {
      await prisma.job.create({
        data: {
          tenantId: job.tenantId,
          title: `${job.title} (Copy)`,
          department: job.department,
          location: job.location,
          locationType: job.locationType,
          employmentType: job.employmentType,
          experienceLevel: job.experienceLevel,
          seniority: job.seniority,
          workMode: job.workMode,
          clientCompanyId: job.clientCompanyId,
          overview: job.overview,
          aboutClient: job.aboutClient,
          responsibilities: job.responsibilities,
          requirements: job.requirements,
          benefits: job.benefits,
          shortDescription: job.shortDescription,
          externalId: null,
          tags: (job as any).tags ?? [],
          requiredSkills: (job as any).requiredSkills ?? [],
          salaryMin: (job as any).salaryMin,
          salaryMax: (job as any).salaryMax,
          salaryCurrency: job.salaryCurrency,
          salaryVisible: job.salaryVisible,
          visibility: job.visibility,
          status: "draft",
          internalOnly: job.internalOnly,
          confidential: job.confidential,
          isPublished: false,
          isPublic: false,
          slug: null, // force new slug later if needed
        },
      });
    }

    return;
  }

  // If unknown action, silently no-op
}
