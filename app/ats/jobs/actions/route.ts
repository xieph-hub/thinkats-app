// app/ats/jobs/actions/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type BulkAction = "publish" | "unpublish" | "close" | "duplicate" | "delete";

function buildRedirectUrl(
  requestUrl: string,
  opts: {
    tenantId?: string;
    q?: string;
    status?: string;
    clientId?: string;
    visibility?: string;
  },
) {
  const { tenantId, q, status, clientId, visibility } = opts;
  const url = new URL(requestUrl);
  url.pathname = "/ats/jobs";

  if (tenantId) url.searchParams.set("tenantId", tenantId);
  if (q) url.searchParams.set("q", q);
  if (status && status !== "all") {
    url.searchParams.set("status", status);
  }
  if (clientId && clientId !== "all") {
    url.searchParams.set("clientId", clientId);
  }
  if (visibility && visibility !== "all") {
    url.searchParams.set("visibility", visibility);
  }

  return url;
}

export async function POST(request: Request) {
  const formData = await request.formData();

  const tenantIdRaw = formData.get("tenantId");
  const qRaw = formData.get("q");
  const statusRaw = formData.get("status");
  const clientIdRaw = formData.get("clientId");
  const visibilityRaw = formData.get("visibility");
  const singleActionRaw = formData.get("singleAction");
  const bulkActionRaw = formData.get("bulkAction");

  const tenantId = typeof tenantIdRaw === "string" ? tenantIdRaw : "";
  const q = typeof qRaw === "string" ? qRaw : "";
  const status = typeof statusRaw === "string" ? statusRaw : "";
  const clientId = typeof clientIdRaw === "string" ? clientIdRaw : "";
  const visibility =
    typeof visibilityRaw === "string" ? visibilityRaw : "";

  const jobIds = formData
    .getAll("jobIds")
    .filter((v): v is string => typeof v === "string");

  let action: BulkAction | "" = "";
  let targetIds: string[] = [];

  // Single row actions from the 3-dot menu win over bulk
  if (typeof singleActionRaw === "string" && singleActionRaw) {
    const [actionName, id] = singleActionRaw.split(":");
    if (id) {
      action = actionName as BulkAction;
      targetIds = [id];
    }
  } else if (typeof bulkActionRaw === "string" && bulkActionRaw) {
    action = bulkActionRaw as BulkAction;
    targetIds = jobIds;
  }

  const redirectUrl = buildRedirectUrl(request.url, {
    tenantId,
    q,
    status,
    clientId,
    visibility,
  });

  // Nothing selected or no recognised action – just bounce back
  if (!action || targetIds.length === 0) {
    return NextResponse.redirect(redirectUrl, { status: 303 });
  }

  if (
    !["publish", "unpublish", "close", "duplicate", "delete"].includes(
      action,
    )
  ) {
    return NextResponse.redirect(redirectUrl, { status: 303 });
  }

  const whereClause: any = {
    id: { in: targetIds },
  };
  if (tenantId) {
    whereClause.tenantId = tenantId;
  }

  try {
    if (action === "publish") {
      await prisma.job.updateMany({
        where: whereClause,
        data: {
          visibility: "public",
          status: "open",
        },
      });
    } else if (action === "unpublish") {
      await prisma.job.updateMany({
        where: whereClause,
        data: {
          visibility: "internal",
        },
      });
    } else if (action === "close") {
      await prisma.job.updateMany({
        where: whereClause,
        data: {
          status: "closed",
        },
      });
    } else if (action === "delete") {
      await prisma.job.deleteMany({
        where: whereClause,
      });
    } else if (action === "duplicate") {
      // Simple duplication: copy basic fields into a new draft, internal role
      const jobsToDuplicate = await prisma.job.findMany({
        where: whereClause,
      });

      for (const job of jobsToDuplicate) {
        await prisma.job.create({
          data: {
            tenantId: job.tenantId,
            clientCompanyId: job.clientCompanyId,
            title: job.title + " (Copy)",
            slug: job.slug
              ? `${job.slug}-copy-${Date.now()}`
              : undefined,
            location: job.location,
            department: job.department,
            employmentType: job.employmentType,
            experienceLevel: job.experienceLevel,
            workMode: (job as any).workMode ?? (job as any).locationType,
            overview: (job as any).overview,
            aboutClient: (job as any).aboutClient,
            responsibilities: (job as any).responsibilities,
            requirements: (job as any).requirements,
            benefits: (job as any).benefits,
            visibility: "internal",
            status: "draft",
            salaryMin: (job as any).salaryMin,
            salaryMax: (job as any).salaryMax,
            salaryCurrency: (job as any).salaryCurrency,
            salaryVisible: (job as any).salaryVisible,
            internalOnly: (job as any).internalOnly,
            confidential: (job as any).confidential,
          } as any,
        });
      }
    }
  } catch (err) {
    console.error("Error applying ATS jobs action:", err);
    // We still redirect back; later you can add flash messaging if needed.
  }

  return NextResponse.redirect(redirectUrl, { status: 303 });
}
