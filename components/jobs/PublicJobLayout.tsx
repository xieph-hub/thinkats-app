// components/jobs/PublicJobLayout.tsx
import Link from "next/link";
import type { ReactNode } from "react";

type ClientCompany = {
  name?: string | null;
  logo_url?: string | null;
  slug?: string | null;
};

export type PublicJobForLayout = {
  id: string;
  title: string;
  short_description?: string | null;
  description?: string | null;

  location?: string | null;
  work_mode?: string | null;
  location_type?: string | null;
  employment_type?: string | null;
  seniority?: string | null;
  experience_level?: string | null;
  department?: string | null;

  created_at?: string;
  status?: string | null;
  visibility?: string | null;
  internal_only?: boolean | null;
  confidential?: boolean | null;

  salary_min?: number | null;
  salary_max?: number | null;
  salary_currency?: string | null;
  salary_visible?: boolean | null;

  required_skills?: string[] | null;
  tags?: string[] | null;

  years_experience_min?: number | null;
  years_experience_max?: number | null;
  education_required?: string | null;
  education_field?: string | null;

  client_company?: ClientCompany | null;
};

type Props = {
  job: PublicJobForLayout;
  /** Put your existing Apply form / CTA here */
  applySlot?: ReactNode;
};

const BRAND_BLUE = "#172965";

function formatDate(dateStr?: string) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
  });
}

function formatSalary(
  min?: number | null,
  max?: number | null,
  currency?: string | null
) {
  if (!min && !max) return null;

  const cur = currency || "₦";
  if (min && max) return `${cur}${min.toLocaleString()} – ${cur}${max.toLocaleString()}`;
  if (min) return `From ${cur}${min.toLocaleString()}`;
  return `Up to ${cur}${(max as number).toLocaleString()}`;
}

function deriveWorkMode(job: PublicJobForLayout): string | null {
  if (job.work_mode) {
    const wm = job.work_mode.toLowerCase();
    if (wm === "remote") return "Remote";
    if (wm === "hybrid") return "Hybrid";
    if (wm === "onsite" || wm === "on-site") return "On-site";
    if (wm === "flexible") return "Flexible";
  }

  const loc = (job.location || "").toLowerCase();
  const tags = (job.tags || []).map((t) => t.toLowerCase());

  if (loc.includes("remote") || tags.includes("remote")) return "Remote";
  if (loc.includes("hybrid") || tags.includes("hybrid")) return "Hybrid";
  if (loc.includes("flexible") || tags.includes("flexible")) return "Flexible";
  if (loc.includes("on-site") || loc.includes("onsite")) return "On-site";

  return null;
}

export function PublicJobLayout({ job, applySlot }: Props) {
  const workModeLabel = deriveWorkMode(job);
  const createdLabel = formatDate(job.created_at);
  const salaryLabel =
    job.salary_visible && formatSalary(job.salary_min, job.salary_max, job.salary_currency);

  const company = job.client_company;
  const isTrulyPublic =
    job.visibility === "public" && !job.internal_only && !job.confidential;

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      {/* Back link */}
      <div className="mb-4">
        <Link
          href="/jobs"
          className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-600 hover:text-slate-900"
        >
          <span aria-hidden="true">←</span>
          Back to all jobs
        </Link>
      </div>

      {/* Hero */}
      <header className="border-b border-slate-100 pb-5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
          Open role
        </p>
        <h1 className="mt-1 text-2xl font-semibold text-slate-900">
          {job.title}
        </h1>

        <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] text-slate-600">
          {job.location && (
            <Pill icon={<RedPinIcon />}>{job.location}</Pill>
          )}
          {workModeLabel && (
            <Pill icon={<GlobeIcon />}>{workModeLabel}</Pill>
          )}
          {job.employment_type && (
            <Pill icon={<BriefcaseIcon />}>{job.employment_type}</Pill>
          )}
          {job.seniority && (
            <Pill icon={<StarIcon />}>{job.seniority}</Pill>
          )}
          {job.department && (
            <Pill icon={<FolderIcon />}>{job.department}</Pill>
          )}
        </div>

        {(createdLabel || salaryLabel) && (
          <p className="mt-2 text-[11px] text-slate-500">
            {createdLabel && <>Posted {createdLabel}</>}
            {createdLabel && salaryLabel && <span> · </span>}
            {salaryLabel && <>Salary: {salaryLabel}</>}
          </p>
        )}

        {!isTrulyPublic && (
          <p className="mt-2 inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-[10px] font-medium text-amber-800">
            <span aria-hidden="true">⚠️</span>
            {job.internal_only
              ? "Internal role – only visible to selected audiences."
              : job.confidential
              ? "Confidential search – limited client details are shown."
              : "Non-public listing."}
          </p>
        )}
      </header>

      {/* Section nav */}
      <nav className="mt-6 border-b border-slate-100 text-sm">
        <ul className="-mb-px flex flex-wrap gap-4 text-[12px]">
          {[
            { id: "overview", label: "Overview" },
            { id: "responsibilities", label: "Responsibilities" },
            { id: "requirements", label: "Requirements" },
            { id: "about-client", label: "About client" },
          ].map((tab) => (
            <li key={tab.id}>
              <a
                href={`#${tab.id}`}
                className="inline-flex items-center border-b-2 border-transparent pb-2 text-[11px] font-medium text-slate-600 hover:border-[#172965] hover:text-[#172965]"
              >
                {tab.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      {/* Body: content + sidebar */}
      <div className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,2.1fr)_minmax(0,1fr)]">
        {/* Left: content */}
        <article className="space-y-8 text-sm text-slate-700">
          {/* Overview */}
          <section id="overview">
            <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
              Overview
            </h2>
            {job.short_description && (
              <p className="mt-2 text-sm text-slate-700">
                {job.short_description}
              </p>
            )}
            {job.description && (
              <div className="prose prose-sm mt-3 max-w-none text-slate-700 prose-p:mb-2 prose-ul:mt-2 prose-li:my-0.5">
                {job.description.split("\n\n").map((chunk, idx) => (
                  <p key={idx}>{chunk}</p>
                ))}
              </div>
            )}
            {!job.short_description && !job.description && (
              <p className="mt-2 text-sm text-slate-500">
                Details will be shared with shortlisted candidates.
              </p>
            )}
          </section>

          {/* Responsibilities */}
          <section id="responsibilities">
            <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
              Responsibilities
            </h2>
            {job.required_skills && job.required_skills.length > 0 ? (
              <ul className="mt-2 list-disc pl-5 text-[13px] text-slate-700">
                {job.required_skills.slice(0, 8).map((skill) => (
                  <li key={skill}>{skill}</li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-sm text-slate-500">
                The detailed scope of work will be discussed during the
                interview process.
              </p>
            )}
          </section>

          {/* Requirements */}
          <section id="requirements">
            <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
              Requirements
            </h2>
            <div className="mt-2 space-y-3 text-[13px]">
              {(job.years_experience_min || job.years_experience_max || job.experience_level) && (
                <div>
                  <h3 className="text-xs font-semibold text-slate-900">
                    Experience
                  </h3>
                  <p className="mt-1 text-slate-700">
                    {job.experience_level && (
                      <>
                        {job.experience_level}
                        {(job.years_experience_min || job.years_experience_max) && (
                          <span> · </span>
                        )}
                      </>
                    )}
                    {job.years_experience_min &&
                      job.years_experience_max && (
                        <>
                          {job.years_experience_min}–{job.years_experience_max}{" "}
                          years
                        </>
                      )}
                    {job.years_experience_min &&
                      !job.years_experience_max && (
                        <>From {job.years_experience_min} years</>
                      )}
                    {!job.years_experience_min &&
                      job.years_experience_max && (
                        <>Up to {job.years_experience_max} years</>
                      )}
                  </p>
                </div>
              )}

              {(job.education_required || job.education_field) && (
                <div>
                  <h3 className="text-xs font-semibold text-slate-900">
                    Education
                  </h3>
                  <p className="mt-1 text-slate-700">
                    {job.education_required}
                    {job.education_required && job.education_field && " · "}
                    {job.education_field}
                  </p>
                </div>
              )}

              {job.tags && job.tags.length > 0 && (
                <div>
                  <h3 className="text-xs font-semibold text-slate-900">
                    Keywords
                  </h3>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {job.tags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center rounded-full bg-slate-50 px-2 py-0.5 text-[10px] font-medium text-slate-700"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* About client */}
          <section id="about-client">
            <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
              About client
            </h2>
            <div className="mt-2 flex items-start gap-3">
              {company?.logo_url && (
                <div className="mt-0.5 h-10 w-10 flex-shrink-0 overflow-hidden rounded-lg border border-slate-100 bg-white">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={company.logo_url}
                    alt={company.name || "Client logo"}
                    className="h-full w-full object-contain"
                  />
                </div>
              )}
              <div className="space-y-1 text-[13px] text-slate-700">
                <p className="font-semibold text-slate-900">
                  {job.confidential
                    ? "Confidential client"
                    : company?.name || "Client organisation"}
                </p>
                <p className="text-slate-600">
                  {job.confidential
                    ? "A reputable organisation working with Resourcin on a discreet search. More details will be shared with shortlisted candidates."
                    : "This search is being run by Resourcin on behalf of the client. You will work closely with their leadership and the Resourcin team through the process."}
                </p>
              </div>
            </div>
          </section>
        </article>

        {/* Right: sidebar */}
        <aside className="lg:pl-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
              Apply
            </h2>
            <p className="mt-1 text-[11px] text-slate-600">
              You can apply in a few minutes. We&apos;ll only reach out when
              there&apos;s a strong match.
            </p>

            <div className="mt-3">
              {applySlot ? (
                applySlot
              ) : (
                <p className="text-[11px] text-slate-500">
                  {/* Fallback if you haven&apos;t wired the form */}
                  Plug your existing application form or CTA here via the
                  <code className="mx-1 rounded bg-slate-100 px-1">applySlot</code>{" "}
                  prop.
                </p>
              )}
            </div>

            <div className="mt-4 border-t border-slate-100 pt-3 text-[11px] text-slate-500">
              <ul className="space-y-1">
                <li>• No account required to apply</li>
                <li>• We respond when there&apos;s a strong alignment</li>
                <li>• Your profile is treated confidentially</li>
              </ul>
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}

/* ——— Small pills & icons ——— */

function Pill({
  icon,
  children,
}: {
  icon?: ReactNode;
  children: ReactNode;
}) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-slate-50 px-2.5 py-0.5 text-[11px] text-slate-700">
      {icon && (
        <span className="text-slate-500" aria-hidden="true">
          {icon}
        </span>
      )}
      <span>{children}</span>
    </span>
  );
}

function RedPinIcon() {
  return (
    <svg
      className="h-3 w-3"
      viewBox="0 0 20 20"
      aria-hidden="true"
      fill="none"
    >
      <path
        d="M10 2.5a4.5 4.5 0 0 0-4.5 4.5c0 3.038 3.287 6.87 4.063 7.69a.6.6 0 0 0 .874 0C11.213 13.87 14.5 10.038 14.5 7A4.5 4.5 0 0 0 10 2.5Z"
        stroke="#DC2626"
        strokeWidth="1.3"
      />
      <circle
        cx="10"
        cy="7"
        r="1.6"
        stroke="#DC2626"
        strokeWidth="1.2"
        fill="#FCA5A5"
      />
    </svg>
  );
}

function BriefcaseIcon() {
  return (
    <svg
      className="h-3 w-3"
      viewBox="0 0 20 20"
      aria-hidden="true"
      fill="none"
    >
      <rect
        x="3"
        y="6"
        width="14"
        height="9"
        rx="1.7"
        stroke="#92400E"
        strokeWidth="1.3"
      />
      <path
        d="M7.5 6V5.4A1.9 1.9 0 0 1 9.4 3.5h1.2a1.9 1.9 0 0 1 1.9 1.9V6"
        stroke="#92400E"
        strokeWidth="1.3"
      />
      <path
        d="M3.5 9.5h4m5 0h4"
        stroke="#92400E"
        strokeWidth="1.1"
        strokeLinecap="round"
      />
    </svg>
  );
}

function GlobeIcon() {
  return (
    <svg
      className="h-3 w-3"
      viewBox="0 0 20 20"
      aria-hidden="true"
      fill="none"
    >
      <circle
        cx="10"
        cy="10"
        r="6.2"
        stroke="#64748B"
        strokeWidth="1.2"
      />
      <path
        d="M10 3.8c-1.5 1.7-2.3 3.9-2.3 6.2 0 2.3.8 4.5 2.3 6.2m0-12.4c1.5 1.7 2.3 3.9 2.3 6.2 0 2.3-.8 4.5-2.3 6.2M4.2 10h11.6"
        stroke="#64748B"
        strokeWidth="1.1"
      />
    </svg>
  );
}

function StarIcon() {
  return (
    <svg
      className="h-3 w-3"
      viewBox="0 0 20 20"
      aria-hidden="true"
      fill="none"
    >
      <path
        d="m10 3.2 1.54 3.12 3.44.5-2.49 2.43.59 3.47L10 11.6l-3.08 1.62.59-3.47L5.02 6.82l3.44-.5L10 3.2Z"
        stroke="#F59E0B"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function FolderIcon() {
  return (
    <svg
      className="h-3 w-3"
      viewBox="0 0 20 20"
      aria-hidden="true"
      fill="none"
    >
      <path
        d="M3.5 6.5A1.5 1.5 0 0 1 5 5h3l1.2 1.4H15a1.5 1.5 0 0 1 1.5 1.5V13A1.5 1.5 0 0 1 15 14.5H5A1.5 1.5 0 0 1 3.5 13V6.5Z"
        stroke="#0F766E"
        strokeWidth="1.3"
      />
    </svg>
  );
}
