// app/ats/candidates/page.tsx
import type { Metadata } from "next";
import { tenantDb } from "@/lib/db/tenantDb";
import { requireAtsTenant } from "@/lib/tenant/requireAtsTenant";
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

  return Array.from(tiers)[0] ?? null;
}

function deriveLastSeen(apps: any[], fallback: Date): Date {
  if (!apps.length) return fallback;
  return apps[0]?.createdAt ?? fallback;
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function CandidatesPage({ searchParams = {} }: PageProps) {
  // 🔐 Resolve tenant + user (SUPER_ADMIN override handled here)
  const { tenant } = await requireAtsTenant();
  // 🔐 Create tenant-scoped Prisma client
  const db = tenantDb(tenant.id);

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
  // Saved views (tenant-scoped via tenantDb)
// -------------------------------------------------------------------------

  const savedViews = await db.savedView.findMany({
    where: {
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
  // Stats + distinct options + tier map (SAFE + tenantDb-scoped)
// -------------------------------------------------------------------------

  const [
    totalCandidates,
    candidateSourcesDistinct,
    appSourcesDistinct,
    rawStageDistinct,
    appsForTier,
  ] = await Promise.all([
    db.candidate.count({}), // tenantId injected
    db.candidate.findMany({
      select: { source: true },
      distinct: ["source"],
    }),
    db.jobApplication.findMany({
      select: { source: true },
      distinct: ["source"],
    }),
    db.jobApplication.findMany({
      select: { stage: true },
      distinct: ["stage"],
    }),
    db.jobApplication.findMany({
      where: {
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

  for (const r of candidateSourcesDistinct as any[]) {
    const v = (r?.source || "").toString().trim();
    if (v) sourceSet.add(v);
  }

  for (const r of appSourcesDistinct as any[]) {
    const v = (r?.source || "").toString().trim();
    if (v) sourceSet.add(v);
  }

  const sourceOptions = Array.from(sourceSet).sort((a, b) =>
    a.localeCompare(b, undefined, { sensitivity: "base" }),
  );

  const stageSet = new Set<string>();
  for (const r of rawStageDistinct as any[]) {
    const v = String(r?.stage || "").trim();
    if (v) stageSet.add(v.toUpperCase());
  }
  const stageOptions = Array.from(stageSet).sort();

  // -------------------------------------------------------------------------
  // Tier aggregation (per candidateId)
// -------------------------------------------------------------------------

  const tierAgg = new Map<string, { A: boolean; B: boolean; C: boolean }>();

  for (const app of appsForTier as any[]) {
    const cid = app?.candidateId as string | null | undefined;
    if (!cid) continue;

    const tier = app?.scoringEvents?.[0]?.tier?.toUpperCase?.();
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
  // Build candidate WHERE (tenant is injected by tenantDb)
// -------------------------------------------------------------------------

  const candidateWhere: any = {}; // ❗ no tenantId here – tenantDb adds it

  if (filterQ) {
    candidateWhere.OR = [
      { fullName: { contains: filterQ, mode: "insensitive" } },
      { email: { contains: filterQ, mode: "insensitive" } },
      { location: { contains: filterQ, mode: "insensitive" } },
      { currentCompany: { contains: filterQ, mode: "insensitive" } },
    ];
  }

  // Important: if you set candidateWhere.applications multiple times,
  // you overwrite previous filters. So we combine them in one "some".
  const appsSome: any = {};

  if (filterSource) {
    appsSome.source = { equals: filterSource, mode: "insensitive" };
  }

  if (filterStage) {
    appsSome.stage = { equals: filterStage, mode: "insensitive" };
  }

  if (Object.keys(appsSome).length) {
    candidateWhere.applications = { some: appsSome };
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

  const totalFiltered = await db.candidate.count({
    where: candidateWhere,
  });

  const candidateRecords = await db.candidate.findMany({
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

  const rows: CandidateRowProps[] = candidateRecords.map(
    (c: any, i: number) => {
      const apps = (c.applications || []) as any[];

      return {
        id: c.id,
        index: offset + i + 1,

        fullName: c.fullName,
        email: c.email,
        location: c.location,
        currentCompany: c.currentCompany,

        createdAt: new Date(c.createdAt).toISOString(),

        tags: (c.tags || []).map((t: any) => ({
          id: t.tag.id,
          name: t.tag.name,
        })),

        pipelines: apps.map((a: any) => ({
          id: a.id,
          title: a.job?.title ?? "—",
          stage: a.stage,
        })),

        primaryTier: derivePrimaryTier(apps),
        latestScore: apps?.[0]?.scoringEvents?.[0]?.score ?? null,

        latestJobTitle: apps?.[0]?.job?.title ?? "—",
        latestClient: apps?.[0]?.job?.clientCompany?.name ?? null,

        source: apps?.[0]?.source ?? c.source ?? "",
        lastSeen: deriveLastSeen(apps, c.createdAt).toISOString(),
      };
    },
  );

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  // You can later pass stats into CandidatesTable if you extend its props:
  // totalCandidates, totalFiltered, sourceOptions, stageOptions, tierCounts, savedViews, activeView
  return <CandidatesTable rows={rows} />;
}
