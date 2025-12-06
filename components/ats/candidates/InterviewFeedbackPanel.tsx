// components/ats/candidates/InterviewFeedbackPanel.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const BASE_COMPETENCIES = [
  "Structured thinking & analysis",
  "Role-specific expertise",
  "Communication & clarity",
  "Leadership & ownership",
  "Culture & values alignment",
  "Drive, grit & follow-through",
];

type CompetencyRating = {
  id?: string;
  label: string;
  rating: number | null;
  comment: string;
};

type InterviewCompetencyDTO = {
  id: string;
  label: string;
  rating: number | null;
  comment: string | null;
};

type InterviewFeedbackPanelProps = {
  candidateId: string;
  interview: {
    id: string;
    scheduledAt: string;
    type: string | null;
    status: string | null;
    rating: number | null;
    ratingScaleMax: number | null;
    feedbackNotes: string | null;
    outcome: string | null;
    // included from Prisma: include: { competencies: true }
    competencies: InterviewCompetencyDTO[];
  };
};

const STATUS_LABELS: { value: string; label: string }[] = [
  { value: "SCHEDULED", label: "Scheduled" },
  { value: "COMPLETED", label: "Completed" },
  { value: "NO_SHOW", label: "No show" },
  { value: "CANCELLED_CLIENT", label: "Cancelled by client" },
  { value: "CANCELLED_CANDIDATE", label: "Cancelled by candidate" },
  { value: "CANCELLED_OTHER", label: "Cancelled (other)" },
];

function formatDateTime(value: string) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString(undefined, {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function Stars({
  value,
  max,
}: {
  value: number;
  max: number;
}) {
  return (
    <div className="inline-flex items-center gap-0.5 text-[11px]">
      {Array.from({ length: max }).map((_, idx) => {
        const n = idx + 1;
        const filled = n <= value;
        return (
          <span key={n} className={filled ? "text-amber-500" : "text-slate-300"}>
            ★
          </span>
        );
      })}
    </div>
  );
}

export default function InterviewFeedbackPanel({
  candidateId,
  interview,
}: InterviewFeedbackPanelProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const initialScale = interview.ratingScaleMax || 5;
  const initialStatus = interview.status || "SCHEDULED";

  const [status, setStatus] = useState<string>(initialStatus);
  const [ratingScaleMax, setRatingScaleMax] = useState<number>(initialScale);
  const [overallRating, setOverallRating] = useState<number | null>(
    interview.rating ?? null,
  );
  const [outcome, setOutcome] = useState<string>(interview.outcome ?? "");
  const [feedbackNotes, setFeedbackNotes] = useState<string>(
    interview.feedbackNotes ?? "",
  );

  const [competencies, setCompetencies] = useState<CompetencyRating[]>(() => {
    const byLabel = new Map<string, InterviewCompetencyDTO>();
    for (const c of interview.competencies || []) {
      byLabel.set(c.label, c);
    }

    return BASE_COMPETENCIES.map((label) => {
      const existing = byLabel.get(label);
      return {
        id: existing?.id,
        label,
        rating: existing?.rating ?? null,
        comment: existing?.comment ?? "",
      };
    });
  });

  const hasFeedback = overallRating !== null;

  const strengths = competencies.filter(
    (c) =>
      c.rating !== null &&
      ratingScaleMax > 0 &&
      c.rating >= Math.ceil(ratingScaleMax * 0.7),
  );

  const risks = competencies.filter(
    (c) =>
      c.rating !== null &&
      ratingScaleMax > 0 &&
      c.rating <= Math.floor(ratingScaleMax * 0.4),
  );

  function openDrawer() {
    setError(null);
    setOpen(true);
  }

  function closeDrawer() {
    if (submitting) return;
    setOpen(false);
  }

  function updateCompetency(
    index: number,
    field: keyof CompetencyRating,
    value: string | number | null,
  ) {
    setCompetencies((prev) => {
      const next = [...prev];
      const current = { ...next[index] };
      if (field === "rating") {
        current.rating =
          typeof value === "number" ? value : value ? Number(value) : null;
      } else if (field === "comment") {
        current.comment = (value as string) || "";
      } else if (field === "label") {
        current.label = (value as string) || "";
      }
      next[index] = current;
      return next;
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;

    // Basic validation – you said competencies grid shouldn’t be optional
    if (!overallRating || overallRating < 1) {
      setError("Please add an overall rating for this interview.");
      return;
    }

    const missingCompetencyRating = competencies.some(
      (c) => c.rating === null || c.rating <= 0,
    );

    if (missingCompetencyRating) {
      setError("Please rate all competencies before saving.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const payload = {
        interviewId: interview.id,
        status,
        rating: overallRating,
        ratingScaleMax,
        outcome: outcome.trim() || null,
        feedbackNotes: feedbackNotes.trim() || null,
        competencies: competencies.map((c) => ({
          label: c.label,
          rating: c.rating,
          comment: c.comment.trim() || null,
        })),
      };

      const res = await fetch("/api/ats/interviews", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok || !data.ok) {
        throw new Error(
          data?.error ||
            "Unable to save interview feedback. Please try again.",
        );
      }

      setOpen(false);
      router.refresh();
    } catch (err: any) {
      console.error("Error saving feedback", err);
      setError(
        err?.message ||
          "Something went wrong while saving interview feedback.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  const statusLabel =
    STATUS_LABELS.find((s) => s.value === (interview.status || "SCHEDULED"))
      ?.label || "Scheduled";

  const max = ratingScaleMax || 5;

  return (
    <>
      {/* Collapsed card on the candidate page */}
      <div className="rounded-xl border border-slate-200 bg-white/90 p-4 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold text-slate-900">
                Interview – {formatDateTime(interview.scheduledAt)}
              </span>
              <span
                className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium ${
                  interview.status === "COMPLETED"
                    ? "bg-emerald-50 text-emerald-800"
                    : interview.status === "NO_SHOW"
                    ? "bg-rose-50 text-rose-800"
                    : interview.status?.startsWith("CANCELLED")
                    ? "bg-amber-50 text-amber-800"
                    : "bg-slate-50 text-slate-700"
                }`}
              >
                {statusLabel}
              </span>
            </div>
            {hasFeedback ? (
              <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-600">
                <div className="inline-flex items-center gap-1">
                  <Stars value={overallRating!} max={max} />
                  <span className="font-medium text-slate-800">
                    {overallRating} / {max}
                  </span>
                </div>
                {outcome && (
                  <>
                    <span className="h-1 w-1 rounded-full bg-slate-300" />
                    <span className="italic">{outcome}</span>
                  </>
                )}
              </div>
            ) : (
              <p className="text-[11px] text-slate-500">
                No structured feedback yet – capture ratings and competencies
                after the interview.
              </p>
            )}

            {/* Strength / risk tags */}
            <div className="mt-1 flex flex-wrap gap-1.5">
              {strengths.map((c) => (
                <span
                  key={`strength-${c.label}`}
                  className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-800"
                >
                  {c.label}
                </span>
              ))}
              {risks.map((c) => (
                <span
                  key={`risk-${c.label}`}
                  className="inline-flex items-center rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-medium text-rose-800"
                >
                  {c.label}
                </span>
              ))}
            </div>

            {feedbackNotes && (
              <p className="mt-2 max-w-xl text-[11px] text-slate-700">
                {feedbackNotes}
              </p>
            )}
          </div>

          <div className="flex flex-col items-end gap-1 text-right">
            <button
              type="button"
              onClick={openDrawer}
              className="inline-flex h-8 items-center rounded-full border border-slate-200 bg-slate-50 px-3 text-[11px] font-medium text-slate-800 hover:border-slate-300 hover:bg-slate-100"
            >
              {hasFeedback ? "Edit feedback" : "Add feedback"}
            </button>
          </div>
        </div>
      </div>

      {/* Drawer */}
      {open && (
        <div className="fixed inset-0 z-40 flex">
          <div
            className="absolute inset-0 bg-slate-950/40"
            onClick={closeDrawer}
          />
          <div className="relative ml-auto flex h-full w-full max-w-xl flex-col bg-white shadow-2xl">
            <div className="flex items-start justify-between border-b border-slate-200 px-4 py-3">
              <div>
                <h2 className="text-sm font-semibold text-slate-900">
                  Interview feedback
                </h2>
                <p className="mt-0.5 text-[11px] text-slate-500">
                  {formatDateTime(interview.scheduledAt)}
                </p>
              </div>
              <button
                type="button"
                onClick={closeDrawer}
                className="rounded-full border border-slate-200 px-2 py-1 text-[11px] text-slate-500 hover:bg-slate-50"
              >
                Close
              </button>
            </div>

            <form
              onSubmit={handleSubmit}
              className="flex-1 space-y-4 overflow-y-auto px-4 py-4 text-xs text-slate-800"
            >
              {/* Lifecycle + rating header */}
              <div className="grid gap-3 sm:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
                <div className="space-y-1">
                  <label className="text-[11px] text-slate-500">
                    Interview status
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="h-8 w-full rounded-md border border-slate-200 bg-white px-2 text-[11px] text-slate-800"
                  >
                    {STATUS_LABELS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] text-slate-500">
                    Rating scale
                  </label>
                  <select
                    value={ratingScaleMax}
                    onChange={(e) =>
                      setRatingScaleMax(Number(e.target.value) || 5)
                    }
                    className="h-8 w-full rounded-md border border-slate-200 bg-white px-2 text-[11px] text-slate-800"
                  >
                    <option value={4}>1 – 4</option>
                    <option value={5}>1 – 5</option>
                  </select>
                </div>
              </div>

              {/* Overall rating */}
              <div className="space-y-1">
                <label className="text-[11px] text-slate-500">
                  Overall rating
                </label>
                <div className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-3 py-2">
                  <div className="inline-flex items-center gap-1">
                    {Array.from({ length: ratingScaleMax }).map((_, idx) => {
                      const n = idx + 1;
                      const active = overallRating !== null && n <= overallRating;
                      return (
                        <button
                          type="button"
                          key={n}
                          onClick={() => setOverallRating(n)}
                          className="text-lg leading-none"
                        >
                          <span
                            className={
                              active ? "text-amber-500" : "text-slate-300"
                            }
                          >
                            ★
                          </span>
                        </button>
                      );
                    })}
                  </div>
                  {overallRating && (
                    <span className="text-[11px] font-medium text-slate-800">
                      {overallRating} / {ratingScaleMax}
                    </span>
                  )}
                </div>
                <p className="text-[10px] text-slate-400">
                  1 = strong concern, {ratingScaleMax} = outstanding.
                </p>
              </div>

              {/* Outcome + notes */}
              <div className="grid gap-3 sm:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
                <div className="space-y-1">
                  <label className="text-[11px] text-slate-500">
                    Outcome / next step
                  </label>
                  <input
                    type="text"
                    value={outcome}
                    onChange={(e) => setOutcome(e.target.value)}
                    placeholder="e.g. Proceed to panel / Hold for pipeline / Reject"
                    className="h-8 w-full rounded-md border border-slate-200 bg-white px-2 text-[11px] text-slate-800"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] text-slate-500">
                    Overall notes
                  </label>
                  <textarea
                    value={feedbackNotes}
                    onChange={(e) => setFeedbackNotes(e.target.value)}
                    rows={3}
                    className="w-full rounded-md border border-slate-200 bg-white px-2 py-2 text-[11px] text-slate-800"
                    placeholder="Summarise strengths, risks and hiring recommendation…"
                  />
                </div>
              </div>

              {/* Competencies grid */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] text-slate-500">
                    Competencies (required)
                  </label>
                  <span className="text-[10px] text-slate-400">
                    These help validate notes and power candidate tags.
                  </span>
                </div>
                <div className="space-y-1.5">
                  {competencies.map((c, index) => (
                    <div
                      key={c.label}
                      className="grid gap-2 rounded-md border border-slate-200 bg-slate-50 px-2 py-2 text-[11px] sm:grid-cols-[minmax(0,1.1fr)_minmax(0,0.4fr)_minmax(0,1.1fr)]"
                    >
                      <div className="font-medium text-slate-800">
                        {c.label}
                      </div>
                      <div className="space-y-1">
                        <span className="text-[10px] text-slate-500">
                          Rating
                        </span>
                        <select
                          value={c.rating ?? ""}
                          onChange={(e) =>
                            updateCompetency(
                              index,
                              "rating",
                              e.target.value ? Number(e.target.value) : null,
                            )
                          }
                          className="h-7 w-full rounded-md border border-slate-200 bg-white px-2 text-[11px]"
                        >
                          <option value="">Select…</option>
                          {Array.from({ length: ratingScaleMax }).map(
                            (_, idx) => {
                              const n = idx + 1;
                              return (
                                <option key={n} value={n}>
                                  {n} / {ratingScaleMax}
                                </option>
                              );
                            },
                          )}
                        </select>
                      </div>
                      <div className="space-y-1">
                        <span className="text-[10px] text-slate-500">
                          Short note
                        </span>
                        <input
                          type="text"
                          value={c.comment}
                          onChange={(e) =>
                            updateCompetency(index, "comment", e.target.value)
                          }
                          placeholder="Optional colour / nuance for this area"
                          className="h-7 w-full rounded-md border border-slate-200 bg-white px-2 text-[11px]"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {error && (
                <p className="text-[11px] text-rose-600">{error}</p>
              )}

              <div className="mt-3 flex items-center justify-end gap-2 border-t border-slate-100 pt-3">
                <button
                  type="button"
                  onClick={closeDrawer}
                  disabled={submitting}
                  className="inline-flex h-8 items-center rounded-full border border-slate-200 px-3 text-[11px] text-slate-600 hover:bg-slate-50 disabled:opacity-60"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex h-8 items-center rounded-full bg-slate-900 px-4 text-[11px] font-semibold text-white hover:bg-slate-800 disabled:opacity-70"
                >
                  {submitting ? "Saving…" : "Save feedback"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
