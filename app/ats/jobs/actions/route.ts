// app/ats/jobs/actions/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getResourcinTenant } from "@/lib/tenant";

async function applyActionToJobs(
  jobIds: string[],
  action: string,
  tenantId: string,
) {
  if (!jobIds.length) return;

  const key = action.toLowerCase();

  if (key === "publish") {
    await prisma.job.updateMany({
      where: { id: { in: jobIds }, tenantId },
      data: {
        visibility: "public",
        status: "open",
      },
    });
    return;
  }

  if (key === "unpublish") {
    await prisma.job.updateMany({
      where: { id: { in: jobIds }, tenantId },
      data: {
        visibility: "internal",
      },
    });
    return;
  }

  if (key === "close") {
    await prisma.job.updateMany({
      where: { id: { in: jobIds }, tenantId },
      data: {
        status: "closed",
      },
    });
    return;
  }

  if (key === "duplicate") {
    const existing = await prisma.job.findMany({
      where: { id: { in: jobIds }, tenantId },
    });

    for (const job of existing) {
      await prisma.job.create({
        data: {
          tenantId,
          clientCompanyId: job.clientCompanyId,
          title: `${job.title} (copy)`,
          slug: null, // avoid slug collisions – can be set later
          location: job.location,
          employmentType: job.employmentType,
          experienceLevel: job.experienceLevel,
          status: "draft",
          visibility: "internal",
          overview: job.overview,
          aboutClient: job.aboutClient,
          responsibilities: job.responsibilities,
          requirements: job.requirements,
          benefits: job.benefits,
          workMode: job.workMode,
          locationType: job.locationType,
          salaryMin: job.salaryMin,
          salaryMax: job.salaryMax,
          salaryCurrency: job.salaryCurrency,
          salaryVisible: job.salaryVisible,
          internalOnly: job.internalOnly,
          confidential: job.confidential,
        },
      });
    }
    return;
  }

  if (key === "delete") {
    // Soft delete: mark closed + internal so we don't break FKs
    await prisma.job.updateMany({
      where: { id: { in: jobIds }, tenantId },
      data: {
        status: "closed",
        visibility: "internal",
      },
    });
    return;
  }
}

export async function POST(req: NextRequest) {
  const tenant = await getResourcinTenant();
  const tenantId = tenant.id;

  const formData = await req.formData();

  const jobIds = (formData.getAll("jobIds") as string[])
    .map((id) => id.toString())
    .filter(Boolean);

  const singleActionRaw = (formData.get("singleAction") ?? "").toString();
  const bulkActionRaw = (formData.get("bulkAction") ?? "").toString();

  const actions: { type: string; jobIds: string[] }[] = [];

  if (singleActionRaw) {
    const [type, jobId] = singleActionRaw.split(":");
    if (type && jobId) {
      actions.push({ type, jobIds: [jobId] });
    }
  } else if (bulkActionRaw && jobIds.length > 0) {
    actions.push({ type: bulkActionRaw, jobIds });
  }

  for (const a of actions) {
    await applyActionToJobs(a.jobIds, a.type, tenantId);
  }

  // Preserve filters on redirect
  const tenantIdParam = (formData.get("tenantId") ?? "").toString();
  const q = (formData.get("q") ?? "").toString();
  const status = (formData.get("status") ?? "").toString();
  const clientId = (formData.get("clientId") ?? "").toString();
  const visibility = (formData.get("visibility") ?? "").toString();
  const location = (formData.get("location") ?? "").toString();

  const search = new URLSearchParams();
  if (tenantIdParam) search.set("tenantId", tenantIdParam);
  if (q) search.set("q", q);
  if (status) search.set("status", status);
  if (clientId) search.set("clientId", clientId);
  if (visibility) search.set("visibility", visibility);
  if (location) search.set("location", location);

  const redirectUrl = new URL(req.url);
  redirectUrl.pathname = "/ats/jobs";
  redirectUrl.search = search.toString();

  return NextResponse.redirect(redirectUrl.toString(), { status: 303 });
}
