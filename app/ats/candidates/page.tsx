// app/ats/candidates/page.tsx
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getResourcinTenant } from "@/lib/tenant";
import CandidatesTable, { type CandidateRowProps } from "./CandidatesTable";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "ThinkATS | Candidates",
  description:
    "Workspace-wide view of candidates, pipelines and sourcing performance.",
};

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type CandidatesPageSearchParams = {
  q?: string | string[];
  source?: string | string[];
  stage?: string | string[];
  tier?: string | string[];
  view?: string | string[];
  page?: string | string[];
};

type PageProps = {
  searchParams?: CandidatesPageSearchParams;
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function firstString(value?: string | string[]): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}

function derivePrimaryTier(apps: any[]): string | null {
  const tiers = new Set<string>();
  for (const app of apps) {
    const latest = app.scoringEvents?.[0];
    const tier = (latest?.tier as string | null) ?? null;
    if (tier) tiers.add(tier.toUpperCase());
  }
  if (!tiers.size) return null;

  const order = ["A", "B", "C", "D"];
  for (const t of order) {
    if (tiers.has(t)) return t;
  }
  return Array.from(tiers)[0];
}

function deriveLastSeen(apps: any[], fallback: Date): Date {
  if (!apps.length) return fallback;
  return apps[0].createdAt ?? fallback;
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function CandidatesPage({ searchParams = {} }: PageProps) {
  const tenant = await getResourcinTenant();
  if (!tenant) notFound();

  // -------------------------------------------------------------------------
  // URL filters
  // -------------------------------------------------------------------------

  let filterQ = (firstString(searchParams.q) || "").trim();
  let filterSource = (firstString(searchParams.source) || "").trim();
  let filterStage = (firstString(searchParams.stage) || "")
    .trim()
    .toUpperCase();
  let filterTier = (firstString(searchParams.tier) || "")
    .trim()
    .toUpperCase();

  const activeViewId = firstString(searchParams.view);

  // -------------------------------------------------------------------------
  // Saved views
  // -------------------------------------------------------------------------

  const savedViews = await prisma.savedView.findMany({
    where: {
      tenantId: tenant.id,
      scope: "candidates",
    },
    orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
  });

  const activeView =
    savedViews.find((v) => v.id === activeViewId) ||
    savedViews.find((v) => v.isDefault) ||
    null;

  if (activeView?.filters) {
    const f = activeView.filters as any;
    if (!filterQ && typeof f.q === "string") filterQ = f.q.trim();
    if (!filterSource && typeof f.source === "string")
      filterSource = f.source.trim();
    if (!filterStage && typeof f.stage === "string")
      filterStage = f.stage.trim().toUpperCase();
    if (!filterTier && typeof f.tier === "string")
      filterTier = f.tier.trim().toUpperCase();
  }

  // -------------------------------------------------------------------------
  // Stats + distinct options (SAFE QUERIES)
  // -------------------------------------------------------------------------

  const now = new Date();
  const cutoff30d = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const [
  totalCandidates,
  candidates,
  rawSourcesDistinct,
  appSourcesDistinct,
  rawStageDistinct,
  appsForTier, // ❌ this is “index 6” in TS’ eyes because your Promise.all has only 6 items
] = await Promise.all([
  prisma.candidate.count(...),
  prisma.candidate.findMany(...),
  prisma.candidate.findMany(...),
  prisma.jobApplication.findMany(...),
  prisma.jobApplication.findMany(...),
  // ❌ missing the query that should produce appsForTier
]);
  },
  select: {
    candidateId: true,
    scoringEvents: {
      select: { tier: true },
      orderBy: { createdAt: "desc" },
      take: 1,
    },
  },
}),
    
    prisma.candidate.findMany({
      where: { tenantId: tenant.id },
      select: { source: true },
      distinct: ["source"],
    }),

    prisma.jobApplication.findMany({
      where: { job: { tenantId: tenant.id } },
      select: { source: true },
      distinct: ["source"],
    }),

    // ✅ SAFE: no null / notIn nonsense
    prisma.jobApplication.findMany({
      where: { job: { tenantId: tenant.id } },
      select: { stage: true },
      distinct: ["stage"],
    }),

    prisma.jobApplication.findMany({
      where: {
        job: { tenantId: tenant.id },
        candidateId: { not: null },
      },
      select: {
        candidateId: true,
        scoringEvents: {
          select: { tier: true },
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
    }),
  ]);

  // -------------------------------------------------------------------------
  // Normalize sources + stages (JS-level sanitisation)
  // -------------------------------------------------------------------------

  const sourceSet = new Set<string>();
  for (const r of candidateSourcesDistinct) {
    const v = (r.source || "").trim();
    if (v) sourceSet.add(v);
  }
  for (const r of appSourcesDistinct as any[]) {
    const v = (r.source || "").trim();
    if (v) sourceSet.add(v);
  }
  const sourceOptions = Array.from(sourceSet).sort((a, b) =>
    a.localeCompare(b, undefined, { sensitivity: "base" }),
  );

  const stageSet = new Set<string>();
  for (const r of rawStageDistinct as any[]) {
    const v = String(r.stage || "").trim();
    if (v) stageSet.add(v.toUpperCase());
  }
  const stageOptions = Array.from(stageSet).sort();

  // -------------------------------------------------------------------------
  // Tier aggregation
  // -------------------------------------------------------------------------

  const tierAgg = new Map<string, { A: boolean; B: boolean; C: boolean }>();

  for (const app of appsForTier as any[]) {
    const cid = app.candidateId;
    if (!cid) continue;

    const tier = app.scoringEvents?.[0]?.tier?.toUpperCase();
    if (!tier) continue;

    const entry = tierAgg.get(cid) || { A: false, B: false, C: false };
    if (tier === "A") entry.A = true;
    else if (tier === "B") entry.B = true;
    else if (tier === "C") entry.C = true;
    tierAgg.set(cid, entry);
  }

  const tierCounts = { A: 0, B: 0, C: 0 };
  for (const v of tierAgg.values()) {
    if (v.A) tierCounts.A++;
    else if (v.B) tierCounts.B++;
    else if (v.C) tierCounts.C++;
  }

  // -------------------------------------------------------------------------
  // Build candidate WHERE
  // -------------------------------------------------------------------------

  const candidateWhere: any = { tenantId: tenant.id };

  if (filterQ) {
    candidateWhere.OR = [
      { fullName: { contains: filterQ, mode: "insensitive" } },
      { email: { contains: filterQ, mode: "insensitive" } },
      { location: { contains: filterQ, mode: "insensitive" } },
      { currentCompany: { contains: filterQ, mode: "insensitive" } },
    ];
  }

  if (filterSource) {
    candidateWhere.applications = {
      some: { source: { equals: filterSource, mode: "insensitive" } },
    };
  }

  if (filterStage) {
    candidateWhere.applications = {
      some: { stage: { equals: filterStage, mode: "insensitive" } },
    };
  }

  if (filterTier) {
    const ids = [...tierAgg.entries()]
      .filter(([_, v]) => v[filterTier as "A" | "B" | "C"])
      .map(([id]) => id);

    if (!ids.length) {
      return (
        <div className="p-10 text-center text-slate-500">
          No candidates match this tier.
        </div>
      );
    }

    candidateWhere.id = { in: ids };
  }

  // -------------------------------------------------------------------------
  // Pagination
  // -------------------------------------------------------------------------

  const page = Math.max(
    1,
    parseInt(firstString(searchParams.page) || "1", 10),
  );
  const pageSize = 20;
  const offset = (page - 1) * pageSize;

  const totalFiltered = await prisma.candidate.count({
    where: candidateWhere,
  });

  const candidates = await prisma.candidate.findMany({
    where: candidateWhere,
    orderBy: { createdAt: "desc" },
    skip: offset,
    take: pageSize,
    include: {
      tags: { include: { tag: true } },
      applications: {
        orderBy: { createdAt: "desc" },
        include: {
          job: { include: { clientCompany: true } },
          scoringEvents: { orderBy: { createdAt: "desc" }, take: 1 },
        },
      },
    },
  });

  // -------------------------------------------------------------------------
  // Map rows
  // -------------------------------------------------------------------------

  const rows: CandidateRowProps[] = candidates.map((c, i) => {
    const apps = c.applications as any[];
    return {
      id: c.id,
      index: offset + i + 1,
      fullName: c.fullName,
      email: c.email,
      location: c.location,
      currentCompany: c.currentCompany,
      createdAt: c.createdAt.toISOString(),
      tags: c.tags.map((t) => ({ id: t.tag.id, name: t.tag.name })),
      pipelines: apps.map((a) => ({
        id: a.id,
        title: a.job?.title ?? "—",
        stage: a.stage,
      })),
      primaryTier: derivePrimaryTier(apps),
      latestScore: apps[0]?.scoringEvents?.[0]?.score ?? null,
      latestJobTitle: apps[0]?.job?.title ?? "—",
      latestClient: apps[0]?.job?.clientCompany?.name ?? null,
      source: apps[0]?.source ?? c.source ?? "",
      lastSeen: deriveLastSeen(apps, c.createdAt).toISOString(),
    };
  });

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  return <CandidatesTable rows={rows} />;
}
