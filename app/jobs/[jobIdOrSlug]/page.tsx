// app/jobs/[jobIdOrSlug]/page.tsx
import type { ReactNode } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
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

type ParsedSections = {
  overview: string;
  responsibilities?: string;
  requirements?: string;
  aboutClient?: string;
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

/**
 * Parse a markdown-ish description into semantic sections.
 *
 * Expected pattern:
 * Intro text...
 *
 * ## Responsibilities
 * ...
 *
 * ## Requirements
 * ...
 *
 * ## About the client
 * ...
 */
function parseDescription(raw: string | null): ParsedSections {
  if (!raw) return { overview: "" };

  const text = raw.replace(/\r\n/g, "\n").trim();
  if (!text) return { overview: "" };

  const parts = text.split(/\n##\s+/); // split on "## Heading"
  const overview = parts[0]?.trim() ?? "";

  const sections: { title: string; body: string }[] = [];

  for (let i = 1; i < parts.length; i += 1) {
    const segment = parts[i];
    const [titleLine, ...restLines] = segment.split("\n");
    const title = titleLine.trim();
    const body = restLines.join("\n").trim();
    if (!title) continue;
    sections.push({ title, body });
  }

  const result: ParsedSections = { overview };

  for (const section of sections) {
    const lower = section.title.toLowerCase();

    if (lower.includes("responsibil")) {
      result.responsibilities = section.body;
      continue;
    }

    if (
      lower.includes("requirement") ||
      lower.includes("qualification") ||
      lower.includes("requirements")
    ) {
      result.requirements = section.body;
      continue;
    }

    if (
      lower.includes("about the client") ||
      lower.includes("about our client") ||
      lower.includes("about us") ||
      lower.includes("about the company") ||
      lower.includes("about company")
    ) {
      result.aboutClient = section.body;
    }
  }

  return result;
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

function MetaPill({ icon, label }: { icon: ReactNode; label: string }) {
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
      className="h-3.5 w-3.5 text-[#172965]"
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

function SectionBody({ text }: { text?: string }) {
  if (!text || !text.trim()) return null;
  return (
    <div className="prose prose-sm max-w-none">
      <p className="whitespace-pre-line text-sm leading-relaxed text-slate-700">
        {text}
      </p>
    </div>
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

  // Base query
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

  const parsed = parseDescription(job.description);
  const workModeLabel = deriveWorkMode(job);
  const appliedFlag = searchParams?.applied;
  const appliedSuccess = appliedFlag === "1";
  const appliedError = appliedFlag === "0";

  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <Link
        href="/jobs"
        className="text-[11px] text-slate-500 hover:text-slate-700 hover:underline"
      >
        ← Back to all jobs
      </Link>

      {appliedSuccess && (
        <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          Thank you. Your application has been received.
        </div>
      )}

      {appliedError && (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900">
          We couldn&apos;t submit your application. Please try again or email
          your CV directly.
        </div>
      )}

      {/* HERO */}
      <header className="mt-6 border-b border-slate-100 pb-5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
          For candidates
        </p>
        <h1 className="mt-1 text-2xl font-semibold text-slate-900">
          {job.title}
        </h1>

        <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-slate-600">
          {job.location && (
            <MetaPill icon={<IconLocation />} label={job.location} />
          )}
          {workModeLabel && (
            <MetaPill icon={<IconGlobe />} label={workModeLabel} />
          )}
          {job.employment_type && (
            <MetaPill icon={<IconBriefcase />} label={job.employment_type} />
          )}
          {job.seniority && (
            <MetaPill icon={<IconStar />} label={job.seniority} />
          )}
          {job.department && (
            <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-[11px] text-slate-700">
              {job.department}
            </span>
          )}
        </div>

        {job.created_at && (
          <p className="mt-2 text-[11px] text-slate-500">
            Posted {formatDate(job.created_at)}
          </p>
        )}
      </header>

      {/* BODY GRID: content + side column */}
      <div className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,1.7fr)_minmax(0,1.2fr)]">
        {/* LEFT: main content */}
        <article className="space-y-8">
          {/* Overview */}
          <section>
            <h2 className="text-sm font-semibold text-slate-900">
              Overview of the role
            </h2>
            <div className="mt-2">
              <SectionBody text={parsed.overview} />
            </div>
          </section>

          {/* Responsibilities */}
          {parsed.responsibilities && (
            <section>
              <h2 className="text-sm font-semibold text-slate-900">
                Key responsibilities
              </h2>
              <div className="mt-2">
                <SectionBody text={parsed.responsibilities} />
              </div>
            </section>
          )}

          {/* Requirements */}
          {parsed.requirements && (
            <section>
              <h2 className="text-sm font-semibold text-slate-900">
                Requirements
              </h2>
              <div className="mt-2">
                <SectionBody text={parsed.requirements} />
              </div>
            </section>
          )}

          {/* About client */}
          {parsed.aboutClient && (
            <section>
              <h2 className="text-sm font-semibold text-slate-900">
                About the client
              </h2>
              <div className="mt-2">
                <SectionBody text={parsed.aboutClient} />
              </div>
            </section>
          )}

          {/* Fallback: If description had no headings at all, you still get full text */}
          {!parsed.responsibilities &&
            !parsed.requirements &&
            !parsed.aboutClient &&
            job.description && (
              <section>
                <h2 className="text-sm font-semibold text-slate-900">
                  Full description
                </h2>
                <div className="mt-2">
                  <SectionBody text={job.description} />
                </div>
              </section>
            )}

          {/* Tags */}
          {job.tags && job.tags.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold text-slate-900">
                Skills & focus areas
              </h2>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {job.tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center rounded-full bg-slate-50 px-2 py-0.5 text-[10px] font-medium text-slate-700"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </section>
          )}
        </article>

        {/* RIGHT: meta + apply */}
        <aside className="space-y-4">
          {/* Role details card */}
          <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
              Role details
            </h2>
            <dl className="mt-3 space-y-2 text-[11px] text-slate-600">
              {job.location && (
                <div className="flex items-start justify-between gap-3">
                  <dt className="text-slate-500">Location</dt>
                  <dd className="text-right">{job.location}</dd>
                </div>
              )}
              {workModeLabel && (
                <div className="flex items-start justify-between gap-3">
                  <dt className="text-slate-500">Work mode</dt>
                  <dd className="text-right">{workModeLabel}</dd>
                </div>
              )}
              {job.employment_type && (
                <div className="flex items-start justify-between gap-3">
                  <dt className="text-slate-500">Employment type</dt>
                  <dd className="text-right">{job.employment_type}</dd>
                </div>
              )}
              {job.seniority && (
                <div className="flex items-start justify-between gap-3">
                  <dt className="text-slate-500">Seniority</dt>
                  <dd className="text-right">{job.seniority}</dd>
                </div>
              )}
              {job.department && (
                <div className="flex items-start justify-between gap-3">
                  <dt className="text-slate-500">Function / client</dt>
                  <dd className="text-right">{job.department}</dd>
                </div>
              )}
              {job.created_at && (
                <div className="flex items-start justify-between gap-3">
                  <dt className="text-slate-500">Posted</dt>
                  <dd className="text-right">
                    {formatDate(job.created_at)}
                  </dd>
                </div>
              )}
            </dl>
          </section>

          {/* Apply card */}
          <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="text-sm font-semibold text-slate-900">
              Apply for this role
            </h2>
            <p className="mt-1 text-xs text-slate-600">
              You can apply without creating an account. We&apos;ll add you to
              our talent pool and only reach out when there&apos;s a strong
              match.
            </p>

            {!appliedSuccess && (
              <ApplicationForm
                jobId={job.id}
                tenantId={job.tenant_id}
                slug={job.slug}
              />
            )}

            {appliedSuccess && (
              <p className="mt-3 text-[11px] text-slate-500">
                Your application for this role has been recorded. You can still{" "}
                <Link
                  href="/jobs"
                  className="font-medium text-[#172965] hover:underline"
                >
                  browse other roles
                </Link>
                .
              </p>
            )}
          </section>
        </aside>
      </div>
    </main>
  );
}

// --- Application form (unchanged contract so your /api/job-applications keeps working) ---

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
      className="mt-4 space-y-4"
    >
      <input type="hidden" name="jobId" value={jobId} />
      <input type="hidden" name="tenantId" value={tenantId} />
      <input type="hidden" name="jobSlug" value={slug ?? ""} />

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1">
          <label className="text-xs font-medium text-slate-800">
            Full name *
          </label>
          <input
            name="fullName"
            required
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none focus:border-[#172965] focus:ring-1 focus:ring-[#172965]/80"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-slate-800">
            Email address *
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
          <label className="text-xs font-medium text-slate-800">Phone</label>
          <input
            name="phone"
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

      <div className="space-y-1">
        <label className="text-xs font-medium text-slate-800">
          CV / Résumé (PDF or Word)
        </label>
        <input
          type="file"
          name="cv"
          accept=".pdf,.doc,.docx"
          className="w-full text-xs text-slate-700"
        />
        <p className="text-[11px] text-slate-500">
          If you have trouble uploading, you can also email your CV to us after
          submitting.
        </p>
      </div>

      <div className="space-y-1">
        <label className="text-xs font-medium text-slate-800">
          Short note (optional)
        </label>
        <textarea
          name="coverLetter"
          rows={4}
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none focus:border-[#172965] focus:ring-1 focus:ring-[#172965]/80"
        />
      </div>

      <button
        type="submit"
        className="inline-flex items-center justify-center rounded-full bg-[#172965] px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#111c4c] focus:outline-none focus:ring-2 focus:ring-[#172965]/70 focus:ring-offset-1"
      >
        Submit application
      </button>
    </form>
  );
}
