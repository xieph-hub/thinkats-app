// app/ats/candidates/page.tsx
import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getScoringConfigForJob } from "@/lib/scoring/server";
import { computeApplicationScore } from "@/lib/scoring/compute";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "ThinkATS | Candidates",
  description:
    "Cross-job view of candidates, scoring tiers, risks and interview focus across your ATS.",
};

type Tier = "A" | "B" | "C" | "D";

type CandidatesSearchParams = {
  page?: string | string[];
  tier?: string | string[];
  stage?: string | string[];
  clientId?: string | string[];
  jobId?: string | string[];
  q?: string | string[];
};

export default async function AtsCandidatesPage({
  searchParams,
}: {
  searchParams: CandidatesSearchParams;
}) {
  const pageParamRaw = Array.isArray(searchParams.page)
    ? searchParams.page[0]
    : searchParams.page;
  let page = parseInt(pageParamRaw || "1", 10);
  if (Number.isNaN(page) || page < 1) page = 1;

  const pageSize = 50;
  const maxFetch = 300;

  const applications = await prisma.jobApplication.findMany({
    include: {
      candidate: true,
      job: {
        include: {
          clientCompany: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: maxFetch,
  });

  // Cache scoring config per job to avoid N+1 calls
  const jobIds = Array.from(new Set(applications.map((app) => app.jobId)));
  const configByJobId = new Map<string, any>();

  for (const jobId of jobIds) {
    const { config } = await getScoringConfigForJob(jobId);
    configByJobId.set(jobId, config);
  }

  const scoredRows = applications.map((app) => {
    const config = configByJobId.get(app.jobId);

    const scored = computeApplicationScore({
      application: app,
      candidate: app.candidate,
      job: app.job,
      config,
    });

    const cvUrl = app.cvUrl || app.candidate?.cvUrl || null;

    return {
      application: app,
      candidate: app.candidate,
      job: app.job,
      scored,
      cvUrl,
    };
  });

  // Distinct clients and jobs for filter dropdowns
  const uniqueClients = Array.from(
    new Map(
      scoredRows
        .filter((row) => row.job.clientCompany)
        .map((row) => [row.job.clientCompany!.id, row.job.clientCompany!]),
    ).values(),
  );

  const uniqueJobs = Array.from(
    new Map(scoredRows.map((row) => [row.job.id, row.job])).values(),
  );

  // FILTERS
  const tierFilterRaw = Array.isArray(searchParams.tier)
    ? searchParams.tier[0]
    : searchParams.tier;
  const stageFilterRaw = Array.isArray(searchParams.stage)
    ? searchParams.stage[0]
    : searchParams.stage;
  const clientIdFilterRaw = Array.isArray(searchParams.clientId)
    ? searchParams.clientId[0]
    : searchParams.clientId;
  const jobIdFilterRaw = Array.isArray(searchParams.jobId)
    ? searchParams.jobId[0]
    : searchParams.jobId;
  const qRaw = Array.isArray(searchParams.q)
    ? searchParams.q[0]
    : searchParams.q;

  const tierFilter = (tierFilterRaw || "all").toUpperCase();
  const stageFilter = (stageFilterRaw || "all").toUpperCase();
  const clientIdFilter = clientIdFilterRaw || "all";
  const jobIdFilter = jobIdFilterRaw || "all";
  const q = (qRaw || "").trim().toLowerCase();

  const filteredRows = scoredRows.filter(
    ({ application, candidate, job, scored }) => {
      if (stageFilter !== "ALL") {
        const stage = (application.stage || "APPLIED").toUpperCase();
        if (stage !== stageFilter) return false;
      }

      if (tierFilter !== "ALL") {
        const tier = (scored.tier || "D").toUpperCase();
        if (tier !== tierFilter) return false;
      }

      if (jobIdFilter !== "all" && job.id !== jobIdFilter) {
        return false;
      }

      if (clientIdFilter !== "all") {
        const cid = job.clientCompanyId || "";
        if (cid !== clientIdFilter) return false;
      }

      if (q) {
        const haystack = [
          application.fullName,
          application.email,
          candidate?.currentTitle ?? "",
          candidate?.currentCompany ?? "",
          job.title,
          job.clientCompany?.name ?? "",
        ]
          .join(" ")
          .toLowerCase();

        if (!haystack.includes(q)) return false;
      }

      return true;
    },
  );

  const total = filteredRows.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  if (page > totalPages) page = totalPages;

  const startIdx = (page - 1) * pageSize;
  const endIdx = startIdx + pageSize;
  const paginatedRows = filteredRows.slice(startIdx, endIdx);

  const filtersApplied =
    !!tierFilterRaw ||
    !!stageFilterRaw ||
    !!clientIdFilterRaw ||
    !!jobIdFilterRaw ||
    !!qRaw;

  const buildPageHref = (pageNumber: number) => {
    const params = new URLSearchParams();
    if (pageNumber > 1) params.set("page", String(pageNumber));
    if (tierFilterRaw) params.set("tier", tierFilterRaw);
    if (stageFilterRaw) params.set("stage", stageFilterRaw);
    if (clientIdFilterRaw) params.set("clientId", clientIdFilterRaw);
    if (jobIdFilterRaw) params.set("jobId", jobIdFilterRaw);
    if (qRaw) params.set("q", qRaw);

    const qs = params.toString();
    return qs ? `/ats/candidates?${qs}` : "/ats/candidates";
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-6 lg:px-8">
      <header className="space-y-2">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
          ATS · Candidates
        </p>
        <h1 className="text-xl font-semibold text-[#172965]">
          Candidate universe
        </h1>
        <p className="text-xs text-slate-600">
          A cross-job view of candidates, their tiers, match scores and
          interview focus areas across your mandates.
        </p>
      </header>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {/* Header + filters */}
        <div className="border-b border-slate-100 px-4 py-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">
                Latest applications
              </h2>
              <p className="text-[11px] text-slate-500">
                {total === 0
                  ? "No candidates yet."
                  : `Showing ${startIdx + 1}–${Math.min(
                      endIdx,
                      total,
                    )} of ${total} candidates.`}
              </p>
            </div>

            <form
              method="GET"
              className="flex flex-wrap items-center gap-2 text-[11px] text-slate-600"
            >
              <select
                name="tier"
                defaultValue={tierFilterRaw || ""}
                className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-[11px] focus:outline-none focus:ring-1 focus:ring-[#2563EB]/40"
              >
                <option value="">All tiers</option>
                <option value="A">Tier A</option>
                <option value="B">Tier B</option>
                <option value="C">Tier C</option>
                <option value="D">Tier D</option>
              </select>

              <select
                name="stage"
                defaultValue={stageFilterRaw || ""}
                className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-[11px] focus:outline-none focus:ring-1 focus:ring-[#2563EB]/40"
              >
                <option value="">All stages</option>
                <option value="APPLIED">Applied</option>
                <option value="SCREEN">Screen</option>
                <option value="INTERVIEW">Interview</option>
                <option value="OFFER">Offer</option>
                <option value="HIRED">Hired</option>
                <option value="REJECTED">Rejected</option>
              </select>

              <select
                name="clientId"
                defaultValue={clientIdFilterRaw || ""}
                className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-[11px] focus:outline-none focus:ring-1 focus:ring-[#2563EB]/40"
              >
                <option value="">All clients</option>
                {uniqueClients.map((client: any) => (
                  <option key={client.id} value={client.id}>
                    {client.name}
                  </option>
                ))}
              </select>

              <select
                name="jobId"
                defaultValue={jobIdFilterRaw || ""}
                className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-[11px] focus:outline-none focus:ring-1 focus:ring-[#2563EB]/40"
              >
                <option value="">All roles</option>
                {uniqueJobs.map((job: any) => (
                  <option key={job.id} value={job.id}>
                    {job.title}
                  </option>
                ))}
              </select>

              <div className="flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5">
                <input
                  name="q"
                  type="search"
                  defaultValue={qRaw || ""}
                  placeholder="Search by name, role, company"
                  className="w-48 bg-transparent text-[11px] text-slate-700 outline-none placeholder:text-slate-400"
                />
              </div>

              {filtersApplied && (
                <Link
                  href="/ats/candidates"
                  className="text-[11px] text-slate-500 underline underline-offset-4"
                >
                  Reset
                </Link>
              )}
            </form>
          </div>
        </div>

        {paginatedRows.length === 0 ? (
          <div className="px-4 py-10 text-center text-xs text-slate-500">
            No candidates match your current filters.
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full border-t border-slate-100 text-xs">
                <thead className="bg-slate-50/80 text-[11px] uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-4 py-2 text-left">Candidate</th>
                    <th className="px-4 py-2 text-left">Role</th>
                    <th className="px-4 py-2 text-left">Client</th>
                    <th className="px-4 py-2 text-left">Tier</th>
                    <th className="px-4 py-2 text-left">Score</th>
                    <th className="px-4 py-2 text-left">CV</th>
                    <th className="px-4 py-2 text-left">Risks / red flags</th>
                    <th className="px-4 py-2 text-left">Interview focus</th>
                    <th className="px-4 py-2 text-left">Applied</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedRows.map(
                    ({ application, candidate, job, scored, cvUrl }: any) => (
                      <tr key={application.id} className="align-top">
                        {/* Candidate */}
                        <td className="px-4 py-3">
                          <div className="space-y-0.5">
                            {candidate?.id ? (
                              <Link
                                href={`/ats/candidates/${candidate.id}`}
                                className="text-xs font-medium text-[#172965] hover:underline"
                              >
                                {application.fullName}
                              </Link>
                            ) : (
                              <span className="text-xs font-medium text-slate-900">
                                {application.fullName}
                              </span>
                            )}
                            <p className="text-[11px] text-slate-500">
                              {candidate?.currentTitle || "—"}
                              {candidate?.currentCompany
                                ? ` · ${candidate.currentCompany}`
                                : ""}
                            </p>
                            <p className="text-[11px] text-slate-500">
                              {application.email}
                            </p>
                          </div>
                        </td>

                        {/* Role */}
                        <td className="px-4 py-3">
                          <p className="text-xs font-medium text-slate-900">
                            {job.title}
                          </p>
                          <p className="text-[11px] text-slate-500">
                            {job.location || job.workMode || "—"}
                          </p>
                        </td>

                        {/* Client */}
                        <td className="px-4 py-3">
                          <p className="text-xs text-slate-800">
                            {job.clientCompany?.name || "—"}
                          </p>
                        </td>

                        {/* Tier */}
                        <td className="px-4 py-3">
                          <TierBadge tier={scored.tier} />
                        </td>

                        {/* Score */}
                        <td className="px-4 py-3">
                          <div className="flex items-baseline gap-1">
                            <span className="text-sm font-semibold text-slate-900">
                              {scored.score}
                            </span>
                            <span className="text-[10px] text-slate-500">
                              / 100
                            </span>
                          </div>
                        </td>

                        {/* CV */}
                        <td className="px-4 py-3">
                          {cvUrl ? (
                            <a
                              href={cvUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-medium text-slate-700 hover:bg-slate-100"
                            >
                              View CV
                            </a>
                          ) : (
                            <span className="text-[11px] text-slate-400">
                              No CV on file
                            </span>
                          )}
                        </td>

                        {/* Risks / red flags */}
                        <td className="px-4 py-3">
                          <RiskBadges
                            risks={scored.risks}
                            redFlags={scored.redFlags}
                          />
                        </td>

                        {/* Interview focus */}
                        <td className="px-4 py-3">
                          {scored.interviewFocus.length === 0 ? (
                            <span className="text-[11px] text-slate-400">
                              —
                            </span>
                          ) : (
                            <ul className="space-y-1 text-[11px] text-slate-600">
                              {scored.interviewFocus
                                .slice(0, 2)
                                .map((item: string, idx: number) => (
                                  <li
                                    key={idx}
                                    className="line-clamp-2"
                                    title={item}
                                  >
                                    • {item}
                                  </li>
                                ))}
                              {scored.interviewFocus.length > 2 && (
                                <li className="text-[10px] text-slate-400">
                                  +
                                  {scored.interviewFocus.length - 2} more focus
                                  points
                                </li>
                              )}
                            </ul>
                          )}
                        </td>

                        {/* Applied */}
                        <td className="whitespace-nowrap px-4 py-3 text-[11px] text-slate-500">
                          {application.createdAt.toLocaleDateString("en-GB", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })}
                        </td>
                      </tr>
                    ),
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination footer */}
            {total > pageSize && (
              <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3 text-[11px] text-slate-500">
                <p>
                  Page {page} of {totalPages} · Showing{" "}
                  {startIdx + 1}-{Math.min(endIdx, total)} of {total} candidates
                </p>
                <div className="flex gap-2">
                  {page > 1 && (
                    <Link
                      href={buildPageHref(page - 1)}
                      className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1 font-medium text-slate-700 hover:bg-slate-100"
                    >
                      Previous
                    </Link>
                  )}
                  {page < totalPages && (
                    <Link
                      href={buildPageHref(page + 1)}
                      className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1 font-medium text-slate-700 hover:bg-slate-100"
                    >
                      Next
                    </Link>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
}

function TierBadge({ tier }: { tier: Tier | string }) {
  const map: Record<Tier, { label: string; classes: string }> = {
    A: {
      label: "Tier A · Priority",
      classes: "border-emerald-200 bg-emerald-50 text-emerald-800",
    },
    B: {
      label: "Tier B · Strong",
      classes: "border-sky-200 bg-sky-50 text-sky-800",
    },
    C: {
      label: "Tier C · Consider",
      classes: "border-amber-200 bg-amber-50 text-amber-800",
    },
    D: {
      label: "Tier D · Below threshold",
      classes: "border-rose-200 bg-rose-50 text-rose-800",
    },
  };

  const safeTier: Tier =
    tier === "A" || tier === "B" || tier === "C" || tier === "D" ? tier : "D";

  const { label, classes } = map[safeTier];

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-medium ${classes}`}
    >
      {label}
    </span>
  );
}

function RiskBadges({
  risks,
  redFlags,
}: {
  risks: string[];
  redFlags: string[];
}) {
  if (!risks.length && !redFlags.length) {
    return <span className="text-[11px] text-slate-400">No obvious risks</span>;
  }

  return (
    <div className="flex flex-wrap gap-1.5">
      {redFlags.map((flag, idx) => (
        <span
          key={`rf-${idx}`}
          className="inline-flex items-center rounded-full border border-rose-200 bg-rose-50 px-2 py-0.5 text-[10px] font-medium text-rose-700"
          title={flag}
        >
          ● Red flag
        </span>
      ))}
      {risks.map((risk, idx) => (
        <span
          key={`rk-${idx}`}
          className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-amber-800"
          title={risk}
        >
          ● Risk
        </span>
      ))}
    </div>
  );
}
