// app/ats/jobs/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getResourcinTenant } from "@/lib/tenant";

type JobAction = "publish" | "unpublish" | "close" | "duplicate" | "delete";

export async function POST(req: NextRequest) {
  const formData = await req.formData();

  const tenantIdFromForm = formData.get("tenantId")?.toString() || "";
  const q = formData.get("q")?.toString() || "";
  const status = formData.get("status")?.toString() || "";
  const clientId = formData.get("clientId")?.toString() || "";
  const visibility = formData.get("visibility")?.toString() || "";

  const singleActionRaw = formData.get("singleAction")?.toString() || "";
  const bulkActionRaw = formData.get("bulkAction")?.toString() || "";

  const jobIds = formData
    .getAll("jobIds")
    .map((v) => v.toString())
    .filter(Boolean);

  // Resolve tenant
  let tenantId = tenantIdFromForm;
  if (!tenantId) {
    const defaultTenant = await getResourcinTenant();
    if (!defaultTenant) {
      return redirectBack(req, tenantIdFromForm, q, status, clientId, visibility);
    }
    tenantId = defaultTenant.id;
  } else {
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { id: true },
    });
    if (!tenant) {
      return redirectBack(req, tenantIdFromForm, q, status, clientId, visibility);
    }
  }

  // Decide which action to run
  if (singleActionRaw) {
    const [action, jobId] = singleActionRaw.split(":");
    if (action && jobId) {
      await applyJobAction({
        action: action as JobAction,
        jobIds: [jobId],
        tenantId,
      });
    }
  } else if (bulkActionRaw && jobIds.length > 0) {
    await applyJobAction({
      action: bulkActionRaw as JobAction,
      jobIds,
      tenantId,
    });
  }

  return redirectBack(req, tenantId, q, status, clientId, visibility);
}

function redirectBack(
  req: NextRequest,
  tenantId: string | undefined,
  q: string,
  status: string,
  clientId: string,
  visibility: string,
) {
  const url = new URL(req.url);
  const search = new URLSearchParams();

  if (tenantId) search.set("tenantId", tenantId);
  if (q) search.set("q", q);
  if (status && status !== "all") search.set("status", status);
  if (clientId && clientId !== "all") search.set("clientId", clientId);
  if (visibility && visibility !== "all") search.set("visibility", visibility);

  const redirectPath =
    "/ats/jobs" + (search.toString() ? `?${search.toString()}` : "");
  return NextResponse.redirect(new URL(redirectPath, url.origin));
}

async function applyJobAction(args: {
  action: JobAction;
  jobIds: string[];
  tenantId: string;
}) {
  const { action, jobIds, tenantId } = args;

  const whereScoped = {
    id: { in: jobIds },
    tenantId,
  } as const;

  if (action === "publish") {
    await prisma.job.updateMany({
      where: whereScoped,
      data: {
        status: "open",
        visibility: "public",
        // isPublished: true,
      },
    });
    return;
  }

  if (action === "unpublish") {
    await prisma.job.updateMany({
      where: whereScoped,
      data: {
        visibility: "internal",
        // isPublished: false,
      },
    });
    return;
  }

  if (action === "close") {
    await prisma.job.updateMany({
      where: whereScoped,
      data: {
        status: "closed",
      },
    });
    return;
  }

  if (action === "delete") {
    // If FK constraints are not CASCADE, delete children (applications, notes, etc.) first.
    await prisma.job.deleteMany({
      where: whereScoped,
    });
    return;
  }

  if (action === "duplicate") {
    const jobsToCopy = await prisma.job.findMany({
      where: whereScoped,
    });

    for (const job of jobsToCopy) {
      await prisma.job.create({
        data: {
          tenantId,
          clientCompanyId: (job as any).clientCompanyId,
          title: `${job.title} (copy)`,
          slug: null,
          location: job.location,
          // @ts-expect-error – adjust if needed
          locationType: (job as any).locationType ?? null,
          employmentType: job.employmentType,
          experienceLevel: job.experienceLevel,
          department: job.department,
          // Narrative + comp fields – adjust/remove if schema differs
          // @ts-expect-error
          shortDescription: (job as any).shortDescription ?? null,
          // @ts-expect-error
          overview: (job as any).overview ?? null,
          // @ts-expect-error
          aboutClient: (job as any).aboutClient ?? null,
          // @ts-expect-error
          responsibilities: (job as any).responsibilities ?? null,
          // @ts-expect-error
          requirements: (job as any).requirements ?? null,
          // @ts-expect-error
          benefits: (job as any).benefits ?? null,
          // @ts-expect-error
          salaryCurrency: (job as any).salaryCurrency ?? null,
          // @ts-expect-error
          salaryMin: (job as any).salaryMin ?? null,
          // @ts-expect-error
          salaryMax: (job as any).salaryMax ?? null,
          // @ts-expect-error
          salaryVisible: (job as any).salaryVisible ?? false,
          status: "draft",
          visibility: "internal",
          internalOnly: (job as any).internalOnly,
          confidential: (job as any).confidential,
          // isPublished: false,
        },
      });
    }
  }
}
