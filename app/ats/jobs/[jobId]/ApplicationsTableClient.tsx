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

const STAGE_OPTIONS = [
  { value: "APPLIED", label: "Applied" },
  { value: "SCREENING", label: "Screening" },
  { value: "HM_INTERVIEW", label: "HM interview" },
  { value: "PANEL", label: "Panel" },
  { value: "OFFER", label: "Offer" },
  { value: "HIRED", label: "Hired" },
  { value: "REJECTED", label: "Rejected" },
];

const STATUS_OPTIONS = [
  { value: "PENDING", label: "Pending" },
  { value: "REVIEWING", label: "Reviewing" },
  { value: "SHORTLISTED", label: "Shortlisted" },
  { value: "REJECTED", label: "Rejected" },
  { value: "HIRED", label: "Hired" },
];

export default function ApplicationsTableClient({ applications }: Props) {
  const [localApps, setLocalApps] = useState<Application[]>(applications);
  const [search, setSearch] = useState("");
  const [stageFilter, setStageFilter] = useState<"ALL" | string>("ALL");
  const [statusFilter, setStatusFilter] = useState<"ALL" | string>("ALL");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();

    return localApps.filter((app) => {
      if (stageFilter !== "ALL" && app.stage !== stageFilter) {
        return false;
      }
      if (statusFilter !== "ALL" && app.status !== statusFilter) {
        return false;
      }

      if (!term) return true;

      const haystack = [
        app.fullName,
        app.email,
        app.location || "",
        app.source || "",
      ]
        .join(" ")
        .toLowerCase();

      return haystack.includes(term);
    });
  }, [localApps, search, stageFilter, statusFilter]);

  async function updateApplication(
    id: string,
    updates: { stage?: string; status?: string }
  ) {
    setUpdatingId(id);
    setError(null);

    try {
      const res = await fetch(`/api/ats/job-applications/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updates),
      });

      if (!res.ok) {
        let message = "Failed to update application";
        try {
          const body = await res.json();
          if (body?.error) message = body.error;
        } catch {
          // ignore JSON parse errors
        }
        throw new Error(message);
      }

      const json = await res.json();
      const updated = json.application as Application;

      setLocalApps((prev) =>
        prev.map((app) => (app.id === id ? updated : app))
      );
    } catch (err: any) {
      console.error("Error updating application", err);
      setError(err?.message || "Something went wrong while updating");
    } finally {
      setUpdatingId(null);
    }
  }

  function handleStageChange(id: string, newStage: string) {
    updateApplication(id, { stage: newStage });
  }

  function handleStatusChange(id: string, newStatus: string) {
    updateApplication(id, { status: newStatus });
  }

  function formatDate(value: string) {
    if (!value) return "";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "";
    return d.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "2-digit",
    });
  }

  return (
    <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
      {/* Filters & search */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search by name, email, location…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-full border border-slate-200 px-4 py-2 text-sm shadow-sm focus:border-[#172965] focus:outline-none focus:ring-1 focus:ring-[#172965]"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <select
            value={stageFilter}
            onChange={(e) => setStageFilter(e.target.value)}
            className="rounded-full border border-slate-200 px-3 py-1 text-xs shadow-sm focus:border-[#172965] focus:outline-none focus:ring-1 focus:ring-[#172965]"
          >
            <option value="ALL">All stages</option>
            {STAGE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-full border border-slate-200 px-3 py-1 text-xs shadow-sm focus:border-[#172965] focus:outline-none focus:ring-1 focus:ring-[#172965]"
          >
            <option value="ALL">All statuses</option>
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && (
        <p className="mb-3 text-sm text-red-600">
          {error}
        </p>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="py-2 pr-4">Candidate</th>
              <th className="py-2 pr-4">Stage</th>
              <th className="py-2 pr-4">Status</th>
              <th className="py-2 pr-4">Source</th>
              <th className="py-2 pr-4">Applied</th>
              <th className="py-2 pr-4">CV</th>
              <th className="py-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.map((app) => {
              const isExpanded = expandedId === app.id;
              const isBusy = updatingId === app.id;

              return (
                <>
                  <tr key={app.id} className="align-middle">
                    <td className="py-3 pr-4">
                      <div className="font-medium text-slate-900">
                        {app.fullName}
                      </div>
                      <div className="text-xs text-slate-600">
                        {app.email}
                      </div>
                      {app.location && (
                        <div className="text-xs text-slate-500">
                          {app.location}
                        </div>
                      )}
                    </td>

                    <td className="py-3 pr-4">
                      <select
                        value={app.stage}
                        disabled={isBusy}
                        onChange={(e) =>
                          handleStageChange(app.id, e.target.value)
                        }
                        className="w-full rounded-full border border-slate-200 px-2 py-1 text-xs shadow-sm focus:border-[#172965] focus:outline-none focus:ring-1 focus:ring-[#172965]"
                      >
                        {STAGE_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </td>

                    <td className="py-3 pr-4">
                      <select
                        value={app.status}
                        disabled={isBusy}
                        onChange={(e) =>
                          handleStatusChange(app.id, e.target.value)
                        }
                        className="w-full rounded-full border border-slate-200 px-2 py-1 text-xs shadow-sm focus:border-[#172965] focus:outline-none focus:ring-1 focus:ring-[#172965]"
                      >
                        {STATUS_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </td>

                    <td className="py-3 pr-4 text-slate-700">
                      {app.source || "—"}
                    </td>

                    <td className="py-3 pr-4 text-xs text-slate-600">
                      {formatDate(app.createdAt)}
                    </td>

                    <td className="py-3 pr-4 text-xs">
                      {app.cvUrl ? (
                        <a
                          href={app.cvUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="rounded-full border border-slate-200 px-3 py-1 text-xs font-medium text-[#172965] hover:bg-slate-50"
                        >
                          Open CV
                        </a>
                      ) : (
                        <span className="text-slate-400">No CV</span>
                      )}
                    </td>

                    <td className="py-3 pr-4 text-right">
                      <button
                        type="button"
                        onClick={() =>
                          setExpandedId(isExpanded ? null : app.id)
                        }
                        className="text-xs font-medium text-[#172965] hover:underline"
                      >
                        {isExpanded ? "Hide details" : "View details"}
                      </button>
                    </td>
                  </tr>

                  {isExpanded && (
                    <tr key={`${app.id}-details`}>
                      <td
                        colSpan={7}
                        className="bg-slate-50 px-4 py-3 text-xs text-slate-700"
                      >
                        <div className="flex flex-col gap-2 sm:flex-row sm:justify-between">
                          <div className="space-y-1">
                            {app.phone && (
                              <div>
                                <span className="font-semibold">
                                  Phone:
                                </span>{" "}
                                {app.phone}
                              </div>
                            )}
                            {app.linkedinUrl && (
                              <div>
                                <span className="font-semibold">
                                  LinkedIn:
                                </span>{" "}
                                <a
                                  href={app.linkedinUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-[#172965] underline"
                                >
                                  Open profile
                                </a>
                              </div>
                            )}
                            {app.portfolioUrl && (
                              <div>
                                <span className="font-semibold">
                                  Portfolio:
                                </span>{" "}
                                <a
                                  href={app.portfolioUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-[#172965] underline"
                                >
                                  Open portfolio
                                </a>
                              </div>
                            )}
                          </div>

                          {app.coverLetter && (
                            <div className="mt-2 max-w-xl text-xs text-slate-700 sm:mt-0">
                              <div className="mb-1 font-semibold">
                                Cover letter
                              </div>
                              <p className="whitespace-pre-wrap">
                                {app.coverLetter.length > 600
                                  ? app.coverLetter.slice(0, 600) + "…"
                                  : app.coverLetter}
                              </p>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              );
            })}

            {filtered.length === 0 && (
              <tr>
                <td
                  colSpan={7}
                  className="py-6 text-center text-sm text-slate-500"
                >
                  No applications match your filters yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
