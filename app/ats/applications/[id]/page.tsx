// app/ats/applications/[id]/page.tsx
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getResourcinTenant } from "@/lib/tenant";

export const dynamic = "force-dynamic";

interface ApplicationPageProps {
  params: { id: string };
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

function titleCaseFromEnum(value?: string | null) {
  if (!value) return "";
  return value
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatStageName(value?: string | null) {
  if (!value) return "Applied";
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

function formatStatus(value?: string | null) {
  if (!value) return "Pending";
  const key = value.toLowerCase();
  if (key === "pending") return "Pending";
  if (key === "in_review") return "In review";
  if (key === "rejected") return "Rejected";
  if (key === "hired") return "Hired";
  return titleCaseFromEnum(value);
}

function formatEmploymentType(value?: string | null) {
  if (!value) return "";
  const key = value.toLowerCase();
  const map: Record<string, string> = {
    full_time: "Full Time",
    "full-time": "Full Time",
    "full time": "Full Time",
    fulltime: "Full Time",
    part_time: "Part Time",
    "part-time": "Part Time",
    "part time": "Part Time",
    internship: "Internship",
    contract: "Contract",
    temporary: "Temporary",
    consulting: "Consulting / Advisory",
  };
  return map[key] || titleCaseFromEnum(value);
}

function formatWorkMode(value?: string | null) {
  if (!value) return "";
  const key = value.toLowerCase();
  const map: Record<string, string> = {
    onsite: "Onsite",
    hybrid: "Hybrid",
    remote: "Remote",
    "field-based": "Field-based",
    field_based: "Field-based",
  };
  return map[key] || titleCaseFromEnum(value);
}

function formatExperienceLevel(value?: string | null) {
  if (!value) return "";
  const key = value.toLowerCase();
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
  return map[key] || titleCaseFromEnum(value);
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

export default async function ApplicationDetailPage({
  params,
}: ApplicationPageProps) {
  const tenant = await getResourcinTenant();

  if (!tenant) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-10">
        <h1 className="text-xl font-semibold text-slate-900">
          ATS application not available
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

  // ✅ Fetch the application directly, but tenant-safely via job.tenantId
  const application = await prisma.jobApplication.findFirst({
    where: {
      id: params.id,
      job: { tenantId: tenant.id },
    },
    include: {
      candidate: true,
      job: {
        include: {
          clientCompany: true,
          stages: { orderBy: { position: "asc" } },
        },
      },
      scoringEvents: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  });

  if (!application) notFound();

  const appAny = application as any;
  const candidateAny = (application.candidate ?? null) as any;

  const job = application.job;
  if (!job) notFound();

  const candidateName =
    application.fullName ||
    application.candidate?.fullName ||
    "Unnamed candidate";
  const candidateEmail = appAny.email || application.candidate?.email || "";
  const candidatePhone = appAny.phone || application.candidate?.phone || "";
  const candidateLocation =
    application.location ||
    application.candidate?.location ||
    "Not specified";

  const stageLabel = formatStageName(application.stage || "APPLIED");
  const statusLabel = formatStatus(application.status || "PENDING");

  const linkedinUrl =
    appAny.linkedinUrl || appAny.linkedin || application.candidate?.linkedinUrl;

  const portfolioUrl =
    appAny.portfolioUrl ||
    appAny.website ||
    candidateAny?.portfolioUrl ||
    candidateAny?.website ||
    candidateAny?.cvUrl ||
    null;

  const resumeUrl =
    appAny.resumeUrl || appAny.cvUrl || candidateAny?.resumeUrl || candidateAny?.cvUrl || null;

  const source = application.source || "Not specified";
  const appliedAt = formatDate(application.createdAt);

  const employmentTypeLabel = formatEmploymentType(job.employmentType);
  const workModeValue = job.workMode || job.locationType || null;
  const workModeLabel = formatWorkMode(workModeValue);
  const experienceLevelLabel = formatExperienceLevel(job.experienceLevel);

  const salaryMinLabel = formatMoney(job.salaryMin, job.salaryCurrency || "NGN");
  const salaryMaxLabel = formatMoney(job.salaryMax, job.salaryCurrency || "NGN");
  const hasSalary = salaryMinLabel || salaryMaxLabel;

  const clientLabel =
    job.clientCompany?.name ?? "Resourcin (internal role / no client set)";

  const publicJobUrl =
    job.slug && job.visibility === "public" && job.status === "open"
      ? `/jobs/${encodeURIComponent(job.slug)}`
      : null;

  const stageNames =
    job.stages.length > 0
      ? job.stages.map((s) => s.name)
      : ["APPLIED", "SCREEN", "INTERVIEW", "OFFER", "HIRED"];

  const currentStageKey = (application.stage || "APPLIED").toUpperCase();
  const currentStageIndex = stageNames.findIndex(
    (name) => name.toUpperCase() === currentStageKey,
  );

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 lg:px-0">
      {/* Breadcrumb + header */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
            <Link
              href="/ats/jobs"
              className="inline-flex items-center text-xs font-medium text-slate-500 hover:text-slate-800"
            >
              <span className="mr-1.5">←</span>
              Back to ATS jobs
            </Link>
            <span className="text-slate-300">/</span>
            <Link
              href={`/ats/jobs/${job.id}`}
              className="text-xs font-medium text-[#172965] hover:underline"
            >
              {job.title}
            </Link>
          </div>

          <h1 className="mt-3 text-2xl font-semibold text-slate-900">
            {candidateName}
          </h1>
          <p className="mt-1 text-xs text-slate-600">
            {clientLabel} · {job.title}
          </p>
        </div>

        <div className="flex flex-col items-end gap-2">
          <div className="flex flex-wrap justify-end gap-2">
            <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-medium text-slate-700">
              {stageLabel}
            </span>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-medium text-slate-700">
              {statusLabel}
            </span>
          </div>

          <form
            method="POST"
            action="/ats/applications/actions"
            className="flex flex-wrap items-center gap-2 text-[11px]"
          >
            <input type="hidden" name="jobId" value={job.id} />
            <input type="hidden" name="applicationId" value={application.id} />

            <label className="text-slate-500">
              Move to:
              <select
                name="newStage"
                defaultValue={application.stage || "APPLIED"}
                className="ml-1 rounded-md border border-slate-200 bg-white px-2 py-1 text-[11px] text-slate-900 outline-none ring-0 focus:border-[#172965] focus:ring-1 focus:ring-[#172965]"
              >
                {stageNames.map((s) => (
                  <option key={s} value={s}>
                    {formatStageName(s)}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="submit"
              className="inline-flex items-center rounded-md bg-[#172965] px-3 py-1.5 text-[11px] font-medium text-white hover:bg-[#12204d]"
            >
              Update stage
            </button>
          </form>
        </div>
      </div>

      {/* Top grid: candidate profile + application/job meta */}
      <div className="mb-6 grid gap-4 md:grid-cols-[minmax(0,2fr)_minmax(0,1.7fr)] md:gap-6">
        {/* Candidate profile */}
        <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-900">
            Candidate profile
          </h2>

          <div className="grid grid-cols-1 gap-3 text-[11px] text-slate-700 sm:grid-cols-2">
            <div>
              <h3 className="text-[10px] font-medium uppercase tracking-wide text-slate-500">
                Contact
              </h3>
              <div className="mt-1 space-y-1">
                {candidateEmail && (
                  <p>
                    <span className="text-slate-500">Email:</span>{" "}
                    <a
                      href={`mailto:${candidateEmail}`}
                      className="font-medium text-[#172965] hover:underline"
                    >
                      {candidateEmail}
                    </a>
                  </p>
                )}
                {candidatePhone && (
                  <p>
                    <span className="text-slate-500">Phone:</span>{" "}
                    <a
                      href={`tel:${candidatePhone}`}
                      className="font-medium text-[#172965] hover:underline"
                    >
                      {candidatePhone}
                    </a>
                  </p>
                )}
                <p>
                  <span className="text-slate-500">Location:</span>{" "}
                  <span className="font-medium text-slate-800">
                    {candidateLocation}
                  </span>
                </p>
              </div>
            </div>

            <div>
              <h3 className="text-[10px] font-medium uppercase tracking-wide text-slate-500">
                Links & résumé
              </h3>
              <div className="mt-1 space-y-1">
                {linkedinUrl && (
                  <p>
                    <span className="text-slate-500">LinkedIn:</span>{" "}
                    <a
                      href={linkedinUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="font-medium text-[#0A66C2] hover:underline"
                    >
                      View profile ↗
                    </a>
                  </p>
                )}
                {portfolioUrl && (
                  <p>
                    <span className="text-slate-500">Portfolio:</span>{" "}
                    <a
                      href={portfolioUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="font-medium text-[#172965] hover:underline"
                    >
                      View site ↗
                    </a>
                  </p>
                )}
                {resumeUrl && (
                  <p>
                    <span className="text-slate-500">Résumé/CV:</span>{" "}
                    <a
                      href={resumeUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="font-medium text-emerald-700 hover:underline"
                    >
                      Open file ↗
                    </a>
                  </p>
                )}
                {!linkedinUrl && !portfolioUrl && !resumeUrl && (
                  <p className="text-slate-500">
                    No external links or résumé URL stored.
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Cover letter / notes */}
          <div className="border-t border-slate-100 pt-3">
            <h3 className="text-[10px] font-medium uppercase tracking-wide text-slate-500">
              Cover letter / motivation
            </h3>
            {appAny.coverLetter ? (
              <p className="mt-1 whitespace-pre-line text-xs text-slate-800">
                {appAny.coverLetter}
              </p>
            ) : (
              <p className="mt-1 text-[11px] text-slate-500">
                No cover letter captured for this application.
              </p>
            )}
          </div>
        </section>

        {/* Application & job meta */}
        <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-sm font-semibold text-slate-900">
              Application overview
            </h2>
            <span className="text-[11px] text-slate-500">
              Applied {appliedAt || "—"}
            </span>
          </div>

          {/* Pipeline progress */}
          <div>
            <h3 className="text-[10px] font-medium uppercase tracking-wide text-slate-500">
              Pipeline stage
            </h3>
            <div className="mt-2 flex items-center gap-2">
              <div className="flex flex-1 items-center gap-1">
                {stageNames.map((stageName, index) => {
                  const isActive = index <= currentStageIndex;
                  const isCurrent = index === currentStageIndex;
                  return (
                    <div key={stageName} className="flex flex-1 items-center gap-1">
                      <div
                        className={`flex h-6 min-w-[0] flex-1 items-center justify-center rounded-full border px-2 text-[10px] ${
                          isCurrent
                            ? "border-[#172965] bg-[#172965] text-white"
                            : isActive
                            ? "border-[#C5D2F5] bg-[#E1E7FF] text-[#172965]"
                            : "border-slate-200 bg-slate-50 text-slate-600"
                        }`}
                      >
                        <span className="truncate">{formatStageName(stageName)}</span>
                      </div>
                      {index < stageNames.length - 1 && (
                        <div className="h-px flex-1 bg-slate-200" />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Job summary */}
          <div className="border-t border-slate-100 pt-3">
            <h3 className="text-[10px] font-medium uppercase tracking-wide text-slate-500">
              Role summary
            </h3>
            <div className="mt-2 space-y-1 text-[11px] text-slate-700">
              <p className="font-medium text-slate-900">{job.title}</p>
              <p>
                <span className="text-slate-500">Client:</span>{" "}
                <span className="font-medium text-slate-800">{clientLabel}</span>
              </p>
              {job.location && (
                <p>
                  <span className="text-slate-500">Location:</span>{" "}
                  <span className="font-medium text-slate-800">{job.location}</span>
                </p>
              )}
              {workModeLabel && (
                <p>
                  <span className="text-slate-500">Work mode:</span>{" "}
                  <span className="font-medium text-slate-800">{workModeLabel}</span>
                </p>
              )}
              {employmentTypeLabel && (
                <p>
                  <span className="text-slate-500">Type:</span>{" "}
                  <span className="font-medium text-slate-800">{employmentTypeLabel}</span>
                </p>
              )}
              {experienceLevelLabel && (
                <p>
                  <span className="text-slate-500">Level:</span>{" "}
                  <span className="font-medium text-slate-800">{experienceLevelLabel}</span>
                </p>
              )}
              {hasSalary && (
                <p>
                  <span className="text-slate-500">Salary band:</span>{" "}
                  <span className="font-medium text-slate-800">
                    {salaryMinLabel && salaryMaxLabel
                      ? `${salaryMinLabel} – ${salaryMaxLabel}`
                      : salaryMinLabel || salaryMaxLabel}
                    {!job.salaryVisible && (
                      <span className="ml-1 text-[10px] text-slate-500">
                        (internal only)
                      </span>
                    )}
                  </span>
                </p>
              )}
              <p>
                <span className="text-slate-500">Source:</span>{" "}
                <span className="font-medium text-slate-800">{source}</span>
              </p>
            </div>

            <div className="mt-3 flex flex-wrap gap-2 text-[11px]">
              <Link
                href={`/ats/jobs/${job.id}`}
                className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 font-medium text-slate-800 hover:border-slate-300 hover:bg-slate-100"
              >
                View job in ATS
              </Link>
              {publicJobUrl && (
                <Link
                  href={publicJobUrl}
                  target="_blank"
                  className="inline-flex items-center rounded-full bg-[#172965] px-3 py-1.5 font-medium text-white shadow-sm hover:bg-[#0f1c45]"
                >
                  View public role
                  <span className="ml-1.5 text-[10px] opacity-80">↗</span>
                </Link>
              )}
            </div>
          </div>
        </section>
      </div>

      {/* Future: timeline / notes */}
      <section className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 p-4 text-[11px] text-slate-600">
        <h2 className="text-sm font-semibold text-slate-900">
          Activity & notes (future)
        </h2>
        <p className="mt-1">
          This section can later host interview feedback, internal notes,
          emails, and a full activity timeline for this candidate.
        </p>
        <p className="mt-1">
          For now, you can manage stage changes and review the core profile and
          role context above.
        </p>
      </section>
    </div>
  );
}
