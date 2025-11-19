// app/ats/jobs/[jobId]/ApplicationsTableClient.tsx
"use client";

import { useState } from "react";

type Application = {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  location: string | null;
  linkedin_url: string | null;
  source: string | null;
  stage: string | null;
  status: string | null;
  created_at: string;
};

type Props = {
  applications: Application[];
};

const STAGE_OPTIONS = [
  "APPLIED",
  "SCREENING",
  "HM_INTERVIEW",
  "PANEL",
  "OFFER",
  "HIRED",
  "REJECTED",
] as const;

const STATUS_OPTIONS = [
  "PENDING",
  "REVIEWING",
  "SHORTLISTED",
  "REJECTED",
  "HIRED",
] as const;

function formatStage(stage: string | null) {
  if (!stage) return "APPLIED";
  return stage
    .toLowerCase()
    .replace("_", " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatStatus(status: string | null) {
  if (!status) return "PENDING";
  return status
    .toLowerCase()
    .replace("_", " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function ApplicationsTableClient({ applications }: Props) {
  const [rows, setRows] = useState(
    applications.map((a) => ({
      ...a,
      stage: a.stage ?? "APPLIED",
      status: a.status ?? "PENDING",
      isSaving: false,
      error: null as string | null,
    }))
  );

  const updateRowLocal = (id: string, patch: Partial<(typeof rows)[number]>) => {
    setRows((prev) =>
      prev.map((row) =>
        row.id === id ? { ...row, ...patch } : row
      )
    );
  };

  const handleChange = async (
    id: string,
    field: "stage" | "status",
    value: string
  ) => {
    const row = rows.find((r) => r.id === id);
    if (!row) return;

    // optimistic local update
    updateRowLocal(id, { [field]: value, isSaving: true, error: null });

    try {
      const res = await fetch(
        `/api/ats/applications/${encodeURIComponent(id)}/update`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            stage: field === "stage" ? value : row.stage,
            status: field === "status" ? value : row.status,
          }),
        }
      );

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        updateRowLocal(id, {
          isSaving: false,
          error:
            data?.error ||
            "Could not save changes. Please try again.",
        });
        return;
      }

      updateRowLocal(id, { isSaving: false, error: null });
    } catch (err) {
      console.error("Error updating application", err);
      updateRowLocal(id, {
        isSaving: false,
        error: "Network error. Please try again.",
      });
    }
  };

  if (rows.length === 0) {
    return (
      <section className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-6 py-10 text-center">
        <h2 className="text-base font-semibold text-slate-900">
          No applications yet
        </h2>
        <p className="mt-2 text-sm text-slate-600">
          Once candidates start applying via your job page,
          they&apos;ll appear here with their details and stage.
        </p>
      </section>
    );
  }

  return (
    <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
      <table className="min-w-full text-left text-xs text-slate-700">
        <thead className="bg-slate-50 text-[11px] uppercase tracking-wide text-slate-500">
          <tr>
            <th className="px-4 py-3">Candidate</th>
            <th className="px-4 py-3">Contact</th>
            <th className="px-4 py-3">Location</th>
            <th className="px-4 py-3">Stage</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">Applied</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((app) => (
            <tr
              key={app.id}
              className="border-t border-slate-100 hover:bg-slate-50/60"
            >
              <td className="px-4 py-3 align-top">
                <div className="text-sm font-medium text-slate-900">
                  {app.full_name}
                </div>
                {app.source && (
                  <div className="mt-0.5 text-[11px] text-slate-500">
                    Source: {app.source}
                  </div>
                )}
                {app.error && (
                  <div className="mt-1 text-[11px] text-red-600">
                    {app.error}
                  </div>
                )}
              </td>
              <td className="px-4 py-3 align-top text-xs">
                <div>{app.email}</div>
                {app.phone && (
                  <div className="mt-0.5 text-[11px] text-slate-500">
                    {app.phone}
                  </div>
                )}
                {app.linkedin_url && (
                  <div className="mt-0.5 text-[11px]">
                    <a
                      href={app.linkedin_url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[#172965] hover:underline"
                    >
                      LinkedIn ↗
                    </a>
                  </div>
                )}
              </td>
              <td className="px-4 py-3 align-top text-xs">
                {app.location ?? "—"}
              </td>
              <td className="px-4 py-3 align-top text-xs">
                <div className="flex flex-col gap-1">
                  <select
                    value={app.stage}
                    onChange={(e) =>
                      handleChange(app.id, "stage", e.target.value)
                    }
                    className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs shadow-sm focus:border-[#172965] focus:outline-none focus:ring-1 focus:ring-[#172965]"
                    disabled={app.isSaving}
                  >
                    {STAGE_OPTIONS.map((option) => (
                      <option key={option} value={option}>
                        {formatStage(option)}
                      </option>
                    ))}
                  </select>
                  {app.isSaving && (
                    <span className="text-[10px] text-slate-500">
                      Saving…
                    </span>
                  )}
                </div>
              </td>
              <td className="px-4 py-3 align-top text-xs">
                <select
                  value={app.status}
                  onChange={(e) =>
                    handleChange(app.id, "status", e.target.value)
                  }
                  className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs shadow-sm focus:border-[#172965] focus:outline-none focus:ring-1 focus:ring-[#172965]"
                  disabled={app.isSaving}
                >
                  {STATUS_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {formatStatus(option)}
                    </option>
                  ))}
                </select>
              </td>
              <td className="px-4 py-3 align-top text-xs">
                {app.created_at
                  ? new Date(app.created_at).toLocaleString()
                  : "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
