// app/jobs/[jobIdOrSlug]/page.tsx
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import JobApplyForm from "./JobApplyForm";

export const dynamic = "force-dynamic";

interface JobPageProps {
  params: {
    jobIdOrSlug: string;
  };
}

function formatDate(value: string | Date | null | undefined) {
  if (!value) return "";
  const d = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function titleCaseFromEnum(value?: string | null) {
  if (!value) return "";
  return value
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
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

export default async function PublicJobPage({ params }: JobPageProps) {
  const { jobIdOrSlug } = params;

  // Load job by slug OR id, but only open + public roles
  const job = await prisma.job.findFirst({
    where: {
      status: "open",
      visibility: "public",
      OR: [{ slug: jobIdOrSlug }, { id: jobIdOrSlug }],
    },
    include: {
      clientCompany: true,
    },
  });

  if (!job) {
    notFound();
  }

  const companyName =
    job.clientCompany?.name || (job.confidential ? "Confidential client" : "Resourcin client");

  const workModeValue =
    (job.workMode as string | null) ||
    (job.locationType as string | null) ||
    null;
  const workModeLabel = formatWorkMode(workModeValue);
  const employmentLabel = formatEmploymentType(job.employmentType);
  const experienceLabel = formatExperienceLevel(job.experienceLevel);

  const salaryMinLabel = formatMoney(job.salaryMin, job.salaryCurrency || "NGN");
  const salaryMaxLabel = formatMoney(job.salaryMax, job.salaryCurrency || "NGN");
  const hasVisibleSalary =
    job.salaryVisible && (salaryMinLabel || salaryMaxLabel);

  const posted = formatDate(job.createdAt);

  const tags =
    (job as any).tags && Array.isArray((job as any).tags)
      ? ((job as any).tags as string[])
      : [];

  const heroSummary =
    job.shortDescription ||
    job.overview ||
    job.description ||
    "This is a live mandate managed by Resourcin & ThinkATS with a structured process and real decision-makers on the other side.";

  return (
    <div className="min-h-screen bg-[#F5F6FA]">
      <div className="mx-auto max-w-4xl px-4 pb-16 pt-10 lg:px-0">
        {/* Back link */}
        <Link
          href="/jobs"
          className="inline-flex items-center text-xs font-medium text-slate-500 hover:text-slate-800"
        >
          <span className="mr-1.5">←</span>
          Back to all roles
        </Link>

        {/* Hero */}
        <section className="mt-4 rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-sm backdrop-blur sm:p-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-xl">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#FFC000]">
                {companyName}
              </p>
              <h1 className="mt-1 text-2xl font-semibold text-[#172965] sm:text-3xl">
                {job.title}
              </h1>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-slate-600">
                <span>{job.location || "Location flexible"}</span>
                {workModeLabel && (
                  <>
                    <span className="text-slate-300">•</span>
                    <span>{workModeLabel}</span>
                  </>
                )}
                {employmentLabel && (
                  <>
                    <span className="text-slate-300">•</span>
                    <span>{employmentLabel}</span>
                  </>
                )}
                {experienceLabel && (
                  <>
                    <span className="text-slate-300">•</span>
                    <span>{experienceLabel}</span>
                  </>
                )}
              </div>

              <p className="mt-3 text-sm text-slate-700">{heroSummary}</p>

              <p className="mt-3 text-[11px] text-slate-400">
                Posted {posted} • Curated by Resourcin & ThinkATS
              </p>

              {tags.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center rounded-full bg-slate-50 px-2 py-0.5 text-[10px] font-medium text-slate-700"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Compact CTA on larger screens */}
            <div className="flex flex-col items-end gap-2 text-right text-[11px] text-slate-600">
              {hasVisibleSalary && (
                <div className="rounded-2xl bg-[#F7F3E6] px-3 py-2 text-left text-[11px] text-[#7C5A00]">
                  <p className="text-[10px] font-semibold uppercase tracking-wide">
                    Compensation range (guidance)
                  </p>
                  <p className="mt-1 text-xs font-semibold">
                    {salaryMinLabel && salaryMaxLabel
                      ? `${salaryMinLabel} – ${salaryMaxLabel}`
                      : salaryMinLabel || salaryMaxLabel}
                  </p>
                  <p className="mt-1 text-[10px] text-[#7C5A00]/80">
                    Final offer depends on experience, interview performance and
                    internal banding.
                  </p>
                </div>
              )}

              <a
                href="#apply"
                className="mt-2 inline-flex items-center rounded-full bg-[#172965] px-4 py-1.5 text-[11px] font-semibold text-white shadow-sm hover:bg-[#12204d]"
              >
                Apply for this role
                <span className="ml-1.5 text-[10px] opacity-80">↓</span>
              </a>
            </div>
          </div>
        </section>

        {/* Body layout */}
        <div className="mt-8 grid gap-6 md:grid-cols-[minmax(0,2.1fr)_minmax(0,1.4fr)]">
          {/* Left: narrative */}
          <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
            <h2 className="text-sm font-semibold text-slate-900">
              About this opportunity
            </h2>

            {job.aboutClient && (
              <div className="space-y-1">
                <h3 className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
                  About the company
                </h3>
                <p className="whitespace-pre-line text-xs leading-relaxed text-slate-800">
                  {job.aboutClient}
                </p>
              </div>
            )}

            {job.overview && (
              <div className="space-y-1">
                <h3 className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
                  Role overview
                </h3>
                <p className="whitespace-pre-line text-xs leading-relaxed text-slate-800">
                  {job.overview}
                </p>
              </div>
            )}

            {job.responsibilities && (
              <div className="space-y-1">
                <h3 className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
                  Responsibilities
                </h3>
                <div className="whitespace-pre-line text-xs leading-relaxed text-slate-800">
                  {job.responsibilities}
                </div>
              </div>
            )}

            {job.requirements && (
              <div className="space-y-1">
                <h3 className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
                  Requirements
                </h3>
                <div className="whitespace-pre-line text-xs leading-relaxed text-slate-800">
                  {job.requirements}
                </div>
              </div>
            )}

            {job.benefits && (
              <div className="space-y-1">
                <h3 className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
                  Benefits & perks
                </h3>
                <div className="whitespace-pre-line text-xs leading-relaxed text-slate-800">
                  {job.benefits}
                </div>
              </div>
            )}

            {job.description && !job.overview && (
              <div className="space-y-1">
                <h3 className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
                  Description
                </h3>
                <div className="whitespace-pre-line text-xs leading-relaxed text-slate-800">
                  {job.description}
                </div>
              </div>
            )}
          </section>

          {/* Right: details & process */}
          <aside className="space-y-4 md:space-y-5">
            {/* Snapshot card */}
            <section className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <h2 className="text-sm font-semibold text-slate-900">
                Role snapshot
              </h2>
              <dl className="grid grid-cols-1 gap-y-3 text-xs text-slate-700">
                <div className="flex justify-between gap-4">
                  <div>
                    <dt className="text-[11px] font-medium text-slate-500">
                      Company
                    </dt>
                    <dd className="mt-0.5 text-slate-800">{companyName}</dd>
                  </div>
                </div>

                <div className="flex justify-between gap-4">
                  <div>
                    <dt className="text-[11px] font-medium text-slate-500">
                      Location
                    </dt>
                    <dd className="mt-0.5 text-slate-800">
                      {job.location || "Not specified"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[11px] font-medium text-slate-500">
                      Work style
                    </dt>
                    <dd className="mt-0.5 text-slate-800">
                      {workModeLabel || "Not specified"}
                    </dd>
                  </div>
                </div>

                <div className="flex justify-between gap-4">
                  <div>
                    <dt className="text-[11px] font-medium text-slate-500">
                      Function
                    </dt>
                    <dd className="mt-0.5 text-slate-800">
                      {job.department || "Not specified"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[11px] font-medium text-slate-500">
                      Experience
                    </dt>
                    <dd className="mt-0.5 text-slate-800">
                      {experienceLabel || "Not specified"}
                    </dd>
                  </div>
                </div>

                <div className="flex justify-between gap-4">
                  <div>
                    <dt className="text-[11px] font-medium text-slate-500">
                      Employment type
                    </dt>
                    <dd className="mt-0.5 text-slate-800">
                      {employmentLabel || "Not specified"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[11px] font-medium text-slate-500">
                      Posted
                    </dt>
                    <dd className="mt-0.5 text-slate-800">{posted}</dd>
                  </div>
                </div>

                {hasVisibleSalary && (
                  <div>
                    <dt className="text-[11px] font-medium text-slate-500">
                      Salary range
                    </dt>
                    <dd className="mt-0.5 text-slate-800">
                      {salaryMinLabel && salaryMaxLabel
                        ? `${salaryMinLabel} – ${salaryMaxLabel}`
                        : salaryMinLabel || salaryMaxLabel}
                      {!job.salaryVisible && (
                        <span className="ml-1 text-[10px] text-slate-500">
                          (internal guidance)
                        </span>
                      )}
                    </dd>
                  </div>
                )}
              </dl>
            </section>

            {/* Process / expectations */}
            <section className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <h2 className="text-sm font-semibold text-slate-900">
                What to expect
              </h2>
              <ul className="space-y-1.5 text-xs text-slate-700">
                <li className="flex items-start gap-2">
                  <span className="mt-[3px] h-1.5 w-1.5 rounded-full bg-[#64C247]" />
                  <span>
                    Your application goes directly into our ATS – no generic
                    inbox, no “black hole”.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-[3px] h-1.5 w-1.5 rounded-full bg-[#64C247]" />
                  <span>
                    If there&apos;s mutual fit, we&apos;ll reach out with clear
                    timelines and next steps.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-[3px] h-1.5 w-1.5 rounded-full bg-[#64C247]" />
                  <span>
                    We don&apos;t share your profile with any other client
                    without your explicit consent.
                  </span>
                </li>
              </ul>
            </section>
          </aside>
        </div>

        {/* Application form */}
        <section
          id="apply"
          className="mt-8 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
        >
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">
                Apply for this role
              </h2>
              <p className="mt-1 text-[11px] text-slate-600">
                Share a few details and upload your CV. It takes less than 3
                minutes.
              </p>
            </div>
          </div>

          <div className="mt-4">
            <JobApplyForm jobId={job.id} />
          </div>
        </section>
      </div>
    </div>
  );
}
