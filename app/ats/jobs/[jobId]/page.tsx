import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import {
  ApplicationsSplitView,
  type ApplicationStatus,
} from "@/components/ats/ApplicationsSplitView";

export const dynamic = "force-dynamic";

type JobRow = {
  id: string;
  title: string;
  department: string | null;
  location: string | null;
  employment_type: string | null;
  seniority: string | null;
  status: string;
  visibility: string;
  created_at: string;
};

type Application = {
  id: string;
  fullName: string;
  email: string;
  status: ApplicationStatus;
  appliedAt: string;
  location?: string;
  cvUrl?: string;
  phone?: string;
  timeline?: { label: string; at: string }[];
};

export async function generateMetadata({
  params,
}: {
  params: { jobId: string };
}): Promise<Metadata> {
  const { jobId } = params;

  const { data } = await supabaseAdmin
    .from("jobs")
    .select("title")
    .eq("id", jobId)
    .maybeSingle();

  return {
    title: data?.title
      ? `${data.title} | ATS job – Resourcin`
      : "ATS job | Resourcin",
  };
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
  });
}

function formatEmploymentType(value: string | null) {
  if (!value) return null;
  const lower = value.toLowerCase();
  if (lower === "full-time" || lower === "full_time") return "Full-time";
  if (lower === "part-time" || lower === "part_time") return "Part-time";
  if (lower === "contract") return "Contract";
  if (lower === "internship") return "Internship";
  return value;
}

function deriveWorkMode(job: JobRow): string | null {
  const loc = (job.location || "").toLowerCase();

  if (loc.includes("remote")) return "Remote";
  if (loc.includes("hybrid")) return "Hybrid";
  if (loc.includes("flexible")) return "Flexible";
  if (loc.includes("on-site") || loc.includes("onsite")) return "On-site";

  return null;
}

export default async function AtsJobDetailPage({
  params,
}: {
  params: { jobId: string };
}) {
  const { jobId } = params;

  // 1) Load job
  const { data: jobData, error: jobError } = await supabaseAdmin
    .from("jobs")
    .select(
      `
      id,
      title,
      department,
      location,
      employment_type,
      seniority,
      status,
      visibility,
      created_at
    `
    )
    .eq("id", jobId)
    .single<JobRow>();

  if (jobError || !jobData) {
    console.error("ATS job detail – error loading job:", jobError);
    notFound();
  }

  const job = jobData;

  // 2) Load applications for this job
  const { data: appsData, error: appsError } = await supabaseAdmin
    .from("job_applications")
    .select(
      `
      id,
      full_name,
      email,
      phone,
      location,
      cv_url,
      status,
      created_at
    `
    )
    .eq("job_id", job.id)
    .order("created_at", { ascending: true });

  if (appsError) {
    console.error("ATS job detail – error loading applications:", appsError);
  }

  const rawApps = appsData ?? [];

  const allowedStatuses: ApplicationStatus[] = [
    "applied",
    "screening",
    "interview",
    "offer",
    "rejected",
  ];

  const applications: Application[] = rawApps.map((row: any) => {
    const rawStatus = (row.status as string | null) ?? "applied";
    const safeStatus = allowedStatuses.includes(
      rawStatus as ApplicationStatus
    )
      ? (rawStatus as ApplicationStatus)
      : "applied";

    return {
      id: row.id,
      fullName: row.full_name ?? "Unnamed candidate",
      email: row.email ?? "",
      status: safeStatus,
      appliedAt: row.created_at ?? new Date().toISOString(),
      location: row.location ?? undefined,
      cvUrl: row.cv_url ?? undefined,
      phone: row.phone ?? undefined,
      timeline: [], // future: plug in real timeline events
    };
  });

  const totalApplications = applications.length;
  const lastAppliedAt =
    totalApplications > 0
      ? applications[applications.length - 1].appliedAt
      : null;

  const statusBuckets: Record<ApplicationStatus, number> = {
    applied: 0,
    screening: 0,
    interview: 0,
    offer: 0,
    rejected: 0,
  };
  for (const app of applications) {
    statusBuckets[app.status] += 1;
  }

  const employmentTypeLabel = formatEmploymentType(job.employment_type);
  const workModeLabel = deriveWorkMode(job);

  const isConfidential = job.visibility === "confidential";
  const isInternalOnly = job.visibility === "internal";

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-4 flex items-center justify-between gap-2">
        <Link
          href="/ats/jobs"
          className="text-[11px] text-slate-500 hover:text-slate-700 hover:underline"
        >
          ← Back to all ATS jobs
        </Link>
      </div>

      {/* Job header / cockpit summary */}
      <section className="mb-6 rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1.5">
            <h1 className="text-lg font-semibold text-slate-900">
              {job.title}
            </h1>
            <p className="text-[11px] text-slate-600">
              {isConfidential
                ? "Confidential client"
                : job.department || "Client role"}
              {isInternalOnly && " • Internal only"}
            </p>

            <div className="mt-1 flex flex-wrap gap-2 text-[11px]">
              {job.location && (
                <span className="inline-flex items-center gap-1 rounded-full bg-slate-50 px-2.5 py-0.5 text-slate-700">
                  <span
                    className="inline-block h-2 w-2 rounded-full"
                    style={{ backgroundColor: "#EF4444" }} // red pin
                    aria-hidden="true"
                  />
                  {job.location}
                </span>
              )}
              {workModeLabel && (
                <span className="inline-flex items-center gap-1 rounded-full bg-slate-50 px-2.5 py-0.5 text-slate-700">
                  <span className="text-[11px]">🌐</span>
                  {workModeLabel}
                </span>
              )}
              {employmentTypeLabel && (
                <span className="inline-flex items-center gap-1 rounded-full bg-slate-50 px-2.5 py-0.5 text-slate-700">
                  <span
                    className="inline-block h-2.5 w-3 rounded-[3px]"
                    style={{ backgroundColor: "#92400E" }} // brown briefcase
                    aria-hidden="true"
                  />
                  {employmentTypeLabel}
                </span>
              )}
              {job.seniority && (
                <span className="inline-flex items-center gap-1 rounded-full bg-slate-50 px-2.5 py-0.5 text-slate-700">
                  <span className="text-[11px]">★</span>
                  {job.seniority}
                </span>
              )}
            </div>

            <p className="mt-1 text-[11px] text-slate-500">
              Created {formatDate(job.created_at)} • Status:{" "}
              <span className="font-medium text-slate-700">{job.status}</span>{" "}
              • Visibility:{" "}
              <span className="font-medium text-slate-700">
                {job.visibility}
              </span>
            </p>
          </div>

          {/* Simple stats */}
          <div className="grid grid-cols-3 gap-2 text-center text-[11px] sm:text-right">
            <div className="rounded-xl bg-slate-50 px-3 py-2">
              <p className="text-[10px] text-slate-500">Total apps</p>
              <p className="mt-0.5 text-base font-semibold text-slate-900">
                {totalApplications}
              </p>
            </div>
            <div className="rounded-xl bg-slate-50 px-3 py-2">
              <p className="text-[10px] text-slate-500">In pipeline</p>
              <p className="mt-0.5 text-base font-semibold text-slate-900">
                {statusBuckets.applied +
                  statusBuckets.screening +
                  statusBuckets.interview}
              </p>
            </div>
            <div className="rounded-xl bg-slate-50 px-3 py-2">
              <p className="text-[10px] text-slate-500">Last activity</p>
              <p className="mt-0.5 text-[11px] font-medium text-slate-800">
                {lastAppliedAt ? formatDate(lastAppliedAt) : "—"}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Applications split view */}
      <section>
        <ApplicationsSplitView applications={applications} />
      </section>
    </main>
  );
}
