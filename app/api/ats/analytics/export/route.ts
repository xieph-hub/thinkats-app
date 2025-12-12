import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getResourcinTenant } from "@/lib/tenant";

function parseDate(value: string | null): Date | null {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  const tenantParam = searchParams.get("tenantId");
  const fromStr = searchParams.get("from");
  const toStr = searchParams.get("to");

  // Resolve tenant
  let tenant = null;

  if (tenantParam) {
    tenant = await prisma.tenant.findFirst({
      where: {
        OR: [{ id: tenantParam }, { slug: tenantParam }],
      },
    });
  }

  if (!tenant) {
    tenant = await getResourcinTenant();
  }

  if (!tenant) {
    return new Response("Tenant not found", { status: 404 });
  }

  const now = new Date();
  let fromDate = parseDate(fromStr);
  let toDate = parseDate(toStr);

  if (!fromDate && !toDate) {
    toDate = now;
    fromDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  } else {
    if (!fromDate && toDate) {
      fromDate = new Date(toDate.getTime() - 30 * 24 * 60 * 60 * 1000);
    }
    if (fromDate && !toDate) {
      toDate = now;
    }
  }

  if (!fromDate) fromDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  if (!toDate) toDate = now;

  const toDateInclusive = new Date(toDate);
  toDateInclusive.setHours(23, 59, 59, 999);

  // Jobs for this tenant
  const jobs = await prisma.job.findMany({
    where: { tenantId: tenant.id },
    select: {
      id: true,
      title: true,
      status: true,
      hiringManagerId: true,
    },
  });

  const jobIds = jobs.map((j) => j.id);
  if (jobIds.length === 0) {
    return new Response("No jobs for this tenant.", {
      status: 200,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
      },
    });
  }

  const jobsById = new Map<string, (typeof jobs)[number]>();
  jobs.forEach((job) => jobsById.set(job.id, job));

  // Applications in range
  const applications = await prisma.jobApplication.findMany({
    where: {
      jobId: { in: jobIds },
      createdAt: {
        gte: fromDate,
        lte: toDateInclusive,
      },
    },
    select: {
      id: true,
      jobId: true,
      candidateId: true,
      createdAt: true,
      stage: true,
      source: true,
    },
    orderBy: { createdAt: "desc" },
  });

  // Resolve hiring managers → only email (no name field in User model)
  const uniqueManagerIds = Array.from(
    new Set(
      jobs
        .map((j) => j.hiringManagerId)
        .filter((id): id is string => !!id),
    ),
  );

  const users =
    uniqueManagerIds.length === 0
      ? []
      : await prisma.user.findMany({
          where: { id: { in: uniqueManagerIds } },
          select: {
            id: true,
            email: true,
          },
        });

  const userById = new Map<string, (typeof users)[number]>();
  users.forEach((u) => userById.set(u.id, u));

  // Build CSV
  const header = [
    "ApplicationID",
    "JobID",
    "JobTitle",
    "JobStatus",
    "HiringManagerName",
    "HiringManagerEmail",
    "Stage",
    "Source",
    "CandidateID",
    "AppliedAt",
  ];

  const lines: string[] = [];
  lines.push(header.join(","));

  for (const app of applications) {
    const job = jobsById.get(app.jobId);
    const user = job?.hiringManagerId
      ? userById.get(job.hiringManagerId)
      : null;

    const managerLabel = user?.email ?? "";
    const managerEmail = user?.email ?? "";

    const row = [
      app.id,
      app.jobId,
      job?.title ?? "",
      job?.status ?? "",
      managerLabel,
      managerEmail,
      app.stage ?? "",
      (app.source ?? "").replace(/,/g, " "),
      app.candidateId ?? "",
      app.createdAt.toISOString(),
    ];

    const escaped = row.map((value) =>
      `"${String(value).replace(/"/g, '""')}"`,
    );
    lines.push(escaped.join(","));
  }

  const csv = lines.join("\r\n");

  const filename = `thinkats-analytics-${
    tenant.slug ?? tenant.id
  }-${fromStr ?? ""}-${toStr ?? ""}.csv`;

  return new Response(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
