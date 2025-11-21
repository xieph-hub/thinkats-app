// app/ats/jobs/[jobId]/ApplicationsTableClient.tsx
"use client";

import { useMemo, useState } from "react";

type Application = {
  id: string;
  fullName: string;
  email: string;
  phone: string | null;
  location: string | null;
  linkedinUrl: string | null;
  portfolioUrl: string | null;
  cvUrl: string | null;
  coverLetter: string | null;
  source: string | null;
  stage: string;
  status: string;
  createdAt: string;
};

type Props = {
  applications: Application[];
};

export default function ApplicationsTableClient({ applications }: Props) {
  const [search, setSearch] = useState("");
  const [stageFilter, setStageFilter] = useState<string | "all">("all");
  const [statusFilter, setStatusFilter] = useState<string | "all">("all");

  const filtered = useMemo(() => {
    return applications.filter((app) => {
      const haystack =
        `${app.fullName} ${app.email} ${app.location ?? ""}`.toLowerCase();
      const qs = search.trim().toLowerCase();

      if (qs && !haystack.includes(qs)) return false;
      if (stageFilter !== "all" && app.stage !== stageFilter) return false;
      if (statusFilter !== "all" && app.status !== statusFilter) return false;
      return true;
    });
  }, [applications, search, stageFilter, statusFilter]);

  const resolveCvUrl = (cvUrl: string | null) => {
    if (!cvUrl) return null;

    // If it already looks like an https URL, just use it
    if (cvUrl.startsWith("http://") || cvUrl.startsWith("https://")) {
      return cvUrl;
    }

    // Fallback: treat it as an object key inside your bucket
    const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (!base) return null;

    return `${base.replace(/\/$/, "")}/storage/v1/object/public/resourcin-uploads/${cvUrl}`;
  };

  return (
    <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
      {/* Filters */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <input
          type="text"
          placeholder="Search by name, email, location..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-full border border-slate-200 px-4 py-2 text-sm outline-none focus:border-[#172965] focus:ring-1 focus:ring-[#172965]"
        />

        <div className="flex flex-wrap gap-2 text-xs">
          <select
            value={stageFilter}
            onChange={(e) =>
              setStageFilter(e.target.value as typeof stageFilter)
            }
            className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs outline-none focus:border-[#172965] focus:ring-1 focus:ring-[#172965]"
          >
            <option value="all">All stages</option>
            <option value="APPLIED">Applied</option>
            <option value="SCREENING">Screening</option>
            <option value="INTERVIEW">Interview</option>
            <option value="OFFER">Offer</option>
            <option value="HIRED">Hired</option>
            <option value="REJECTED">Rejected</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(e.target.value as typeof statusFilter)
            }
            className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs outline-none focus:border-[#172965] focus:ring-1 focus:ring-[#172965]"
          >
            <option value="all">All statuses</option>
            <option value="PENDING">Pending</option>
            <option value="REVIEWING">Reviewing</option>
            <option value="ADVANCING">Advancing</option>
            <option value="ON_HOLD">On hold</option>
            <option value="CLOSED">Closed</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase text-slate-500">
            <tr>
              <th className="px-4 py-2">Candidate</th>
              <th className="px-4 py-2">Stage</th>
              <th className="px-4 py-2">Status</th>
              <th className="px-4 py-2">Source</th>
              <th className="px-4 py-2">Applied</th>
              <th className="px-4 py-2">CV</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td
                  colSpan={6}
                  className="px-4 py-6 text-center text-xs text-slate-500"
                >
                  No applications yet with these filters.
                </td>
              </tr>
            )}

            {filtered.map((app) => {
              const cvHref = resolveCvUrl(app.cvUrl);

              return (
                <tr
                  key={app.id}
                  className="border-b border-slate-100 last:border-0"
                >
                  <td className="px-4 py-3 align-top">
                    <div className="font-medium text-slate-900">
                      {app.fullName}
                    </div>
                    <div className="text-xs text-slate-500">
                      {app.email}
                    </div>
                    {app.location && (
                      <div className="text-xs text-slate-400">
                        {app.location}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 align-top text-xs text-slate-600">
                    {app.stage}
                  </td>
                  <td className="px-4 py-3 align-top text-xs text-slate-600">
                    {app.status}
                  </td>
                  <td className="px-4 py-3 align-top text-xs text-slate-600">
                    {app.source || "—"}
                  </td>
                  <td className="px-4 py-3 align-top text-xs text-slate-600">
                    {new Date(app.createdAt).toLocaleDateString(undefined, {
                      year: "numeric",
                      month: "short",
                      day: "2-digit",
                    })}
                  </td>
                  <td className="px-4 py-3 align-top text-xs">
                    {cvHref ? (
                      <a
                        href={cvHref}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center rounded-full border border-slate-200 px-3 py-1 text-xs font-medium text-[#172965] hover:border-[#172965] hover:bg-slate-50"
                      >
                        Open CV
                      </a>
                    ) : (
                      <span className="text-slate-400">No CV</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
