// app/ats/candidates/CandidatesTable.tsx
"use client";

import { useState } from "react";
import Link from "next/link";

export type CandidateRowProps = {
  id: string;
  index: number;
  fullName: string;
  email: string | null;
  location: string | null;
  currentCompany: string | null;
  createdAt: string; // ISO
  tags: { id: string; name: string }[];
  pipelines: { id: string; title: string; stage: string }[];
  primaryTier: string | null;
  latestScore: number | null;
  latestJobTitle: string;
  latestClient: string | null;
  source: string;
  lastSeen: string; // ISO
};

function scoreColorHex(score: number | null | undefined) {
  if (score == null) return "#64748b"; // slate-500
  if (score >= 80) return "#16a34a"; // emerald-600
  if (score >= 65) return "#2563eb"; // blue-600
  if (score >= 50) return "#f59e0b"; // amber-500
  return "#475569"; // slate-600
}

function ScoreRing({
  score,
  title,
}: {
  score: number | null;
  title?: string;
}) {
  const value = score ?? 0;
  const clamped = Math.max(0, Math.min(value, 100));
  const radius = 16;
  const circumference = 2 * Math.PI * radius;
  const dash = (clamped / 100) * circumference;
  const stroke = scoreColorHex(score);

  return (
    <div
      className="relative inline-flex items-center justify-center"
      title={title}
      aria-label={
        score != null ? `Match score ${score}` : "Match score not set"
      }
    >
      <svg viewBox="0 0 40 40" className="h-11 w-11">
        <circle
          cx="20"
          cy="20"
          r={radius}
          fill="none"
          stroke="#e5e7eb"
          strokeWidth="4"
        />
        <circle
          cx="20"
          cy="20"
          r={radius}
          fill="none"
          stroke={stroke}
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circumference - dash}`}
          strokeDashoffset={circumference * 0.25}
          transform="rotate(-90 20 20)"
        />
      </svg>
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <span className="text-[11px] font-semibold text-slate-900">
          {score != null ? score : "–"}
        </span>
      </div>
    </div>
  );
}

function tierChipColor(tier: string | null) {
  if (!tier) return "bg-slate-100 text-slate-600";
  const upper = tier.toUpperCase();
  if (upper === "A") return "bg-emerald-100 text-emerald-700";
  if (upper === "B") return "bg-sky-100 text-sky-700";
  if (upper === "C") return "bg-amber-100 text-amber-700";
  return "bg-slate-100 text-slate-600";
}

function formatDateFromIso(iso: string) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
}

export default function CandidatesTable({
  rows,
}: {
  rows: CandidateRowProps[];
}) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const allSelected = rows.length > 0 && selectedIds.length === rows.length;

  function toggleAll() {
    if (allSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(rows.map((r) => r.id));
    }
  }

  function toggleRow(id: string) {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  return (
    <div className="overflow-x-auto">
      {/* Bulk selection toolbar */}
      <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-2 text-[10px] text-slate-600">
        <label className="inline-flex items-center gap-2">
          <input
            type="checkbox"
            className="h-3.5 w-3.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500/40"
            checked={allSelected}
            onChange={toggleAll}
          />
          <span>
            {allSelected ? "Clear selection" : "Select all on this page"}
          </span>
        </label>
        <span>
          {selectedIds.length
            ? `${selectedIds.length} candidate${
                selectedIds.length === 1 ? "" : "s"
              } selected`
            : "No candidates selected"}
        </span>
      </div>

      <table className="w-full border-separate border-spacing-y-1 text-[11px]">
        <thead>
          <tr className="text-left text-[10px] font-semibold uppercase tracking-wide text-slate-500">
            <th className="w-16 px-3 py-2">#</th>
            <th className="px-3 py-2">Candidate</th>
            <th className="px-3 py-2">Pipelines</th>
            <th className="px-3 py-2 text-right">Match score</th>
            <th className="px-3 py-2">Latest role</th>
            <th className="px-3 py-2">Source</th>
            <th className="px-3 py-2 text-right">Last touch</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const isSelected = selectedIds.includes(row.id);

            const firstTwoPipelines = row.pipelines.slice(0, 2);
            const extraPipelines = Math.max(row.pipelines.length - 2, 0);

            return (
              <tr key={row.id}>
                {/* Number + checkbox */}
                <td className="align-top px-3 py-2 text-[10px] text-slate-600">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      className="h-3.5 w-3.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500/40"
                      checked={isSelected}
                      onChange={() => toggleRow(row.id)}
                    />
                    <span className="font-medium text-slate-700">
                      {row.index}
                    </span>
                  </div>
                </td>

                {/* Candidate card */}
                <td className="align-top px-3 py-2">
                  <div className="flex flex-col gap-1 rounded-xl border border-slate-100 bg-slate-50/60 px-3 py-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <Link
                          href={`/ats/candidates/${row.id}`}
                          className="text-[11px] font-semibold text-slate-900 hover:text-indigo-700 hover:underline"
                        >
                          {row.fullName}
                        </Link>
                        <div className="mt-0.5 flex flex-wrap items-center gap-1 text-[10px] text-slate-500">
                          {row.email && <span>{row.email}</span>}
                          {row.location && (
                            <>
                              <span className="text-slate-300">•</span>
                              <span>{row.location}</span>
                            </>
                          )}
                          {row.currentCompany && (
                            <>
                              <span className="text-slate-300">•</span>
                              <span>{row.currentCompany}</span>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col items-end text-[10px] text-slate-500">
                        <span>Added {formatDateFromIso(row.createdAt)}</span>
                      </div>
                    </div>

                    {row.tags.length > 0 && (
                      <div className="mt-1 flex flex-wrap gap-1">
                        {row.tags.slice(0, 3).map((tag) => (
                          <span
                            key={tag.id}
                            className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[9px] text-slate-700"
                          >
                            {tag.name}
                          </span>
                        ))}
                        {row.tags.length > 3 && (
                          <span className="text-[9px] text-slate-400">
                            +{row.tags.length - 3} more
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </td>

                {/* Pipelines */}
                <td className="align-top px-3 py-2 text-[10px] text-slate-600">
                  <div className="flex flex-col gap-0.5">
                    <span className="font-medium text-slate-900">
                      {row.pipelines.length}{" "}
                      {row.pipelines.length === 1 ? "pipeline" : "pipelines"}
                    </span>
                    {firstTwoPipelines.map((p) => (
                      <div
                        key={p.id}
                        className="flex items-center gap-1 text-[10px]"
                      >
                        <span className="truncate text-slate-700">
                          {p.title}
                        </span>
                        <span className="text-slate-300">•</span>
                        <span className="text-slate-500">
                          {p.stage || "APPLIED"}
                        </span>
                      </div>
                    ))}
                    {extraPipelines > 0 && (
                      <span className="text-[9px] text-slate-400">
                        +{extraPipelines} more
                      </span>
                    )}
                  </div>
                </td>

                {/* Match score (ring + tier pill only) */}
                <td className="align-top px-3 py-2 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <div className="flex flex-col items-center">
                      <ScoreRing
                        score={row.latestScore}
                        title={
                          row.latestScore != null
                            ? `Match score ${row.latestScore}`
                            : "Match score not set"
                        }
                      />
                      <span className="mt-1 text-[10px] text-slate-500">
                        Match score
                      </span>
                    </div>
                    {row.primaryTier && (
                      <span
                        className={[
                          "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold",
                          tierChipColor(row.primaryTier),
                        ].join(" ")}
                      >
                        {row.primaryTier.toUpperCase() === "A" && (
                          <span className="mr-1">★</span>
                        )}
                        Tier {row.primaryTier}
                      </span>
                    )}
                  </div>
                </td>

                {/* Latest role */}
                <td className="align-top px-3 py-2 text-[10px] text-slate-600">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-slate-900">
                      {row.latestJobTitle}
                    </span>
                    {row.latestClient && (
                      <span className="text-slate-500">
                        {row.latestClient}
                      </span>
                    )}
                  </div>
                </td>

                {/* Source */}
                <td className="align-top px-3 py-2 text-[10px] text-slate-600">
                  {row.source || "—"}
                </td>

                {/* Last seen */}
                <td className="align-top px-3 py-2 text-right text-[10px] text-slate-600">
                  {formatDateFromIso(row.lastSeen)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
