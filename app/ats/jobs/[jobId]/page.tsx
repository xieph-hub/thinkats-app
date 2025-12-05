// app/ats/jobs/[jobId]/page.tsx
import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getScoringConfigForJob } from "@/lib/scoring/server";
import { computeApplicationScore } from "@/lib/scoring/compute";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "ThinkATS | Job pipeline",
  description:
    "ATS job detail and candidate pipeline view with scoring tiers and CV access.",
};

type Tier = "A" | "B" | "C" | "D";

type JobDetailSearchParams = {
  stage?: string | string[];
  tier?: string | string[];
  q?: string | string[];
};

// SERVER ACTION: inline stage/status update
export async function updateApplicationStage(formData: FormData) {
  "use server";

  const applicationId = String(formData.get("applicationId") || "");
  const jobId = String(formData.get("jobId") || "");
  const stage = String(formData.get("stage") || "");
  const status = String(formData.get("status") || "");
  const redirectSearch = String(formData.get("redirectSearch") || "");

  if (!applicationId) {
    return;
  }

  await prisma.jobApplication.update({
    where: { id: applicationId },
    data: {
      stage: stage || null,
      status: status || null,
    },
  });

  const redirectUrl =
    redirectSearch && redirectSearch !== "null"
      ? `/ats/jobs/${jobId}?${redirectSearch}`
      : `/ats/jobs/${jobId}`;

  redirect(redirectUrl);
}

export default async function AtsJobDetailPage({
  params,
  searchParams,
}: {
  params: { jobId: string };
  searchParams: JobDetailSearchParams;
}) {
  const job = await prisma.job.findUnique({
    where: { id: params.jobId },
    include: {
      clientCompany: true,
      applications: {
        include: {
          candidate: true,
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!job) {
    notFound();
  }

  const { config } = await getScoringConfigForJob(job.id);

  const rows = job.applications.map((app) => {
    const scored = computeApplicationScore({
      application: app,
      candidate: app.candidate,
      job,
      config,
    });

    const cvUrl = app.cvUrl || app.candidate?.cvUrl || null;

    return {
      application: app,
      candidate: app.candidate,
      scored,
      cvUrl,
    };
  });

  // Header-tier counts across all rows
  const tierCounts: Record<Tier, number> = {
    A: 0,
    B: 0,
    C: 0,
    D: 0,
  };

  for (const row of rows) {
    const t = row.scored.tier;
    if (t === "A" || t === "B" || t === "C" || t === "D") {
      tierCounts[t] += 1;
    } else {
      tierCounts.D += 1;
    }
  }

  // FILTER LOGIC (stage + tier + text query)
  const stageFilterRaw = Array.isArray(searchParams.stage)
    ? searchParams.stage[0]
    : searchParams.stage;
  const tierFilterRaw = Array.isArray(searchParams.tier)
    ? searchParams.tier[0]
    : searchParams.tier;
  const qRaw = Array.isArray(searchParams.q)
    ? searchParams.q[0]
    : searchParams.q;

  const stageFilter = (stageFilterRaw || "all").toUpperCase();
  const tierFilter = (tierFilterRaw || "all").toUpperCase();
  const q = (qRaw || "").trim().toLowerCase();

  const filteredRows = rows.filter(({ application, candidate, scored }) => {
    if (stageFilter !== "ALL") {
      const stage = (application.stage || "APPLIED").toUpperCase();
      if (stage !== stageFilter) return false;
    }

    if (tierFilter !== "ALL") {
      const tier = (scored.tier || "D").toUpperCase();
      if (tier !== tierFilter) return false;
    }

    if (q) {
      const haystack = [
        application.fullName,
        application.email,
        candidate?.currentTitle ?? "",
        candidate?.currentCompany ?? "",
      ]
        .join(" ")
        .toLowerCase();

      if (!haystack.includes(q)) return false;
    }

    return true;
  });

  const searchParamsObj = new URLSearchParams();
  if (stageFilterRaw) searchParamsObj.set("stage", stageFilterRaw);
  if (tierFilterRaw) searchParamsObj.set("tier", tierFilterRaw);
  if (qRaw) searchParamsObj.set("q", qRaw);

  const serializedSearch = searchParamsObj.toString() || "";

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-6 lg:px-8">
      {/* Header */}
      <header className="space-y-2">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
          ATS · Job pipeline
        </p>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold text-[#172965]">
              {job.title}
            </h1>
            <p className="text-xs text-slate-600">
              {job.clientCompany?.name ? `${job.clientCompany.name} · ` : ""}
              {job.location || job.workMode || "Location not set"}
            </p>
          </div>
          <div className="flex flex-wrap items-end gap-2 text-[11px] text-slate-500">
            <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1">
              Applications:{" "}
              <span className="ml-1 font-semibold text-slate-800">
                {rows.length}
              </span>
            </span>
            <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1">
              A: <span className="ml-1 font-semibold">{tierCounts.A}</span>
            </span>
            <span className="inline-flex items-center rounded-full border border-sky-200 bg-sky-50 px-2.5 py-1">
              B: <span className="ml-1 font-semibold">{tierCounts.B}</span>
            </span>
            <span className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1">
              C: <span className="ml-1 font-semibold">{tierCounts.C}</span>
            </span>
            <span className="inline-flex items-center rounded-full border border-rose-200 bg-rose-50 px-2.5 py-1">
              D: <span className="ml-1 font-semibold">{tierCounts.D}</span>
            </span>
          </div>
        </div>
        <p className="text-[11px] text-slate-500">
          Pipeline view with scoring tiers, quick access to CVs and deep
          candidate profiles. Use the filters to focus your shortlist.
        </p>
      </header>

      {/* Pipeline card */}
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {/* Card header + filters */}
        <div className="border-b border-slate-100 px-4 py-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">
                Applications ({filteredRows.length}/{rows.length})
              </h2>
              <p className="text-[11px] text-slate-500">
                Newest applications appear first. Scores are driven by your
                semantic engine.
              </p>
            </div>

            {/* Filters: stage, tier, search */}
            <form
              className="flex flex-wrap items-center gap-2 text-[11px] text-slate-600"
              method="GET"
            >
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

              <div className="flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5">
                <input
                  name="q"
                  type="search"
                  defaultValue={qRaw || ""}
                  placeholder="Search by name, title, company"
                  className="w-44 bg-transparent text-[11px] text-slate-700 outline-none placeholder:text-slate-400"
                />
              </div>

              {(stageFilterRaw || tierFilterRaw || qRaw) && (
                <Link
                  href={`/ats/jobs/${job.id}`}
                  className="text-[11px] text-slate-500 underline underline-offset-4"
                >
                  Reset
                </Link>
              )}
            </form>
          </div>
        </div>

        {rows.length === 0 ? (
          <div className="px-4 py-10 text-center text-xs text-slate-500">
            No applications yet for this role.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full border-t border-slate-100 text-xs">
              <thead className="bg-slate-50/80 text-[11px] uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-2 text-left">Candidate</th>
                  <th className="px-4 py-2 text-left">Stage / status</th>
                  <th className="px-4 py-2 text-left">Tier</th>
                  <th className="px-4 py-2 text-left">Score</th>
                  <th className="px-4 py-2 text-left">Match summary</th>
                  <th className="px-4 py-2 text-left">Risks / red flags</th>
                  <th className="px-4 py-2 text-left">Interview focus</th>
                  <th className="px-4 py-2 text-left">CV</th>
                  <th className="px-4 py-2 text-left">Applied</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRows.map(
                  ({ application, candidate, scored, cvUrl }) => (
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

                      {/* Stage / status with inline update */}
                      <td className="px-4 py-3">
                        <form
                          action={updateApplicationStage}
                          className="space-y-1"
                        >
                          <input
                            type="hidden"
                            name="jobId"
                            value={job.id}
                          />
                          <input
                            type="hidden"
                            name="applicationId"
                            value={application.id}
                          />
                          <input
                            type="hidden"
                            name="redirectSearch"
                            value={serializedSearch}
                          />
                          <select
                            name="stage"
                            defaultValue={application.stage || "APPLIED"}
                            className="w-full rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-[11px] text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#2563EB]/40"
                          >
                            <option value="APPLIED">Applied</option>
                            <option value="SCREEN">Screen</option>
                            <option value="INTERVIEW">Interview</option>
                            <option value="OFFER">Offer</option>
                            <option value="HIRED">Hired</option>
                            <option value="REJECTED">Rejected</option>
                          </select>
                          <div className="flex items-center justify-between gap-2">
                            <select
                              name="status"
                              defaultValue={application.status || "PENDING"}
                              className="flex-1 rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-[11px] text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#2563EB]/40"
                            >
                              <option value="PENDING">Pending</option>
                              <option value="IN_REVIEW">In review</option>
                              <option value="ADVANCING">Advancing</option>
                              <option value="REJECTED">Rejected</option>
                              <option value="HIRED">Hired</option>
                            </select>
                            <button
                              type="submit"
                              className="rounded-md bg-slate-900 px-2 py-1 text-[10px] font-semibold text-white hover:bg-slate-800"
                            >
                              Save
                            </button>
                          </div>
                        </form>
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

                      {/* Match summary */}
                      <td className="px-4 py-3">
                        <p
                          className="max-w-xs text-[11px] text-slate-600 line-clamp-3"
                          title={scored.reason}
                        >
                          {scored.reason}
                        </p>
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
                          <span className="text-[11px] text-slate-400">—</span>
                        ) : (
                          <ul className="space-y-1 text-[11px] text-slate-600">
                            {scored.interviewFocus
                              .slice(0, 2)
                              .map((item, idx) => (
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

                      {/* Applied at */}
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
