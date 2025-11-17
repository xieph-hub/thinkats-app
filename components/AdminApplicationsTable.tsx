"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

export type AdminApplicationRow = {
  id: string;
  fullName: string;
  email: string;
  phone?: string;
  location?: string;
  stage: string;
  status: string;
  source: string;
  createdAt: string; // ISO string
  jobTitle?: string;
  jobSlug?: string;
  jobLocation?: string;
  jobSeniority?: string;
  cvUrl?: string;
  clientName?: string;
};

type Props = {
  applications: AdminApplicationRow[];
};

function formatDate(iso: string) {
  try {
    const d = new Date(iso);
    return d.toLocaleString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

function escapeCsv(value: string | null | undefined): string {
  if (value == null) return "";
  const v = String(value);
  if (/[",\n]/.test(v)) {
    return `"${v.replace(/"/g, '""')}"`;
  }
  return v;
}

function downloadCsv(rows: AdminApplicationRow[]) {
  if (!rows.length) return;

  const header = [
    "id",
    "fullName",
    "email",
    "phone",
    "location",
    "jobTitle",
    "jobSlug",
    "jobLocation",
    "jobSeniority",
    "clientName",
    "stage",
    "status",
    "source",
    "createdAt",
    "cvUrl",
  ];

  const dataRows = rows.map((app) => [
    app.id,
    app.fullName,
    app.email,
    app.phone ?? "",
    app.location ?? "",
    app.jobTitle ?? "",
    app.jobSlug ?? "",
    app.jobLocation ?? "",
    app.jobSeniority ?? "",
    app.clientName ?? "",
    app.stage,
    app.status,
    app.source,
    app.createdAt,
    app.cvUrl ?? "",
  ]);

  const csv = [header, ...dataRows]
    .map((row) => row.map(escapeCsv).join(","))
    .join("\n");

  const blob = new Blob([csv], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", "resourcin-applications.csv");
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export default function AdminApplicationsTable({ applications }: Props) {
  const [search, setSearch] = useState("");
  const [stageFilter, setStageFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [jobFilter, setJobFilter] = useState("all");
  const [clientFilter, setClientFilter] = useState("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const stages = useMemo(
    () =>
      Array.from(new Set(applications.map((a) => a.stage))).sort((a, b) =>
        a.localeCompare(b)
      ),
    [applications]
  );

  const statuses = useMemo(
    () =>
      Array.from(new Set(applications.map((a) => a.status))).sort((a, b) =>
        a.localeCompare(b)
      ),
    [applications]
  );

  const sources = useMemo(
    () =>
      Array.from(new Set(applications.map((a) => a.source))).sort((a, b) =>
        a.localeCompare(b)
      ),
    [applications]
  );

  const jobOptions = useMemo(() => {
    const map = new Map<string, string>();
    applications.forEach((a) => {
      if (a.jobSlug && a.jobTitle) {
        if (!map.has(a.jobSlug)) {
          map.set(a.jobSlug, a.jobTitle);
        }
      }
    });
    return Array.from(map.entries())
      .map(([slug, title]) => ({ slug, title }))
      .sort((a, b) => a.title.localeCompare(b.title));
  }, [applications]);

  const clientOptions = useMemo(() => {
    const set = new Set<string>();
    applications.forEach((a) => {
      if (a.clientName && a.clientName.trim().length > 0) {
        set.add(a.clientName);
      }
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [applications]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    const from = fromDate ? new Date(fromDate + "T00:00:00") : null;
    const to = toDate ? new Date(toDate + "T23:59:59") : null;

    return applications.filter((app) => {
      if (term) {
        const haystack = (
          (app.fullName ?? "") +
          " " +
          (app.email ?? "") +
          " " +
          (app.jobTitle ?? "") +
          " " +
          (app.clientName ?? "")
        )
          .toLowerCase()
          .trim();

        if (!haystack.includes(term)) return false;
      }

      if (stageFilter !== "all" && app.stage !== stageFilter) return false;
      if (statusFilter !== "all" && app.status !== statusFilter) return false;
      if (sourceFilter !== "all" && app.source !== sourceFilter) return false;
      if (jobFilter !== "all" && app.jobSlug !== jobFilter) return false;
      if (
        clientFilter !== "all" &&
        (app.clientName ?? "") !== clientFilter
      ) {
        return false;
      }

      if (from || to) {
        const created = new Date(app.createdAt);
        if (from && created < from) return false;
        if (to && created > to) return false;
      }

      return true;
    });
  }, [
    applications,
    search,
    stageFilter,
    statusFilter,
    sourceFilter,
    jobFilter,
    clientFilter,
    fromDate,
    toDate,
  ]);

  return (
    <section className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 sm:p-6">
      {/* Controls: search + export */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex-1">
          <label className="block text-xs font-medium text-slate-600">
            Search
          </label>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by candidate name, email, job title, or client…"
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none focus:border-[#172965]"
          />
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => downloadCsv(filtered)}
            className="inline-flex items-center rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-slate-800"
          >
            Export CSV
          </button>
          <span className="text-[0.7rem] text-slate-500">
            CSV opens directly in Excel.
          </span>
        </div>
      </div>

      {/* Filters row 1: stage / status / source */}
      <div className="mb-3 grid gap-3 text-xs sm:grid-cols-3">
        <div>
          <label className="block text-[0.7rem] font-medium text-slate-600">
            Stage
          </label>
          <select
            value={stageFilter}
            onChange={(e) => setStageFilter(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-200 px-2 py-1.5 text-xs text-slate-900 outline-none focus:border-[#172965]"
          >
            <option value="all">All stages</option>
            {stages.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[0.7rem] font-medium text-slate-600">
            Status
          </label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-200 px-2 py-1.5 text-xs text-slate-900 outline-none focus:border-[#172965]"
          >
            <option value="all">All statuses</option>
            {statuses.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[0.7rem] font-medium text-slate-600">
            Source
          </label>
          <select
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-200 px-2 py-1.5 text-xs text-slate-900 outline-none focus:border-[#172965]"
          >
            <option value="all">All sources</option>
            {sources.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Filters row 2: job / client / date range */}
      <div className="mb-4 grid gap-3 text-xs sm:grid-cols-3">
        <div>
          <label className="block text-[0.7rem] font-medium text-slate-600">
            Job
          </label>
          <select
            value={jobFilter}
            onChange={(e) => setJobFilter(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-200 px-2 py-1.5 text-xs text-slate-900 outline-none focus:border-[#172965]"
          >
            <option value="all">All jobs</option>
            {jobOptions.map((job) => (
              <option key={job.slug} value={job.slug}>
                {job.title}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[0.7rem] font-medium text-slate-600">
            Client
          </label>
          <select
            value={clientFilter}
            onChange={(e) => setClientFilter(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-200 px-2 py-1.5 text-xs text-slate-900 outline-none focus:border-[#172965]"
          >
            <option value="all">All clients</option>
            {clientOptions.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-[0.7rem] font-medium text-slate-600">
              From
            </label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-200 px-2 py-1.5 text-xs text-slate-900 outline-none focus:border-[#172965]"
            />
          </div>
          <div>
            <label className="block text-[0.7rem] font-medium text-slate-600">
              To
            </label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-200 px-2 py-1.5 text-xs text-slate-900 outline-none focus:border-[#172965]"
            />
          </div>
        </div>
      </div>

      {/* Table / empty state */}
      {filtered.length === 0 ? (
        <p className="text-sm text-slate-500">
          No applications match your current filters.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="whitespace-nowrap px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Candidate
                </th>
                <th className="whitespace-nowrap px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Job
                </th>
                <th className="whitespace-nowrap px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Client
                </th>
                <th className="whitespace-nowrap px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Stage / Status
                </th>
                <th className="whitespace-nowrap px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Source
                </th>
                <th className="whitespace-nowrap px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  CV
                </th>
                <th className="whitespace-nowrap px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Applied at
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((app) => {
                const appliedAt = formatDate(app.createdAt);
                const hasCv = !!app.cvUrl && app.cvUrl.startsWith("http");

                return (
                  <tr key={app.id} className="hover:bg-slate-50/60">
                    {/* Candidate */}
                    <td className="whitespace-nowrap px-3 py-2 align-top">
                      <div className="flex flex-col">
                        <span className="font-medium text-slate-900">
                          {app.fullName}
                        </span>
                        <span className="text-xs text-slate-500">
                          {app.email}
                        </span>
                        {app.phone && (
                          <span className="text-xs text-slate-500">
                            {app.phone}
                          </span>
                        )}
                        {app.location && (
                          <span className="text-xs text-slate-500">
                            {app.location}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Job */}
                    <td className="whitespace-nowrap px-3 py-2 align-top">
                      {app.jobSlug ? (
                        <div className="flex flex-col">
                          <Link
                            href={`/jobs/${app.jobSlug}`}
                            className="text-sm font-medium text-[#172965] hover:underline"
                          >
                            {app.jobTitle}
                          </Link>
                          <span className="text-xs text-slate-500">
                            {app.jobLocation} • {app.jobSeniority}
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400">
                          Job no longer available
                        </span>
                      )}
                    </td>

                    {/* Client */}
                    <td className="whitespace-nowrap px-3 py-2 align-top">
                      {app.clientName ? (
                        <span className="text-xs text-slate-700">
                          {app.clientName}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400">
                          Not specified
                        </span>
                      )}
                    </td>

                    {/* Stage / Status */}
                    <td className="whitespace-nowrap px-3 py-2 align-top">
                      <div className="flex flex-col gap-1">
                        <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[0.7rem] font-medium uppercase tracking-wide text-slate-700">
                          {app.stage}
                        </span>
                        <span className="inline-flex items-center rounded-full bg-slate-50 px-2 py-0.5 text-[0.7rem] font-medium uppercase tracking-wide text-slate-500">
                          {app.status}
                        </span>
                      </div>
                    </td>

                    {/* Source */}
                    <td className="whitespace-nowrap px-3 py-2 align-top">
                      <span className="inline-flex items-center rounded-full bg-slate-50 px-2 py-0.5 text-[0.7rem] font-medium uppercase tracking-wide text-slate-600">
                        {app.source}
                      </span>
                    </td>

                    {/* CV */}
                    <td className="whitespace-nowrap px-3 py-2 align-top">
                      {hasCv ? (
                        <a
                          href={app.cvUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[0.7rem] font-medium text-[#172965] hover:bg-slate-200"
                        >
                          Download CV
                        </a>
                      ) : (
                        <span className="text-xs text-slate-400">
                          No file URL
                        </span>
                      )}
                    </td>

                    {/* Applied at */}
                    <td className="whitespace-nowrap px-3 py-2 align-top text-xs text-slate-500">
                      {appliedAt}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
