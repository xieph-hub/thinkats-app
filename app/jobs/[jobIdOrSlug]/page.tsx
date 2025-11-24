// app/jobs/[jobIdOrSlug]/page.tsx
import { notFound } from "next/navigation";
import Link from "next/link";
import type { ReactNode } from "react";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

type PageProps = {
  params: { jobIdOrSlug: string };
  searchParams?: { applied?: string };
};

type JobRow = {
  id: string;
  tenant_id: string;
  slug: string | null;
  title: string;
  location: string | null;
  employment_type: string | null;
  seniority: string | null;
  department: string | null;
  description: string | null;
  status: string | null;
  visibility: string | null;
  created_at: string | null;
  tags: string[] | null;
};

function formatDate(dateStr: string | null) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
  });
}

// simple UUID pattern: 8-4-4-4-12 hex segments
function looksLikeUuid(value: string) {
  return /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(
    value
  );
}

function deriveWorkMode(job: JobRow): string | null {
  const loc = (job.location || "").toLowerCase();
  const tags = (job.tags || []).map((t) => t.toLowerCase());

  if (loc.includes("remote") || tags.includes("remote")) return "Remote";
  if (loc.includes("hybrid") || tags.includes("hybrid")) return "Hybrid";
  if (loc.includes("flexible") || tags.includes("flexible")) return "Flexible";
  if (loc.includes("on-site") || loc.includes("onsite")) return "On-site";

  return null;
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

/* --- Icons (same language as jobs list) --- */

function MetaItem({
  icon,
  label,
}: {
  icon: ReactNode;
  label: string | null | undefined;
}) {
  if (!label) return null;
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

function IconBriefcaseBrown() {
  return (
    <svg
      className="h-3.5 w-3.5"
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

function IconGlobe() {
  return (
    <svg
      className="h-3.5 w-3.5 text-slate-500"
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

function IconStar() {
  return (
    <svg
      className="h-3.5 w-3.5 text-yellow-500"
      viewBox="0 0 20 20"
      aria-hidden="true"
      fill="none"
    >
      <path
        d="m10 3.2 1.54 3.12 3.44.5-2.49 2.43.59 3.47L10 11.6l-3.08 1.62.59-3.47L5.02 6.82l3.44-.5L10 3.2Z"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconClock() {
  return (
    <svg
      className="h-3.5 w-3.5 text-orange-500"
      viewBox="0 0 20 20"
      aria-hidden="true"
      fill="none"
    >
      <circle cx="10" cy="10" r="6.5" stroke="currentColor" strokeWidth="1.2" />
      <path
        d="M10 6v4l2.5 1.5"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/* --- Social icons (inline logos) --- */

function IconX() {
  return (
    <svg
      className="h-3.5 w-3.5"
      viewBox="0 0 24 24"
      aria-hidden="true"
      fill="currentColor"
    >
      <path d="M18.25 3H21L14.5 11.02 22 21h-5.5l-4.15-5.39L7.5 21H5l6.9-8.66L4 3h5.6l3.74 4.92L18.25 3Z" />
    </svg>
  );
}

function IconLinkedIn() {
  return (
    <svg
      className="h-3.5 w-3.5 text-[#0A66C2]"
      viewBox="0 0 24 24"
      aria-hidden="true"
      fill="currentColor"
    >
      <path d="M4.98 3.5C4.98 4.88 3.88 6 2.5 6S0 4.88 0 3.5 1.12 1 2.5 1s2.48 1.12 2.48 2.5zM.24 8.32H4.7V24H.24V8.32zM8.44 8.32h4.29v2.13h.06c.6-1.14 2.07-2.35 4.26-2.35 4.55 0 5.39 3 5.39 6.89V24h-4.46v-7.26c0-1.73-.03-3.96-2.41-3.96-2.41 0-2.78 1.88-2.78 3.82V24H8.44V8.32z" />
    </svg>
  );
}

function IconWhatsApp() {
  return (
    <svg
      className="h-3.5 w-3.5 text-[#25D366]"
      viewBox="0 0 32 32"
      aria-hidden="true"
      fill="currentColor"
    >
      <path d="M16.01 5.08c-5.94 0-10.77 4.82-10.77 10.77 0 1.9.5 3.74 1.45 5.37L5 27l5.96-1.57a10.76 10.76 0 0 0 5.05 1.29h.01c5.94 0 10.77-4.83 10.77-10.77 0-2.88-1.12-5.59-3.16-7.63A10.7 10.7 0 0 0 16 5.08h.01Zm0 2.13c2.28 0 4.43.89 6.05 2.5a8.58 8.58 0 0 1 2.52 6.12c0 4.78-3.88 8.66-8.66 8.66-1.53 0-3.03-.4-4.35-1.17l-.31-.18-3.54.93.95-3.45-.2-.35a8.54 8.54 0 0 1-1.3-4.64c0-4.78 3.88-8.66 8.66-8.66Zm-4.25 3.47c-.21 0-.55.08-.84.39-.29.31-1.1 1.08-1.1 2.63 0 1.55 1.12 3.05 1.27 3.26.16.21 2.19 3.5 5.35 4.76 2.65 1.05 3.19.84 3.76.79.57-.05 1.85-.76 2.11-1.49.26-.73.26-1.35.18-1.49-.08-.13-.29-.21-.6-.37-.31-.16-1.85-.91-2.14-1.01-.29-.11-.5-.16-.71.16-.21.31-.82 1.01-1.01 1.21-.18.21-.37.24-.68.08-.31-.16-1.31-.48-2.5-1.52-.92-.82-1.54-1.83-1.72-2.14-.18-.31-.02-.48.13-.63.13-.13.31-.34.47-.5.16-.16.21-.26.31-.45.1-.18.05-.34-.03-.5-.08-.16-.72-1.79-1-2.45-.26-.63-.53-.55-.74-.56Z" />
    </svg>
  );
}

export default async function JobDetailPage({
  params,
  searchParams,
}: PageProps) {
  const rawParam = params.jobIdOrSlug;

  if (!rawParam || rawParam === "undefined") {
    notFound();
  }

  const slugOrId = decodeURIComponent(rawParam);
  const isUuid = looksLikeUuid(slugOrId);

  let query = supabaseAdmin
    .from("jobs")
    .select(
      `
      id,
      tenant_id,
      slug,
      title,
      location,
      employment_type,
      seniority,
      department,
      description,
      status,
      visibility,
      created_at,
      tags
    `
    )
    .eq("status", "open")
    .eq("visibility", "public");

  if (isUuid) {
    query = query.eq("id", slugOrId);
  } else {
    query = query.eq("slug", slugOrId);
  }

  const { data, error } = await query.single<JobRow>();

  if (error) {
    console.error("Error loading job detail:", error);
  }

  const job = data || undefined;
  if (!job) {
    notFound();
  }

  const workMode = deriveWorkMode(job);
  const employmentTypeLabel = formatEmploymentType(job.employment_type);
  const appliedFlag = searchParams?.applied;

  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL || "https://www.resourcin.com";
  const jobUrl = `${baseUrl}/jobs/${encodeURIComponent(
    job.slug || job.id
  )}`.trim();

  const shareText = encodeURIComponent(
    `${job.title}${job.location ? ` – ${job.location}` : ""} (via Resourcin)`
  );
  const encodedUrl = encodeURIComponent(jobUrl);

  const xUrl = `https://twitter.com/intent/tweet?text=${shareText}&url=${encodedUrl}`;
  const linkedInUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`;
  const whatsappUrl = `https://api.whatsapp.com/send?text=${shareText}%20${encodedUrl}`;

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <Link
        href="/jobs"
        className="text-[11px] text-slate-500 hover:text-slate-700 hover:underline"
      >
        ← Back to all jobs
      </Link>

      {appliedFlag === "1" && (
        <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          Thank you. Your application has been received.
        </div>
      )}

      {appliedFlag === "0" && (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900">
          We couldn&apos;t submit your application. Please try again or email
          your CV directly.
        </div>
      )}

      <article className="mt-6 space-y-8">
        {/* HERO */}
        <header className="space-y-3 border-b border-slate-100 pb-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
              For candidates
            </p>
            <h1 className="mt-1 text-2xl font-semibold text-slate-900">
              {job.title}
            </h1>
            <p className="mt-1 text-[12px] text-slate-500">
              {job.department || "Client role"}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <MetaItem icon={<IconLocation />} label={job.location} />
            <MetaItem icon={<IconGlobe />} label={workMode} />
            <MetaItem
              icon={<IconBriefcaseBrown />}
              label={employmentTypeLabel}
            />
            <MetaItem icon={<IconStar />} label={job.seniority} />
            <MetaItem
              icon={<IconClock />}
              label={
                job.created_at ? `Posted ${formatDate(job.created_at)}` : null
              }
            />
          </div>

          {job.tags && job.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 pt-1">
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

          {/* Social share */}
          <div className="mt-2 flex flex-wrap items-center gap-2 text-[10px] text-slate-500">
            <span className="font-medium text-slate-600">Share:</span>
            <a
              href={linkedInUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-[#0A66C2] hover:underline"
            >
              <IconLinkedIn />
              <span>LinkedIn</span>
            </a>
            <a
              href={xUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-black hover:underline"
            >
              <IconX />
              <span>X</span>
            </a>
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-[#25D366] hover:underline"
            >
              <IconWhatsApp />
              <span>WhatsApp</span>
            </a>
          </div>
        </header>

        {/* DESCRIPTION – we only have one description field for now, so we treat it as a combined overview */}
        {job.description && (
          <section className="space-y-3">
            <h2 className="text-sm font-semibold text-slate-900">
              Role overview
            </h2>
            <p className="whitespace-pre-line text-sm leading-relaxed text-slate-700">
              {job.description}
            </p>
          </section>
        )}

        {/* APPLICATION FORM */}
        <section className="mt-4">
          <h2 className="text-sm font-semibold text-slate-900">
            Apply for this role
          </h2>
          <p className="mt-1 text-xs text-slate-600">
            You can apply without creating an account. We&apos;ll add you to our
            talent pool and only reach out when there&apos;s a strong match.
          </p>

          <ApplicationForm
            jobId={job.id}
            tenantId={job.tenant_id}
            slug={job.slug}
          />
        </section>
      </article>
    </main>
  );
}

function ApplicationForm(props: {
  jobId: string;
  tenantId: string;
  slug: string | null;
}) {
  const { jobId, tenantId, slug } = props;

  return (
    <form
      action="/api/job-applications"
      method="POST"
      encType="multipart/form-data"
      className="mt-4 space-y-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
    >
      <input type="hidden" name="jobId" value={jobId} />
      <input type="hidden" name="tenantId" value={tenantId} />
      <input type="hidden" name="jobSlug" value={slug ?? ""} />

      {/* Personal info */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1">
          <label className="text-xs font-medium text-slate-800">
            Full name <span className="text-red-500">*</span>
          </label>
          <input
            name="fullName"
            required
            minLength={2}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none focus:border-[#172965] focus:ring-1 focus:ring-[#172965]/80"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-slate-800">
            Email address <span className="text-red-500">*</span>
          </label>
          <input
            type="email"
            name="email"
            required
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none focus:border-[#172965] focus:ring-1 focus:ring-[#172965]/80"
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1">
          <label className="text-xs font-medium text-slate-800">
            Phone number
          </label>
          <input
            name="phone"
            placeholder="+234 803 000 0000"
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none focus:border-[#172965] focus:ring-1 focus:ring-[#172965]/80"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-slate-800">
            Current location
          </label>
          <input
            name="location"
            placeholder="City, Country"
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none focus:border-[#172965] focus:ring-1 focus:ring-[#172965]/80"
          />
        </div>
      </div>

      {/* Links */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1">
          <label className="text-xs font-medium text-slate-800">
            LinkedIn URL
          </label>
          <input
            name="linkedinUrl"
            placeholder="https://linkedin.com/in/..."
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none focus:border-[#172965] focus:ring-1 focus:ring-[#172965]/80"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-slate-800">
            Portfolio / Website
          </label>
          <input
            name="portfolioUrl"
            placeholder="https://..."
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none focus:border-[#172965] focus:ring-1 focus:ring-[#172965]/80"
          />
        </div>
      </div>

      {/* CV */}
      <div className="space-y-1">
        <label className="text-xs font-medium text-slate-800">
          CV / Résumé (PDF) <span className="text-red-500">*</span>
        </label>
        <input
          type="file"
          name="cv"
          accept=".pdf,.doc,.docx"
          required
          className="w-full text-xs text-slate-700"
        />
        <p className="text-[11px] text-slate-500">
          Upload a recent CV. PDF is preferred. Max 5MB.
        </p>
      </div>

      {/* Screening questions (basic set, folded into cover_letter/extra text) */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1">
          <label className="text-xs font-medium text-slate-800">
            Do you have a valid work permit for this role&apos;s country?
          </label>
          <select
            name="workPermit"
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-[#172965] focus:ring-1 focus:ring-[#172965]/80"
          >
            <option value="">Select an option</option>
            <option value="yes">Yes, I do</option>
            <option value="no">No, I don&apos;t</option>
            <option value="not_sure">I&apos;m not sure</option>
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-slate-800">
            Notice period
          </label>
          <input
            name="noticePeriod"
            placeholder="Immediate, 2 weeks, 1 month..."
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none focus:border-[#172965] focus:ring-1 focus:ring-[#172965]/80"
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1">
          <label className="text-xs font-medium text-slate-800">
            Expected gross annual compensation
          </label>
          <input
            name="expectedSalary"
            placeholder="e.g. ₦6,000,000 per year"
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none focus:border-[#172965] focus:ring-1 focus:ring-[#172965]/80"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-slate-800">
            Current gross annual compensation (optional)
          </label>
          <input
            name="currentSalary"
            placeholder="Optional"
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none focus:border-[#172965] focus:ring-1 focus:ring-[#172965]/80"
          />
        </div>
      </div>

      <div className="space-y-1">
        <label className="text-xs font-medium text-slate-800">
          Short note (optional)
        </label>
        <textarea
          name="coverLetter"
          rows={4}
          placeholder="Tell us why you are interested in this role and what makes you a strong fit..."
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none focus:border-[#172965] focus:ring-1 focus:ring-[#172965]/80"
        />
      </div>

      <div className="space-y-1">
        <label className="text-xs font-medium text-slate-800">
          How did you hear about this role?
        </label>
        <select
          name="howHeard"
          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-[#172965] focus:ring-1 focus:ring-[#172965]/80"
        >
          <option value="">Select one</option>
          <option value="company_website">Company website</option>
          <option value="linkedin">LinkedIn</option>
          <option value="job_board">Job board</option>
          <option value="referral">Referral</option>
          <option value="social_media">Social media</option>
          <option value="recruiter">Recruiter contacted me</option>
          <option value="other">Other</option>
        </select>
      </div>

      {/* Consent */}
      <div className="space-y-2 border-t border-slate-100 pt-3">
        <label className="flex items-start gap-2 text-[11px] text-slate-600">
          <input
            type="checkbox"
            name="privacyConsent"
            required
            className="mt-[2px] h-3.5 w-3.5 rounded border-slate-300 text-[#172965] focus:ring-[#172965]"
          />
          <span>
            I consent to Resourcin processing my personal data for recruitment
            purposes in line with its Privacy Policy.
          </span>
        </label>
        <label className="flex items-start gap-2 text-[11px] text-slate-600">
          <input
            type="checkbox"
            name="termsConsent"
            required
            className="mt-[2px] h-3.5 w-3.5 rounded border-slate-300 text-[#172965] focus:ring-[#172965]"
          />
          <span>
            I confirm that the information provided is accurate and complete.
          </span>
        </label>
        <label className="flex items-start gap-2 text-[11px] text-slate-600">
          <input
            type="checkbox"
            name="marketingOptIn"
            className="mt-[2px] h-3.5 w-3.5 rounded border-slate-300 text-[#172965] focus:ring-[#172965]"
          />
          <span>
            I would like to receive updates about future job opportunities with
            Resourcin and its clients.
          </span>
        </label>
      </div>

      {/* Source (hidden) */}
      <input type="hidden" name="source" value="careers_site" />

      <button
        type="submit"
        className="inline-flex items-center justify-center rounded-full bg-[#172965] px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#111c4c] focus:outline-none focus:ring-2 focus:ring-[#172965]/70 focus:ring-offset-1"
      >
        Submit application
      </button>
    </form>
  );
}
