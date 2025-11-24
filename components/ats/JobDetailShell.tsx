// components/ats/JobDetailShell.tsx
import Link from "next/link";
import { ApplicationsSplitView } from "@/components/ats/ApplicationsSplitView";

type JobSummary = {
  id: string;
  title: string;
  department?: string | null;
  location?: string | null;
  employment_type?: string | null;
  seniority?: string | null;
  status?: string | null;
  visibility?: string | null;
  created_at?: string | Date | null;
  tags?: string[] | null;
};

type JobDetailShellProps = {
  job: JobSummary;
  applications: any[]; // pass through to ApplicationsSplitView
  onStatusChange?: (
    appId: string,
    newStatus: string,
    note?: string
  ) => Promise<void> | void;
  onScheduleInterview?: (
    appId: string,
    payload: {
      date: string;
      time: string;
      type: "onsite" | "remote" | "phone";
      location?: string;
      notes?: string;
    }
  ) => Promise<void> | void;
};

function formatDate(value?: string | Date | null) {
  if (!value) return "";
  const d = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
  });
}

export function JobDetailShell({
  job,
  applications,
  onStatusChange,
  onScheduleInterview,
}: JobDetailShellProps) {
  const total = applications.length;

  const statusCounts: Record<string, number> = applications.reduce(
    (acc: Record<string, number>, app: any) => {
      const key = (app.status || "applied") as string;
      acc[key] = (acc[key] ?? 0) + 1;
      return acc;
    },
    {}
  );

  const pipelineOrder: { key: string; label: string }[] = [
    { key: "applied", label: "Applied" },
    { key: "screening", label: "Screening" },
    { key: "interview", label: "Interview" },
    { key: "offer", label: "Offer" },
    { key: "rejected", label: "Rejected" },
  ];

  const statusLabel = job.status ?? "unspecified";
  const visibilityLabel = job.visibility ?? "unspecified";

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 space-y-6">
      <div className="flex items-center justify-between gap-3">
        <Link
          href="/ats/jobs"
          className="text-[11px] text-slate-500 hover:text-slate-700 hover:underline"
        >
          ← Back to jobs
        </Link>
        {job.id && (
          <p className="text-[11px] text-slate-400">
            Job ID: <span className="font-mono text-slate-500">{job.id}</span>
          </p>
        )}
      </div>

      {/* Job summary header */}
      <section className="rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1.5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
              Job overview
            </p>
            <h1 className="text-xl font-semibold text-slate-900">
              {job.title}
            </h1>
            {(job.department || job.location) && (
              <p className="text-[11px] text-slate-500">
                {job.department && <span>{job.department}</span>}
                {job.department && job.location && (
                  <span className="mx-1 text-slate-300">•</span>
                )}
                {job.location && <span>{job.location}</span>}
              </p>
            )}

            <div className="mt-2 flex flex-wrap gap-2 text-[10px]">
              <Badge
                label={`Status: ${statusLabel}`}
                tone={statusLabel === "open" ? "green" : "slate"}
              />
              <Badge
                label={`Visibility: ${visibilityLabel}`}
                tone={visibilityLabel === "public" ? "blue" : "slate"}
              />
              {job.seniority && (
                <Badge
                  label={job.seniority}
                  tone="amber"
                  soft
                  uppercase
                />
              )}
              {job.employment_type && (
                <Badge label={job.employment_type} tone="blue" soft />
              )}
              {job.created_at && (
                <Badge
                  label={`Created ${formatDate(job.created_at)}`}
                  tone="slate"
                  soft
                />
              )}
            </div>

            {job.tags && job.tags.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {job.tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center rounded-full bg-slate-50 px-2 py-0.5 text-[10px] font-medium text-slate-700"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* High-level metrics */}
          <div className="flex gap-3 text-[11px]">
            <StatBlock
              label="Total applications"
              value={total.toString()}
              accent="#172965"
            />
            <StatBlock
              label="In interview"
              value={(statusCounts["interview"] ?? 0).toString()}
              accent="#FFC000"
            />
            <StatBlock
              label="Offers made"
              value={(statusCounts["offer"] ?? 0).toString()}
              accent="#64C247"
            />
          </div>
        </div>

        {/* Pipeline breakdown chips */}
        {total > 0 && (
          <div className="mt-4 flex flex-wrap gap-1.5 text-[10px] text-slate-600">
            {pipelineOrder.map(({ key, label }) => {
              const count = statusCounts[key] ?? 0;
              if (!count) return null;
              return (
                <span
                  key={key}
                  className="inline-flex items-center gap-1 rounded-full bg-slate-50 px-2.5 py-0.5"
                >
                  <span className="font-medium">{label}</span>
                  <span className="rounded-full bg-slate-200 px-1.5 py-0.5 text-[9px] font-semibold text-slate-700">
                    {count}
                  </span>
                </span>
              );
            })}
          </div>
        )}
      </section>

      {/* Pipeline & applications */}
      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <header className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
              Pipeline & applications
            </h2>
            <p className="mt-0.5 text-[11px] text-slate-500">
              Track candidates through applied, screening, interview, offer and
              decision stages.
            </p>
          </div>
        </header>

        <div className="px-3 pb-3 pt-2">
          <ApplicationsSplitView
            applications={applications as any}
            onStatusChange={onStatusChange}
            onScheduleInterview={onScheduleInterview}
          />
        </div>
      </section>
    </main>
  );
}

function Badge({
  label,
  tone,
  soft,
  uppercase,
}: {
  label: string;
  tone: "green" | "blue" | "amber" | "slate";
  soft?: boolean;
  uppercase?: boolean;
}) {
  const map: Record<
    typeof tone,
    { bg: string; text: string; border: string }
  > = {
    green: {
      bg: soft ? "bg-emerald-50" : "bg-emerald-100",
      text: "text-emerald-800",
      border: "border-emerald-100",
    },
    blue: {
      bg: soft ? "bg-blue-50" : "bg-blue-100",
      text: "text-blue-800",
      border: "border-blue-100",
    },
    amber: {
      bg: soft ? "bg-amber-50" : "bg-amber-100",
      text: "text-amber-800",
      border: "border-amber-100",
    },
    slate: {
      bg: soft ? "bg-slate-50" : "bg-slate-100",
      text: "text-slate-700",
      border: "border-slate-100",
    },
  };

  const cfg = map[tone];

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] ${
        cfg.bg
      } ${cfg.text} ${cfg.border} ${uppercase ? "uppercase tracking-wide" : ""}`}
    >
      {label}
    </span>
  );
}

function StatBlock({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent: string;
}) {
  return (
    <div className="flex min-w-[96px] flex-col items-end rounded-xl border border-slate-100 bg-slate-50/60 px-3 py-2 text-right">
      <span className="text-[10px] text-slate-500">{label}</span>
      <span
        className="mt-1 text-lg font-semibold"
        style={{ color: accent }}
      >
        {value}
      </span>
    </div>
  );
}
