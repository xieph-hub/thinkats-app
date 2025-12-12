// app/ats/analytics/export/pdf/route.ts
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getResourcinTenant } from "@/lib/tenant";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

export const runtime = "nodejs";

type StageBucket = { stage: string | null; _count: { _all: number } };
type SourceBucket = { source: string | null; _count: { _all: number } };
type TierBucket = { tier: string | null; _count: { _all: number } };
type AppsByJobBucket = { jobId: string; _count: { _all: number } };

type ClientSummary = {
  key: string;
  label: string;
  jobCount: number;
  applicationCount: number;
};

function pct(part: number, whole: number): string {
  if (!whole || whole <= 0) return "–";
  return `${Math.round((part / whole) * 100)}%`;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  const tenantParam = searchParams.get("tenantId");
  const rawRange = searchParams.get("range") || "all";
  const range = rawRange === "30d" ? "30d" : "all";
  const rangeLabel = range === "30d" ? "Last 30 days" : "All time";

  const rawClientKeyParam = searchParams.get("clientKey") || "all";
  const requestedClientKey = rawClientKeyParam || "all";

  // ---------------------------------------------------------------------------
  // Resolve tenant
  // ---------------------------------------------------------------------------
  let tenant = null as any;

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

  // ---------------------------------------------------------------------------
  // Time window
  // ---------------------------------------------------------------------------
  const now = new Date();
  const cutoff =
    range === "30d"
      ? new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      : null;

  const createdAtFilter = cutoff != null ? { createdAt: { gte: cutoff } } : {};

  // ---------------------------------------------------------------------------
  // Jobs for this tenant
  // ---------------------------------------------------------------------------
  const jobs = await prisma.job.findMany({
    where: { tenantId: tenant.id },
    select: {
      id: true,
      title: true,
      status: true,
      createdAt: true,
      clientCompanyId: true,
      clientCompany: {
        select: { name: true },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  const allJobIds = jobs.map((j) => j.id);
  const hasJobs = allJobIds.length > 0;

  // ---------------------------------------------------------------------------
  // Aggregations (same spirit as analytics page)
  // ---------------------------------------------------------------------------
  const totalCandidatesPromise = prisma.candidate.count({
    where: {
      tenantId: tenant.id,
      ...createdAtFilter,
    },
  });

  const totalApplicationsPromise = hasJobs
    ? prisma.jobApplication.count({
        where: {
          jobId: { in: allJobIds },
          ...createdAtFilter,
        },
      })
    : Promise.resolve(0);

  const stageBucketsPromise: Promise<StageBucket[]> = hasJobs
    ? (prisma.jobApplication.groupBy({
        by: ["stage"],
        _count: { _all: true },
        where: {
          jobId: { in: allJobIds },
          ...createdAtFilter,
        },
      }) as any)
    : Promise.resolve([]);

  const sourceBucketsPromise: Promise<SourceBucket[]> = hasJobs
    ? (prisma.jobApplication.groupBy({
        by: ["source"],
        _count: { _all: true },
        where: {
          jobId: { in: allJobIds },
          ...createdAtFilter,
        },
      }) as any)
    : Promise.resolve([]);

  const tierBucketsPromise: Promise<TierBucket[]> = hasJobs
    ? (prisma.scoringEvent.groupBy({
        by: ["tier"],
        _count: { _all: true },
        where: {
          tenantId: tenant.id,
          jobId: { in: allJobIds },
          ...(cutoff != null ? { createdAt: { gte: cutoff } } : {}),
        },
      }) as any)
    : Promise.resolve([]);

  const applicationsByJobPromise: Promise<AppsByJobBucket[]> = hasJobs
    ? (prisma.jobApplication.groupBy({
        by: ["jobId"],
        _count: { _all: true },
        where: {
          jobId: { in: allJobIds },
          ...createdAtFilter,
        },
      }) as any)
    : Promise.resolve([]);

  const [
    totalCandidates,
    totalApplications,
    stageBuckets,
    sourceBuckets,
    tierBuckets,
    applicationsByJob,
  ] = await Promise.all([
    totalCandidatesPromise,
    totalApplicationsPromise,
    stageBucketsPromise,
    sourceBucketsPromise,
    tierBucketsPromise,
    applicationsByJobPromise,
  ]);

  const applicationsByJobMap = new Map<string, number>();
  for (const bucket of applicationsByJob) {
    applicationsByJobMap.set(bucket.jobId, bucket._count._all);
  }

  // ---------------------------------------------------------------------------
  // Client summaries & filter
  // ---------------------------------------------------------------------------
  const clientSummaryMap = new Map<string, ClientSummary>();

  for (const job of jobs) {
    const key = job.clientCompanyId ?? "__internal__";
    const label = job.clientCompany?.name || "Internal";
    const applicationsCount = applicationsByJobMap.get(job.id) ?? 0;

    const existing = clientSummaryMap.get(key);
    if (!existing) {
      clientSummaryMap.set(key, {
        key,
        label,
        jobCount: 1,
        applicationCount: applicationsCount,
      });
    } else {
      existing.jobCount += 1;
      existing.applicationCount += applicationsCount;
    }
  }

  const hasClientKey =
    requestedClientKey !== "all" && clientSummaryMap.has(requestedClientKey);
  const effectiveClientKey: string | "all" = hasClientKey
    ? requestedClientKey
    : "all";

  const selectedClientLabel =
    effectiveClientKey === "all"
      ? "All clients"
      : clientSummaryMap.get(effectiveClientKey)?.label || "Selected client";

  // ---------------------------------------------------------------------------
  // Derived metrics
  // ---------------------------------------------------------------------------
  const openJobs = jobs.filter(
    (j) => (j.status || "").toLowerCase() === "open",
  );
  const closedJobs = jobs.filter(
    (j) => (j.status || "").toLowerCase() !== "open",
  );

  const sortedStageBuckets = stageBuckets
    .slice()
    .sort((a, b) => (a.stage || "").localeCompare(b.stage || ""));

  const sortedSourceBuckets = sourceBuckets
    .slice()
    .sort((a, b) => (a.source || "").localeCompare(b.source || ""));

  const sortedTierBuckets = tierBuckets
    .slice()
    .sort((a, b) => (a.tier || "").localeCompare(b.tier || ""));

  const totalTierEvents = tierBuckets.reduce(
    (sum, b) => sum + b._count._all,
    0,
  );

  const jobsForVolume =
    effectiveClientKey === "all"
      ? jobs
      : jobs.filter(
          (j) =>
            (j.clientCompanyId ?? "__internal__") === effectiveClientKey,
        );

  const jobsByVolume = jobsForVolume
    .map((j) => ({
      ...j,
      applicationCount: applicationsByJobMap.get(j.id) ?? 0,
    }))
    .sort((a, b) => b.applicationCount - a.applicationCount)
    .slice(0, 8); // little richer than screen, but still compact

  const maxVolume =
    jobsByVolume.length > 0
      ? Math.max(...jobsByVolume.map((j) => j.applicationCount))
      : 0;

  // ---------------------------------------------------------------------------
  // Build PDF
  // ---------------------------------------------------------------------------
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const pageMargin = 48;
  let page = pdfDoc.addPage();
  let { width, height } = page.getSize();
  let cursorY = height - pageMargin;

  function newLine(multiplier = 1) {
    cursorY -= 14 * multiplier;
    if (cursorY < pageMargin) {
      page = pdfDoc.addPage();
      ({ width, height } = page.getSize());
      cursorY = height - pageMargin;
    }
  }

  function drawText(
    text: string,
    opts?: { size?: number; bold?: boolean; colorGray?: number },
  ) {
    const size = opts?.size ?? 10;
    const useBold = opts?.bold ?? false;
    const gray = opts?.colorGray ?? 0.1;

    page.drawText(text, {
      x: pageMargin,
      y: cursorY,
      size,
      font: useBold ? fontBold : font,
      color: rgb(gray, gray, gray),
    });
    newLine();
  }

  function drawSectionTitle(label: string) {
    newLine(0.5);
    drawText(label, { size: 11, bold: true });
  }

  function drawSubtle(text: string) {
    drawText(text, { size: 9, colorGray: 0.45 });
  }

  // Header
  drawText("ThinkATS Analytics Summary", { size: 16, bold: true });
  drawText(tenant.name || "Tenant workspace", {
    size: 11,
    colorGray: 0.25,
  });
  drawSubtle(`Range: ${rangeLabel}`);
  drawSubtle(`Client filter: ${selectedClientLabel}`);
  drawSubtle(`Generated at: ${now.toISOString()}`);
  newLine(1.5);

  // Overview
  drawSectionTitle("Overview");
  drawText(
    `Jobs: ${jobs.length} total · ${openJobs.length} open · ${closedJobs.length} closed (${pct(
      closedJobs.length,
      jobs.length || 1,
    )})`,
  );
  drawText(`Candidates: ${totalCandidates}`);
  drawText(`Applications: ${totalApplications}`);
  drawText(`Scored events: ${totalTierEvents}`);
  newLine(0.5);

  if (clientSummaryMap.size > 0) {
    const totalClients = clientSummaryMap.size;
    const totalClientJobs = Array.from(clientSummaryMap.values()).reduce(
      (sum, c) => sum + c.jobCount,
      0,
    );
    drawSubtle(
      `Clients with activity in window: ${totalClients} (${totalClientJobs} jobs across all clients)`,
    );
  } else {
    drawSubtle("No client-level breakdown available in this window.");
  }

  newLine(1);

  // Pipeline by stage
  drawSectionTitle("Pipeline by stage");
  if (sortedStageBuckets.length === 0) {
    drawSubtle(
      "No applications in this time window yet. Once candidates move through your pipeline, stage distribution will appear here.",
    );
  } else {
    for (const bucket of sortedStageBuckets) {
      const label = (bucket.stage || "UNASSIGNED").toUpperCase();
      const count = bucket._count._all;
      drawText(
        `${label}: ${count} applications (${pct(count, totalApplications || 1)})`,
      );
    }
  }

  newLine(1);

  // Scoring tiers
  drawSectionTitle("Scoring tiers (A/B/C)");
  if (sortedTierBuckets.length === 0) {
    drawSubtle(
      "No scoring events in this window. Once your scoring engine is live, tier distribution will show here.",
    );
  } else {
    for (const bucket of sortedTierBuckets) {
      const label = (bucket.tier || "UNRATED").toUpperCase();
      const count = bucket._count._all;
      drawText(
        `${label}: ${count} events (${pct(count, totalTierEvents || 1)})`,
      );
    }
  }

  newLine(1);

  // Source breakdown
  drawSectionTitle("Source breakdown");
  if (sortedSourceBuckets.length === 0) {
    drawSubtle(
      "No source information recorded for applications in this window. Once you tag sources (e.g. LinkedIn, Referral), they will appear here.",
    );
  } else {
    for (const bucket of sortedSourceBuckets) {
      const label = bucket.source || "Unknown";
      const count = bucket._count._all;
      drawText(
        `${label}: ${count} applications (${pct(count, totalApplications || 1)})`,
      );
    }
  }

  newLine(1);

  // Top roles by volume
  drawSectionTitle("Top roles by application volume");
  if (jobsByVolume.length === 0) {
    drawSubtle(
      "No applications in this window yet. Once roles start receiving candidates, their relative volume will show here.",
    );
  } else {
    let idx = 1;
    for (const job of jobsByVolume) {
      const statusLabel = (job.status || "OPEN").toUpperCase();
      const isOpen = (job.status || "").toLowerCase() === "open";
      const clientName = job.clientCompany?.name || "Internal";
      const relPct = maxVolume
        ? `${Math.round((job.applicationCount / maxVolume) * 100)}% of top role`
        : "–";

      drawText(
        `${idx}. ${job.title} (${clientName}) — ${job.applicationCount} applications`,
      );
      drawSubtle(
        `   Status: ${statusLabel}${
          isOpen ? " · accepting candidates" : ""
        } · Relative volume: ${relPct}`,
      );
      idx += 1;
    }
  }

  // Footer note
  newLine(1.5);
  drawSubtle(
    "This report reflects the current state of your ThinkATS tenant at generation time.",
  );

  const pdfBytes = await pdfDoc.save();

  const safeTenantSlug =
    (tenant.slug as string | null) ??
    (tenant.id as string | null) ??
    "tenant";
  const filename = `thinkats-analytics-summary-${safeTenantSlug}-${range}.pdf`;

  return new Response(pdfBytes, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
