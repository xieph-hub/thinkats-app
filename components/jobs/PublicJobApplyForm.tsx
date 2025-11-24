// components/jobs/PublicJobApplyForm.tsx
"use client";

import React, { useState } from "react";

export type PublicJobApplyJob = {
  id: string;
  slug: string | null;
  title: string;
  short_description: string | null;
  department: string | null;
  location: string | null;
  location_type: string | null;
  employment_type: string | null;
  experience_level: string | null;
  salary_min: number | null;
  salary_max: number | null;
  salary_currency: string | null;
  salary_visible: boolean | null;
  work_mode: string | null;
  tags: string[] | null;
  created_at: string;
  confidential: boolean | null;
  client_company: {
    name: string;
    logo_url: string | null;
    slug: string | null;
  }[] | null;
};

type Props = {
  job: PublicJobApplyJob;
};

export function PublicJobApplyForm({ job }: Props) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setSubmitting(true);

    try {
      const form = e.currentTarget;
      const formData = new FormData(form);

      // Always include job id in payload
      formData.set("jobId", job.id);

      const slugOrId = job.slug ?? job.id;

      const res = await fetch(
        `/api/jobs/${encodeURIComponent(slugOrId)}/apply`,
        {
          method: "POST",
          body: formData,
        }
      );

      if (!res.ok) {
        let msg =
          "We couldn't submit your application. Please try again or email your CV directly.";
        try {
          const json = await res.json();
          if (json?.error) msg = json.error as string;
        } catch {
          // ignore JSON parse errors
        }
        setError(msg);
      } else {
        setSuccess("Thank you. Your application has been received.");
        form.reset();
      }
    } catch (err) {
      console.error(err);
      setError(
        "We couldn't submit your application. Please try again or email your CV directly."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const client = job.client_company?.[0] ?? null;
  const isConfidential = !!job.confidential;

  const workModeLabel = formatWorkMode(job);
  const employmentTypeLabel = formatEmploymentType(job.employment_type);
  const experienceLevelLabel = formatExperienceLevel(job.experience_level);
  const salaryLabel = formatSalary(job);
  const createdLabel = formatDate(job.created_at);

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1.1fr)]">
      {/* Left: job recap */}
      <section className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
          Apply to
        </p>
        <h1 className="mt-1 text-lg font-semibold text-slate-900">
          {job.title}
        </h1>

        <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-slate-600">
          {job.department && (
            <span className="rounded-full bg-slate-50 px-2 py-0.5 font-medium text-slate-700">
              {job.department}
            </span>
          )}

          {client ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-50 px-2 py-0.5 text-[11px] text-slate-700">
              {client.logo_url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={client.logo_url}
                  alt={client.name}
                  className="h-4 w-4 rounded-sm object-contain"
                />
              )}
              <span className="font-medium">
                {isConfidential ? "Confidential search" : client.name}
              </span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-50 px-2 py-0.5 text-[11px] text-slate-700">
              <span className="font-medium">Resourcin</span>
            </span>
          )}
        </div>

        {job.short_description && (
          <p className="mt-3 text-sm text-slate-700">
            {job.short_description}
          </p>
        )}

        <div className="mt-3 flex flex-wrap gap-2 text-[11px] text-slate-700">
          {job.location && (
            <MetaItem icon={<IconLocation />} label={job.location} />
          )}
          {workModeLabel && (
            <MetaItem icon={<IconGlobe />} label={workModeLabel} />
          )}
          {employmentTypeLabel && (
            <MetaItem icon={<IconBriefcase />} label={employmentTypeLabel} />
          )}
          {experienceLevelLabel && (
            <MetaItem icon={<IconAward />} label={experienceLevelLabel} />
          )}
        </div>

        {salaryLabel && (
          <div className="mt-3 text-[11px] text-slate-700">
            <span className="font-medium">Compensation: </span>
            <span>{salaryLabel}</span>
          </div>
        )}

        <p className="mt-3 text-[11px] text-slate-500">
          Posted {createdLabel}. Applications go directly into the Resourcin ATS
          pipeline for this mandate.
        </p>

        {job.tags && job.tags.length > 0 && (
          <div className="mt-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
              Tags
            </p>
            <div className="mt-1 flex flex-wrap gap-1.5">
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
      </section>

      {/* Right: application form */}
      <section className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
        <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
          Submit your application
        </h2>
        <p className="mt-2 text-[11px] text-slate-600">
          You can apply without creating an account. We&apos;ll only reach out
          when there&apos;s a strong match.
        </p>

        {error && (
          <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[11px] text-red-700">
            {error}
          </div>
        )}

        {success && (
          <div className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-[11px] text-emerald-700">
            {success}
          </div>
        )}

        <form
          className="mt-4 space-y-4"
          onSubmit={handleSubmit}
          encType="multipart/form-data"
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="block text-[11px] font-medium text-slate-700">
                Full name
                <input
                  type="text"
                  name="full_name"
                  required
                  className="mt-1 w-full rounded-md border border-slate-200 px-2 py-1.5 text-xs text-slate-900 shadow-sm focus:border-[#172965] focus:outline-none focus:ring-1 focus:ring-[#172965]"
                />
              </label>
            </div>
            <div>
              <label className="block text-[11px] font-medium text-slate-700">
                Email
                <input
                  type="email"
                  name="email"
                  required
                  className="mt-1 w-full rounded-md border border-slate-200 px-2 py-1.5 text-xs text-slate-900 shadow-sm focus:border-[#172965] focus:outline-none focus:ring-1 focus:ring-[#172965]"
                />
              </label>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="block text-[11px] font-medium text-slate-700">
                Phone (optional)
                <input
                  type="tel"
                  name="phone"
                  className="mt-1 w-full rounded-md border border-slate-200 px-2 py-1.5 text-xs text-slate-900 shadow-sm focus:border-[#172965] focus:outline-none focus:ring-1 focus:ring-[#172965]"
                />
              </label>
            </div>
            <div>
              <label className="block text-[11px] font-medium text-slate-700">
                Location (city, country)
                <input
                  type="text"
                  name="location"
                  className="mt-1 w-full rounded-md border border-slate-200 px-2 py-1.5 text-xs text-slate-900 shadow-sm focus:border-[#172965] focus:outline-none focus:ring-1 focus:ring-[#172965]"
                />
              </label>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-medium text-slate-700">
              LinkedIn profile (optional)
              <input
                type="url"
                name="linkedin_url"
                placeholder="https://www.linkedin.com/in/username"
                className="mt-1 w-full rounded-md border border-slate-200 px-2 py-1.5 text-xs text-slate-900 shadow-sm focus:border-[#172965] focus:outline-none focus:ring-1 focus:ring-[#172965]"
              />
            </label>
          </div>

          <div>
            <label className="block text-[11px] font-medium text-slate-700">
              CV / Résumé
              <input
                type="file"
                name="cv"
                accept=".pdf,.doc,.docx"
                className="mt-1 block w-full text-[11px] text-slate-600 file:mr-3 file:rounded-md file:border-0 file:bg-slate-100 file:px-3 file:py-1.5 file:text-[11px] file:font-medium file:text-slate-700 hover:file:bg-slate-200"
              />
            </label>
            <p className="mt-1 text-[10px] text-slate-500">
              PDF or Word preferred. If upload fails, you can email your CV
              directly.
            </p>
          </div>

          <div>
            <label className="block text-[11px] font-medium text-slate-700">
              Short note / motivation (optional)
              <textarea
                name="cover_letter"
                rows={4}
                className="mt-1 w-full rounded-md border border-slate-200 px-2 py-1.5 text-xs text-slate-900 shadow-sm focus:border-[#172965] focus:outline-none focus:ring-1 focus:ring-[#172965]"
                placeholder="A few sentences on why this role and why now."
              />
            </label>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-[10px] text-slate-500">
              By submitting, you agree that Resourcin may store your details for
              this role and closely related mandates. We don&apos;t spam.
            </p>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center justify-center rounded-full bg-[#172965] px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-[#111c4c] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? "Submitting…" : "Submit application"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

/* ---------- Helpers + meta icons (mirroring job detail style) ---------- */

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

function formatWorkMode(job: PublicJobApplyJob): string | null {
  if (job.work_mode) {
    const lower = job.work_mode.toLowerCase();
    if (lower === "remote") return "Remote";
    if (lower === "hybrid") return "Hybrid";
    if (lower === "onsite" || lower === "on-site") return "On-site";
    if (lower === "flexible") return "Flexible";
  }

  const loc = (job.location || "").toLowerCase();
  const tags = (job.tags || []).map((t) => t.toLowerCase());

  if (loc.includes("remote") || tags.includes("remote")) return "Remote";
  if (loc.includes("hybrid") || tags.includes("hybrid")) return "Hybrid";
  if (loc.includes("flexible") || tags.includes("flexible")) return "Flexible";
  if (loc.includes("on-site") || loc.includes("onsite")) return "On-site";

  return null;
}

function formatExperienceLevel(value: string | null) {
  if (!value) return null;
  const lower = value.toLowerCase();
  if (lower.includes("entry")) return "Entry level";
  if (lower.includes("mid")) return "Mid level";
  if (lower.includes("senior")) return "Senior level";
  if (lower.includes("lead") || lower.includes("principal"))
    return "Lead / Principal";
  if (lower.includes("exec") || lower.includes("c-level"))
    return "Executive";
  return value;
}

function formatNumber(n: number) {
  return Math.round(n).toLocaleString();
}

function currencySymbol(code: string | null) {
  if (!code) return "";
  const upper = code.toUpperCase();
  if (upper === "NGN" || upper === "₦") return "₦";
  if (upper === "USD" || upper === "$") return "$";
  if (upper === "GBP" || upper === "£") return "£";
  if (upper === "EUR" || upper === "€") return "€";
  return upper;
}

function formatSalary(job: PublicJobApplyJob): string | null {
  if (!job.salary_visible) return null;
  const { salary_min, salary_max, salary_currency } = job;
  if (!salary_min && !salary_max) return null;

  const sym = currencySymbol(salary_currency);

  if (salary_min && salary_max) {
    return `${sym}${formatNumber(salary_min)} – ${sym}${formatNumber(
      salary_max
    )} per year`;
  }

  if (salary_min) {
    return `From ${sym}${formatNumber(salary_min)} per year`;
  }

  if (salary_max) {
    return `Up to ${sym}${formatNumber(salary_max)} per year`;
  }

  return null;
}

function MetaItem({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-[11px] text-slate-700">
      <span className="text-slate-500" aria-hidden="true">
        {icon}
      </span>
      <span>{label}</span>
    </span>
  );
}

function IconLocation() {
  return (
    <svg
      className="h-3.5 w-3.5 text-red-500"
      viewBox="0 0 20 20"
      aria-hidden="true"
      fill="none"
    >
      <path
        d="M10 2.5a4.5 4.5 0 0 0-4.5 4.5c0 3.038 3.287 6.87 4.063 7.69a.6.6 0 0 0 .874 0C11.213 13.87 14.5 10.038 14.5 7A4.5 4.5 0 0 0 10 2.5Z"
        stroke="currentColor"
        strokeWidth="1.3"
      />
      <circle cx="10" cy="7" r="1.6" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  );
}

function IconBriefcase() {
  return (
    <svg
      className="h-3.5 w-3.5 text-amber-700"
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
        stroke="currentColor"
        strokeWidth="1.3"
      />
      <path
        d="M7.5 6V5.4A1.9 1.9 0 0 1 9.4 3.5h1.2a1.9 1.9 0 0 1 1.9 1.9V6"
        stroke="currentColor"
        strokeWidth="1.3"
      />
      <path
        d="M3.5 9.5h4m5 0h4"
        stroke="currentColor"
        strokeWidth="1.1"
        strokeLinecap="round"
      />
    </svg>
  );
}

function IconGlobe() {
  return (
    <svg
      className="h-3.5 w-3.5 text-slate-600"
      viewBox="0 0 20 20"
      aria-hidden="true"
      fill="none"
    >
      <circle cx="10" cy="10" r="6.2" stroke="currentColor" strokeWidth="1.2" />
      <path
        d="M10 3.8c-1.5 1.7-2.3 3.9-2.3 6.2 0 2.3.8 4.5 2.3 6.2m0-12.4c1.5 1.7 2.3 3.9 2.3 6.2 0 2.3-.8 4.5-2.3 6.2M4.2 10h11.6"
        stroke="currentColor"
        strokeWidth="1.1"
      />
    </svg>
  );
}

function IconAward() {
  return (
    <svg
      className="h-3.5 w-3.5 text-yellow-500"
      viewBox="0 0 20 20"
      aria-hidden="true"
      fill="none"
    >
      <circle
        cx="9.5"
        cy="7"
        r="3.2"
        stroke="currentColor"
        strokeWidth="1.2"
      />
      <path
        d="M6.5 10.2 5.4 16l3-1.7 2.6 1.7 1-5.8"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
