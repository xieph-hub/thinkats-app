// app/ats/analytics/summary/page.tsx
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { getResourcinTenant } from "@/lib/tenant";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "ThinkATS | Analytics summary",
  description:
    "Printable summary of jobs, candidates and applications for this ThinkATS tenant.",
};

type PageProps = {
  searchParams?: {
    range?: string;
    clientKey?: string; // for future use – we still show it in the header
  };
};

function formatDateShort(date: Date) {
  return date.toISOString().slice(0, 10);
}

export default async function AnalyticsSummaryPage({ searchParams }: PageProps) {
  const tenant = await getResourcinTenant();

  if (!tenant) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-white px-4">
        <div className="max-w-md rounded-2xl border border-slate-200 bg-white p-6 text-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">
            ThinkATS · Analytics summary
          </p>
          <h1 className="mt-2 text-base font-semibold text-slate-900">
            Tenant not configured
          </h1>
          <p className="mt-2 text-xs text-slate-500">
            No default tenant is configured. Check{" "}
            <code className="rounded bg-slate-100 px-1 py-0.5 text-[11px] text-amber-700">
              RESOURCIN_TENANT_ID
            </code>{" "}
            or{" "}
            <code className="rounded bg-slate-100 px-1 py-0.5 text-[11px] text-amber-700">
              RESOURCIN_TENANT_SLUG
            </code>{" "}
            in your environment variables and redeploy.
          </p>
        </div>
      </main>
    );
  }

  // -------------------------------------------------------------------------
  // Time window – mirror the main Analytics page ("all" vs "30d")
  // -------------------------------------------------------------------------
  const rawRange =
    typeof searchParams?.range === "string" ? searchParams.range : "all";
  const range = rawRange === "30d" ? "30d" : "all";
  const rangeLabel = range === "30d" ? "Last 30 days" : "All time";

  const now = new Date();
  const cutoff =
    range === "30d"
      ? new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      : null;

  const createdAtFilter =
    cutoff != null ? { createdAt: { gte: cutoff } } : {};

  // Note: clientKey is currently just echoed for context. Core metrics remain
  // tenant-wide, same as the main Analytics summary cards.
  const rawClientKey =
    typeof searchParams?.clientKey === "string"
      ? searchParams.clientKey
      : "all";
  const effectiveClientKey = rawClientKey || "all";

  // -------------------------------------------------------------------------
  // Core counts – same “shape” as the summary row on the main Analytics page
  // -------------------------------------------------------------------------
  const jobs = await prisma.job.findMany({
    where: { tenantId: tenant.id },
    select: {
      id: true,
      title: true,
      status: true,
      createdAt: true,
      clientCompanyId: true,
      clientCompany: { select: { name: true } },
    },
  });

  const jobIds = jobs.map((j) => j.id);

  const [totalCandidates, totalApplications] = await Promise.all([
    prisma.candidate.count({
      where: {
        tenantId: tenant.id,
        ...createdAtFilter,
      },
    }),
    jobIds.length === 0
      ? Promise.resolve(0)
      : prisma.jobApplication.count({
          where: {
            jobId: { in: jobIds },
            ...createdAtFilter,
          },
        }),
  ]);

  const openJobs = jobs.filter(
    (j) => (j.status || "").toLowerCase() === "open",
  );
  const closedJobs = jobs.filter(
    (j) => (j.status || "").toLowerCase() !== "open",
  );

  // Simple client context – just for labelling the filter in the PDF header
  const clientSummaryMap = new Map<
    string,
    { key: string; label: string; jobCount: number }
  >();

  for (const job of jobs) {
    const key = job.clientCompanyId ?? "__internal__";
    const label = job.clientCompany?.name || "Internal";

    const existing = clientSummaryMap.get(key);
    if (!existing) {
      clientSummaryMap.set(key, { key, label, jobCount: 1 });
    } else {
      existing.jobCount += 1;
    }
  }

  let clientLabel: string | null = null;
  if (effectiveClientKey !== "all") {
    const match = clientSummaryMap.get(effectiveClientKey);
    clientLabel = match?.label ?? null;
  }

  const generatedAt = now;

  // -------------------------------------------------------------------------
  // UI – print-friendly, white background, “board pack” vibe
  // -------------------------------------------------------------------------
  return (
    <main className="min-h-screen bg-white px-6 py-8 text-slate-900">
      {/* Header block */}
      <header className="mb-6 border-b border-slate-200 pb-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
              ThinkATS · Analytics summary
            </p>
            <h1 className="mt-1 text-xl font-semibold text-slate-900">
              Tenant overview
            </h1>
            <p className="mt-1 text-xs text-slate-600">
              Snapshot of jobs, candidates and applications for{" "}
              <span className="font-semibold">
                {tenant.name || "tenant workspace"}
              </span>
              .
            </p>
          </div>

          <div className="text-right text-[11px] text-slate-600">
            <p>
              Generated:{" "}
              <span className="font-medium">
                {formatDateShort(generatedAt)}
              </span>
            </p>
            <p>
              Window:{" "}
              <span className="font-medium">{rangeLabel}</span>
            </p>
            <p>
              Client filter:{" "}
              <span className="font-medium">
                {effectiveClientKey === "all"
                  ? "All clients"
                  : clientLabel || effectiveClientKey}
              </span>
            </p>
          </div>
        </div>

        {/* On-screen hint only; will still print fine if it shows */}
        <p className="mt-2 text-[10px] text-slate-400">
          Tip: Use your browser&apos;s <span className="font-medium">Print</span>{" "}
          dialog and choose <span className="font-medium">“Save as PDF”</span>{" "}
          to download this summary.
        </p>
      </header>

      {/* Summary row */}
      <section className="mb-6 grid gap-4 md:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
            Open jobs
          </p>
          <p className="mt-1 text-2xl font-semibold text-slate-900">
            {openJobs.length}
          </p>
          <p className="mt-1 text-[11px] text-slate-600">
            out of {jobs.length} total roles
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
            Closed roles
          </p>
          <p className="mt-1 text-2xl font-semibold text-slate-900">
            {closedJobs.length}
          </p>
          <p className="mt-1 text-[11px] text-slate-600">
            roles marked filled, on hold or closed
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
            Candidates in window
          </p>
          <p className="mt-1 text-2xl font-semibold text-slate-900">
            {totalCandidates}
          </p>
          <p className="mt-1 text-[11px] text-slate-600">
            unique profiles created in this reporting window
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
            Applications in window
          </p>
          <p className="mt-1 text-2xl font-semibold text-slate-900">
            {totalApplications}
          </p>
          <p className="mt-1 text-[11px] text-slate-600">
            submitted applications between{" "}
            {range === "30d"
              ? `${formatDateShort(cutoff!)} and ${formatDateShort(now)}`
              : `first recorded date and ${formatDateShort(now)}`}
          </p>
        </div>
      </section>

      {/* Jobs by client (coarse) */}
      <section className="mb-6">
        <h2 className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-600">
          Jobs by client (coarse)
        </h2>
        {clientSummaryMap.size === 0 ? (
          <p className="text-[11px] text-slate-500">
            No client-linked roles have been created yet.
          </p>
        ) : (
          <table className="w-full border-collapse text-[11px]">
            <thead>
              <tr className="border-b border-slate-200 text-left text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                <th className="py-2 pr-3">Client</th>
                <th className="py-2 pr-3">Jobs</th>
              </tr>
            </thead>
            <tbody>
              {Array.from(clientSummaryMap.values())
                .sort((a, b) => b.jobCount - a.jobCount)
                .map((client) => (
                  <tr key={client.key} className="border-b border-slate-100">
                    <td className="py-1.5 pr-3">
                      {client.label}{" "}
                      {client.key === "__internal__" && (
                        <span className="text-[10px] text-slate-400">
                          (Internal)
                        </span>
                      )}
                    </td>
                    <td className="py-1.5 pr-3">{client.jobCount}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        )}
      </section>

      {/* Footer note */}
      <footer className="mt-8 border-t border-slate-200 pt-3 text-[10px] text-slate-500">
        <p>
          Generated by ThinkATS analytics summary. For deeper analysis (sources,
          stages, tiers and per-role breakdowns), refer to the live Analytics
          dashboard or the CSV export.
        </p>
      </footer>
    </main>
  );
}
