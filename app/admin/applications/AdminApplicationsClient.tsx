// app/admin/applications/AdminApplicationsClient.tsx
"use client";

import { useMemo, useState } from "react";

export type AdminApplicationRow = {
  id: string;
  createdAt: string; // ISO string
  jobId: string;
  jobTitle: string;
  clientName: string | null;
  fullName: string;
  email: string;
  location: string;
  source: string;
  stage: string;
  status: string;
  cvUrl: string; // path inside resourcin-uploads bucket
};

type Props = {
  initialRows: AdminApplicationRow[];
};

const STAGES = [
  "APPLIED",
  "SCREENING",
  "HM_INTERVIEW",
  "PANEL",
  "OFFER",
  "HIRED",
  "REJECTED",
] as const;

const STATUSES = [
  "PENDING",
  "REVIEWING",
  "SHORTLISTED",
  "REJECTED",
  "HIRED",
] as const;

export default function AdminApplicationsClient({ initialRows }: Props) {
  const [rows, setRows] = useState<AdminApplicationRow[]>(initialRows);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [stageFilter, setStageFilter] = useState<string>("all");
  const [jobFilter, setJobFilter] = useState<string>("all");
  const [clientFilter, setClientFilter] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");

  const [isExporting, setIsExporting] = useState(false);

  // Unique jobs/clients for dropdowns
  const jobOptions = useMemo(
    () =>
      Array.from(
        new Map(
          rows.map((r) => [r.jobId, { jobId: r.jobId, jobTitle: r.jobTitle }])
        ).values()
      ),
    [rows]
  );

  const clientOptions = useMemo(
    () =>
      Array.from(
        new Set(
          rows
            .map((r) => r.clientName)
            .filter((c): c is string => !!c && c.trim().length > 0)
        )
      ),
    [rows]
  );

  const filteredRows = useMemo(() => {
    return rows.filter((row) => {
      // Search filter (candidate name/email/job)
      if (search.trim()) {
        const s = search.toLowerCase();
        const combined = `${row.fullName} ${row.email} ${row.jobTitle}`.toLowerCase();
        if (!combined.includes(s)) return false;
      }

      if (statusFilter !== "all" && row.status !== statusFilter) return false;
      if (stageFilter !== "all" && row.stage !== stageFilter) return false;
      if (jobFilter !== "all" && row.jobId !== jobFilter) return false;
      if (clientFilter !== "all" && row.clientName !== clientFilter)
        return false;

      if (dateFrom) {
        const from = new Date(dateFrom);
        const created = new Date(row.createdAt);
        if (created < from) return false;
      }

      if (dateTo) {
        const to = new Date(dateTo);
        const created = new Date(row.createdAt);
        // include selected day fully
        to.setHours(23, 59, 59, 999);
        if (created > to) return false;
      }

      return true;
    });
  }, [rows, search, statusFilter, stageFilter, jobFilter, clientFilter, dateFrom, dateTo]);

  async function updateApplication(
    id: string,
    payload: { stage?: string; status?: string }
  ) {
    // Optimistic UI
    setRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, ...payload } : r))
    );

    try {
      const res = await fetch(`/api/admin/applications/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        console.error("Failed to update application", await res.text());
        // Could revert if needed; for now just log + leave optimistic
      }
    } catch (err) {
      console.error("Error updating application", err);
    }
  }

  function formatDate(iso: string) {
    const d = new Date(iso);
    return d.toLocaleString("en-NG", {
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function escapeCsv(value: string | null | undefined): string {
    const v = (value ?? "").replace(/"/g, '""');
    return `"${v}"`;
  }

  function handleExportCsv() {
    setIsExporting(true);
    try {
      const header = [
        "Created At",
        "Job Title",
        "Client",
        "Candidate Name",
        "Candidate Email",
        "Location",
        "Source",
        "Stage",
        "Status",
        "CV Path",
      ];

      const lines = [header.map(escapeCsv).join(",")];

      filteredRows.forEach((row) => {
        lines.push(
          [
            escapeCsv(formatDate(row.createdAt)),
            escapeCsv(row.jobTitle),
            escapeCsv(row.clientName),
            escapeCsv(row.fullName),
            escapeCsv(row.email),
            escapeCsv(row.location),
            escapeCsv(row.source),
            escapeCsv(row.stage),
            escapeCsv(row.status),
            escapeCsv(row.cvUrl),
          ].join(",")
        );
      });

      const csvContent = lines.join("\r\n");
      const blob = new Blob([csvContent], {
        type: "text/csv;charset=utf-8;",
      });
      const url = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      const now = new Date();
      const stamp = now.toISOString().slice(0, 19).replace(/[:T]/g, "-");
      a.download = `resourcin-applications-${stamp}.csv`;
      a.click();

      URL.revokeObjectURL(url);
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-1 flex-wrap gap-3">
          <div className="flex-1 min-w-[180px]">
            <label className="block text-xs font-medium text-slate-600">
              Search
            </label>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Name, email, role…"
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#172965]"
            />
          </div>

          <div className="min-w-[130px]">
            <label className="block text-xs font-medium text-slate-600">
              Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-200 px-2 py-2 text-xs outline-none focus:border-[#172965]"
            >
              <option value="all">All</option>
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          <div className="min-w-[150px]">
            <label className="block text-xs font-medium text-slate-600">
              Stage
            </label>
            <select
              value={stageFilter}
              onChange={(e) => setStageFilter(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-200 px-2 py-2 text-xs outline-none focus:border-[#172965]"
            >
              <option value="all">All</option>
              {STAGES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          <div className="min-w-[160px]">
            <label className="block text-xs font-medium text-slate-600">
              Job
            </label>
            <select
              value={jobFilter}
              onChange={(e) => setJobFilter(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-200 px-2 py-2 text-xs outline-none focus:border-[#172965]"
            >
              <option value="all">All</option>
              {jobOptions.map((j) => (
                <option key={j.jobId} value={j.jobId}>
                  {j.jobTitle}
                </option>
              ))}
            </select>
          </div>

          <div className="min-w-[160px]">
            <label className="block text-xs font-medium text-slate-600">
              Client
            </label>
            <select
              value={clientFilter}
              onChange={(e) => setClientFilter(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-200 px-2 py-2 text-xs outline-none focus:border-[#172965]"
            >
              <option value="all">All</option>
              {clientOptions.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div className="min-w-[140px]">
            <label className="block text-xs font-medium text-slate-600">
              From
            </label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-200 px-2 py-2 text-xs outline-none focus:border-[#172965]"
            />
          </div>

          <div className="min-w-[140px]">
            <label className="block text-xs font-medium text-slate-600">
              To
            </label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-200 px-2 py-2 text-xs outline-none focus:border-[#172965]"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleExportCsv}
            disabled={isExporting || filteredRows.length === 0}
            className="inline-flex items-center rounded-full bg-slate-900 px-3 py-2 text-xs font-semibold text-white shadow-sm hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isExporting ? "Exporting…" : "Export CSV"}
          </button>
          <p className="text-[11px] text-slate-500">
            Showing {filteredRows.length} of {rows.length}
          </p>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
              <th className="px-3 py-2">Applied</th>
              <th className="px-3 py-2">Job</th>
              <th className="px-3 py-2">Client</th>
              <th className="px-3 py-2">Candidate</th>
              <th className="px-3 py-2">Stage</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2">Source</th>
              <th className="px-3 py-2">CV</th>
            </tr>
          </thead>
          <tbody>
            {filteredRows.length === 0 ? (
              <tr>
                <td
                  colSpan={8}
                  className="px-3 py-6 text-center text-xs text-slate-500"
                >
                  No applications match the current filters.
                </td>
              </tr>
            ) : (
              filteredRows.map((row) => (
                <tr
                  key={row.id}
                  className="border-b border-slate-100 hover:bg-slate-50/60"
                >
                  <td className="px-3 py-2 align-top text-[11px] text-slate-500">
                    {formatDate(row.createdAt)}
                  </td>
                  <td className="px-3 py-2 align-top text-xs text-slate-900">
                    <div className="font-medium">{row.jobTitle}</div>
                    {row.location && (
                      <div className="text-[11px] text-slate-500">
                        {row.location}
                      </div>
                    )}
                  </td>
                  <td className="px-3 py-2 align-top text-xs text-slate-700">
                    {row.clientName ?? "—"}
                  </td>
                  <td className="px-3 py-2 align-top text-xs">
                    <div className="font-medium text-slate-900">
                      {row.fullName}
                    </div>
                    <div className="text-[11px] text-slate-500">
                      {row.email}
                    </div>
                  </td>
                  <td className="px-3 py-2 align-top text-xs">
                    <select
                      value={row.stage}
                      onChange={(e) =>
                        updateApplication(row.id, { stage: e.target.value })
                      }
                      className="w-full max-w-[140px] rounded-full border border-slate-200 bg-white px-2 py-1 text-[11px] outline-none focus:border-[#172965]"
                    >
                      {STAGES.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-3 py-2 align-top text-xs">
                    <select
                      value={row.status}
                      onChange={(e) =>
                        updateApplication(row.id, { status: e.target.value })
                      }
                      className="w-full max-w-[130px] rounded-full border border-slate-200 bg-white px-2 py-1 text-[11px] outline-none focus:border-[#172965]"
                    >
                      {STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-3 py-2 align-top text-[11px] text-slate-600">
                    {row.source || "—"}
                  </td>
                  <td className="px-3 py-2 align-top text-[11px]">
                    {row.cvUrl ? (
                      <a
                        href={`/admin/applications/cv?path=${encodeURIComponent(
                          row.cvUrl
                        )}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center rounded-full bg-slate-900 px-2.5 py-1 text-[11px] font-medium text-white hover:bg-slate-800"
                      >
                        Download CV
                      </a>
                    ) : (
                      <span className="text-slate-400">No CV</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
