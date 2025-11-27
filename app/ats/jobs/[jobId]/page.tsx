// app/ats/jobs/[jobId]/page.tsx
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getResourcinTenant } from "@/lib/tenant";

export const dynamic = "force-dynamic";

interface JobPageProps {
  params: { jobId: string };
}

function formatDate(value: string | Date | null | undefined) {
  if (!value) return "";
  const d = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
  });
}

function formatMoney(amount: any, currency: string | null | undefined) {
  if (amount == null) return "";
  const n =
    typeof amount === "number"
      ? amount
      : Number((amount as any).toString ? (amount as any).toString() : amount);

  if (!Number.isFinite(n)) return "";

  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: currency || "NGN",
      maximumFractionDigits: 0,
    }).format(n);
  } catch {
    return `${currency || ""} ${n.toLocaleString()}`;
  }
}

function titleCaseFromEnum(value?: string | null) {
  if (!value) return "";
  return value
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatEmploymentType(value?: string | null) {
  if (!value) return "";
  const map: Record<string, string> = {
    full_time: "Full Time",
    part_time: "Part Time",
    contract: "Contract",
    temporary: "Temporary",
    internship: "Internship",
    consulting: "Consulting / Advisory",
  };
  const key = value.toLowerCase();
  return map[key] || titleCaseFromEnum(value);
}

function formatExperienceLevel(value?: string | null) {
  if (!value) return "";
  const map: Record<string, string> = {
    entry: "Entry level / Graduate",
    junior: "Junior (1–3 years)",
    mid: "Mid-level (3–7 years)",
    senior: "Senior (7–12 years)",
    lead_principal: "Lead / Principal",
    manager_head: "Manager / Head of",
    director_vp: "Director / VP",
    c_level_partner: "C-level / Partner",
  };
  const key = value.toLowerCase();
  return map[key] || titleCaseFromEnum(value);
}

function formatWorkMode(value?: string | null) {
  if (!value) return "";
  const map: Record<string, string> = {
    onsite: "Onsite",
    hybrid: "Hybrid",
    remote: "Remote",
    field_based: "Field-based",
  };
  const key = value.toLowerCase();
  return map[key] || titleCaseFromEnum(value);
}

function formatStatus(value?: string | null) {
  if (!value) return "";
  const key = value.toLowerCase();
  if (key === "open") return "Open";
  if (key === "draft") return "Draft";
  if (key === "closed") return "Closed";
  return titleCaseFromEnum(value);
}

function formatVisibility(value?: string | null) {
  if (!value) return "";
  const key = value.toLowerCase();
  if (key === "public") return "Public";
  if (key === "internal") return "Internal";
  return titleCaseFromEnum(value);
}

function formatStageName(value: string) {
  const key = value.toUpperCase();
  const map: Record<string, string> = {
    APPLIED: "Applied",
    SCREEN: "Screen",
    SCREENING: "Screening",
    SHORTLISTED: "Shortlisted",
    INTERVIEW: "Interview",
    INTERVIEWING: "Interviewing",
    OFFER: "Offer",
    OFFERED: "Offered",
    HIRED: "Hired",
    REJECTED: "Rejected",
    WITHDRAWN: "Withdrawn",
  };
  if (map[key]) return map[key];
  return titleCaseFromEnum(value);
}

type StageDisplay = {
  id: string;
  name: string;
  isTerminal?: boolean;
};

export default async function AtsJobDetailPage({ params }: JobPageProps) {
  const tenant = await getResourcinTenant();

  if (!tenant) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-10">
        <h1 className="text-xl font-semibold text-slate-900">
          ATS job not available
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          No default tenant configured. Check{" "}
          <code className="rounded bg-slate-100 px-1 py-0.5 text-[11px]">
            RESOURCIN_TENANT_ID
          </code>{" "}
          or{" "}
          <code className="rounded bg-slate-100 px-1 py-0.5 text-[11px]">
            RESOURCIN_TENANT_SLUG
          </code>{" "}
          in your environment.
        </p>
      </div>
    );
  }

  const job = await prisma.job.findFirst({
    where: {
      id: params.jobId,
      tenantId: tenant.id,
    },
    include: {
      clientCompany: true,
      stages: {
        orderBy: { position: "asc" },
      },
      applications: {
        orderBy: { createdAt: "desc" },
        include: {
          candidate: true,
        },
      },
    },
  });

  if (!job) {
    notFound();
  }

  // Group applications by stage
  const applicationsByStage = new Map<string, any[]>();
  for (const app of job.applications) {
    const rawStage = app.stage || "APPLIED";
    const key = rawStage.toUpperCase();
    const bucket = applicationsByStage.get(key) ?? [];
    bucket.push(app);
    applicationsByStage.set(key, bucket);
  }

  const stagesForDisplay: StageDisplay[] =
    job.stages.length > 0
      ? job.stages.map((s) => ({
          id: s.id,
          name: s.name,
          isTerminal: s.isTerminal,
        }))
      : applicationsByStage.size > 0
      ? Array.from(applicationsByStage.keys()).map((name, index) => ({
          id: `${index}-${name}`,
          name,
        }))
      : [
          {
            id: "applied",
            name: "APPLIED",
          },
        ];

  const totalApplications = job.applications.length;

  // Use stage names as options, but store/compare as UPPERCASE codes
  const stageOptions = stagesForDisplay.map((stage) =>
    stage.name.toUpperCase(),
  );

  const workModeValue = job.workMode || job.locationType || null;
  const employmentTypeLabel = formatEmploymentType(job.employmentType);
  const experienceLevelLabel = formatExperienceLevel(job.experienceLevel);
  const workModeLabel = formatWorkMode(workModeValue);

  const statusLabel = formatStatus(job.status);
  const visibilityLabel = formatVisibility(job.visibility);

  const salaryMinLabel = formatMoney(job.salaryMin, job.salaryCurrency || "NGN");
  const salaryMaxLabel = formatMoney(job.salaryMax, job.salaryCurrency || "NGN");
  const hasSalary = salaryMinLabel || salaryMaxLabel;

  const publicJobUrl =
    job.slug && job.visibility === "public" && job.status === "open"
      ? `/jobs/${encodeURIComponent(job.slug)}`
      : null;

  const clientLabel =
    job.clientCompany?.name ?? "Resourcin (internal role / no client set)";

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 lg:px-0">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link
            href="/ats/jobs"
            className="inline-flex items-center text-xs font-medium text-slate-500 hover:text-slate-800"
          >
            <span className="mr-1.5">←</span>
            Back to ATS jobs
          </Link>
          <h1 className="mt-3 text-2xl font-semibold text-slate-900">
            {job.title}
          </h1>
          <p className="mt-1 text-xs text-slate-600">
            {clientLabel}
            {job.location ? ` · ${job.location}` : ""}
          </p>
        </div>

        <div className="flex flex-col items-end gap-2">
          <div className="flex flex-wrap justify-end gap-2">
            <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-medium text-slate-700">
              {statusLabel}
            </span>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-medium text-slate-700">
              {visibilityLabel}
            </span>
            {job.internalOnly && (
              <span className="rounded-full bg-amber-50 px-3 py-1 text-[11px] font-medium text-amber-800">
                Internal only
              </span>
            )}
            {job.confidential && (
              <span className="rounded-full bg-rose-50 px-3 py-1 text-[11px] font-medium text-rose-800">
                Confidential
              </span>
            )}
          </div>

          {publicJobUrl && (
            <Link
              href={publicJobUrl}
              target="_blank"
              className="inline-flex items-center rounded-full bg-[#172965] px-4 py-1.5 text-[11px] font-semibold text-white shadow-sm hover:bg-[#0f1c45]"
            >
              View public page
              <span className="ml-1.5 text-[10px] opacity-80">↗</span>
            </Link>
          )}
        </div>
      </div>

      {/* Summary + pipeline */}
      <div className="mb-6 grid gap-4 md:grid-cols-[minmax(0,2fr)_minmax(0,1.5fr)] md:gap-6">
        {/* Job summary */}
        <section className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-900">Role summary</h2>
          <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-2 text-[11px] text-slate-600">
            <div>
              <dt className="font-medium text-slate-500">Client</dt>
              <dd className="mt-0.5 text-slate-800">{clientLabel}</dd>
            </div>
            <div>
              <dt className="font-medium text-slate-500">Location</dt>
              <dd className="mt-0.5 text-slate-800">
                {job.location || "Not specified"}
              </dd>
            </div>
            <div>
              <dt className="font-medium text-slate-500">Work mode</dt>
              <dd className="mt-0.5 text-slate-800">
                {workModeLabel || "Not specified"}
              </dd>
            </div>
            <div>
              <dt className="font-medium text-slate-500">Employment type</dt>
              <dd className="mt-0.5 text-slate-800">
                {employmentTypeLabel || "Not specified"}
              </dd>
            </div>
            <div>
              <dt className="font-medium text-slate-500">Experience level</dt>
              <dd className="mt-0.5 text-slate-800">
                {experienceLevelLabel || "Not specified"}
              </dd>
            </div>
            <div>
              <dt className="font-medium text-slate-500">Created</dt>
              <dd className="mt-0.5 text-slate-800">
                {formatDate(job.createdAt)}
              </dd>
            </div>
            {hasSalary && (
              <div className="col-span-2">
                <dt className="font-medium text-slate-500">Salary band</dt>
                <dd className="mt-0.5 text-slate-800">
                  {salaryMinLabel && salaryMaxLabel
                    ? `${salaryMinLabel} – ${salaryMaxLabel}`
                    : salaryMinLabel || salaryMaxLabel}
                  {!job.salaryVisible && hasSalary && (
                    <span className="ml-1 text-[10px] text-slate-500">
                      (internal only)
                    </span>
                  )}
                </dd>
              </div>
            )}
          </dl>
        </section>

        {/* Pipeline summary */}
        <section className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-sm font-semibold text-slate-900">Pipeline</h2>
            <p className="text-[11px] text-slate-500">
              {totalApplications}{" "}
              {totalApplications === 1 ? "application" : "applications"}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {stagesForDisplay.map((stage) => {
              const key = stage.name.toUpperCase();
              const count = applicationsByStage.get(key)?.length ?? 0;
              const isTerminal = !!stage.isTerminal;
              return (
                <div
                  key={stage.id}
                  className={`flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] ${
                    isTerminal
                      ? "border-slate-200 bg-slate-50 text-slate-700"
                      : "border-slate-200 bg-slate-50 text-slate-800"
                  }`}
                >
                  <span className="font-medium">
                    {formatStageName(stage.name)}
                  </span>
                  <span className="rounded-full bg-white px-1.5 py-0.5 text-[10px] font-semibold text-slate-800">
                    {count}
                  </span>
                </div>
              );
            })}
          </div>
          <p className="mt-1 text-[10px] text-slate-500">
            You can now move candidates between stages directly from the
            applications table below. Later this page will host drag-and-drop
            moves, email triggers and notes across stages.
          </p>
        </section>
      </div>

      {/* Narrative (overview, responsibilities, etc.) */}
      <section className="mb-6 grid gap-4 md:grid-cols-2 md:gap-6">
        <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-900">
            Role narrative
          </h2>
          {job.overview && (
            <div className="space-y-1">
              <h3 className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
                Overview
              </h3>
              <p className="whitespace-pre-line text-xs text-slate-800">
                {job.overview}
              </p>
            </div>
          )}
          {job.aboutClient && (
            <div className="space-y-1">
              <h3 className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
                About the client
              </h3>
              <p className="whitespace-pre-line text-xs text-slate-800">
                {job.aboutClient}
              </p>
            </div>
          )}
        </div>

        <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-900">
            Responsibilities & requirements
          </h2>
          {job.responsibilities && (
            <div className="space-y-1">
              <h3 className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
                Responsibilities
              </h3>
              <p className="whitespace-pre-line text-xs text-slate-800">
                {job.responsibilities}
              </p>
            </div>
          )}
          {job.requirements && (
            <div className="space-y-1">
              <h3 className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
                Requirements
              </h3>
              <p className="whitespace-pre-line text-xs text-slate-800">
                {job.requirements}
              </p>
            </div>
          )}
          {job.benefits && (
            <div className="space-y-1">
              <h3 className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
                Benefits
              </h3>
              <p className="whitespace-pre-line text-xs text-slate-800">
                {job.benefits}
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Applications table with stage-change controls */}
      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="mb-3 flex items-center justify-between gap-2">
          <h2 className="text-sm font-semibold text-slate-900">Applications</h2>
          <p className="text-[11px] text-slate-500">
            {totalApplications === 0
              ? "No applications yet."
              : `${totalApplications} ${
                  totalApplications === 1 ? "application" : "applications"
                }`}
          </p>
        </div>

        {totalApplications === 0 ? (
          <p className="text-[11px] text-slate-500">
            Once candidates apply (or you add them manually), they’ll appear
            here with stage, status and basic details.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-[11px] text-slate-700">
              <thead className="border-b border-slate-200 bg-slate-50 text-[10px] uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-3 py-2">Candidate</th>
                  <th className="px-3 py-2">Stage</th>
                  <th className="px-3 py-2">Change stage</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2">Location</th>
                  <th className="px-3 py-2">Source</th>
                  <th className="px-3 py-2">Applied</th>
                </tr>
              </thead>
              <tbody>
                {job.applications.map((app) => {
                  const candidateName =
                    app.fullName ||
                    app.candidate?.fullName ||
                    "Unnamed candidate";
                  const candidateEmail =
                    (app as any).email || app.candidate?.email || "";
                  const stageLabel = formatStageName(app.stage || "APPLIED");
                  const statusLabel = titleCaseFromEnum(
                    app.status || "PENDING",
                  );

                  const locationLabel =
                    app.location || app.candidate?.location || "—";

                  const currentStageCode = (app.stage || "APPLIED").toUpperCase();

                  return (
                    <tr
                      key={app.id}
                      className="border-b border-slate-100 last:border-0"
                    >
                      <td className="px-3 py-2 align-top">
                        <div className="flex flex-col">
                          <span className="text-xs font-medium text-slate-900">
                            {candidateName}
                          </span>
                          {candidateEmail && (
                            <span className="text-[10px] text-slate-500">
                              {candidateEmail}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-2 align-top">
                        <span className="inline-flex rounded-full bg-slate-50 px-2 py-0.5 text-[10px] font-medium text-slate-700">
                          {stageLabel}
                        </span>
                      </td>
                      <td className="px-3 py-2 align-top">
                        <form
                          method="POST"
                          action="/ats/applications"
                          className="flex items-center gap-1"
                        >
                          <input
                            type="hidden"
                            name="applicationId"
                            value={app.id}
                          />
                          <input type="hidden" name="jobId" value={job.id} />
                          <input
                            type="hidden"
                            name="tenantId"
                            value={job.tenantId}
                          />

                          <select
                            name="newStage"
                            defaultValue={currentStageCode}
                            className="max-w-[150px] rounded-md border border-slate-200 bg-white px-2 py-1 text-[10px] text-slate-900 outline-none ring-0 focus:border-[#172965] focus:ring-1 focus:ring-[#172965]"
                          >
                            {stageOptions.map((code) => (
                              <option key={code} value={code}>
                                {formatStageName(code)}
                              </option>
                            ))}
                          </select>

                          <button
                            type="submit"
                            className="rounded-md bg-[#172965] px-2 py-1 text-[10px] font-medium text-white hover:bg-[#0f1c45]"
                          >
                            Update
                          </button>
                        </form>
                      </td>
                      <td className="px-3 py-2 align-top">
                        <span className="inline-flex rounded-full bg-slate-50 px-2 py-0.5 text-[10px] font-medium text-slate-700">
                          {statusLabel}
                        </span>
                      </td>
                      <td className="px-3 py-2 align-top">
                        <span className="text-[11px] text-slate-700">
                          {locationLabel}
                        </span>
                      </td>
                      <td className="px-3 py-2 align-top">
                        <span className="text-[11px] text-slate-700">
                          {app.source || "—"}
                        </span>
                      </td>
                      <td className="px-3 py-2 align-top">
                        <span className="text-[11px] text-slate-700">
                          {formatDate(app.createdAt)}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
