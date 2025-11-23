// app/jobs/[jobIdOrSlug]/page.tsx
import { notFound } from "next/navigation";
import Link from "next/link";
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
  tags: string[] | null;
  created_at: string | null;
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

function formatEmploymentType(value: string | null) {
  if (!value) return null;
  const lower = value.toLowerCase();
  if (lower === "full-time" || lower === "full_time") return "Full-time";
  if (lower === "part-time" || lower === "part_time") return "Part-time";
  if (lower === "contract") return "Contract";
  if (lower === "internship") return "Internship";
  return value;
}

export default async function JobDetailPage({
  params,
  searchParams,
}: PageProps) {
  const rawParam = params.jobIdOrSlug;

  // If the param is missing or literally "undefined", treat as 404
  if (!rawParam || rawParam === "undefined") {
    notFound();
  }

  const slugOrId = decodeURIComponent(rawParam);
  const isUuid = looksLikeUuid(slugOrId);

  // 1) Build query *only* with columns that exist on `jobs`
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
      tags,
      created_at
    `
    )
    .limit(1);

  if (isUuid) {
    query = query.eq("id", slugOrId);
  } else {
    query = query.eq("slug", slugOrId);
  }

  const { data, error } = await query.maybeSingle();

  if (error) {
    console.error("Job detail – error loading job:", error);
  }

  const job = (data as JobRow | null) ?? null;

  if (!job) {
    notFound();
  }

  const appliedFlag = searchParams?.applied;
  const createdLabel = formatDate(job.created_at);
  const employmentTypeLabel = formatEmploymentType(job.employment_type);

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <Link
        href="/jobs"
        className="text-[11px] text-slate-500 hover:text-slate-700 hover:underline"
      >
        ← Back to all jobs
      </Link>

      {/* Success / error banners */}
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
        {/* Header card */}
        <header className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                Open role
              </p>
              <h1 className="mt-1 text-2xl font-semibold text-slate-900">
                {job.title}
              </h1>
              {createdLabel && (
                <p className="mt-1 text-[11px] text-slate-500">
                  Posted {createdLabel}
                </p>
              )}
            </div>

            <div className="flex flex-col items-start gap-2 text-[11px] text-slate-600 sm:items-end">
              <div className="flex flex-wrap gap-1">
                {job.location && (
                  <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1">
                    <span className="mr-1" aria-hidden="true">
                      📍
                    </span>
                    {job.location}
                  </span>
                )}
                {employmentTypeLabel && (
                  <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1">
                    <span className="mr-1" aria-hidden="true">
                      💼
                    </span>
                    {employmentTypeLabel}
                  </span>
                )}
                {job.seniority && (
                  <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1">
                    <span className="mr-1" aria-hidden="true">
                      ⭐
                    </span>
                    {job.seniority}
                  </span>
                )}
              </div>
            </div>
          </div>

          {job.tags && job.tags.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1">
              {job.tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center rounded-full bg-slate-50 px-2.5 py-0.5 text-[10px] font-medium text-slate-700"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </header>

        {/* Overview / structure, still powered by single description field */}
        <section className="space-y-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">
              Overview of the role
            </h2>
            <p className="mt-1 text-sm text-slate-700">
              This overview helps candidates quickly understand why the role
              exists, what success looks like, and how it fits into the wider
              business. You can refine this copy inside the job description that
              lives in your ATS.
            </p>
          </div>

          <div>
            <h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
              Snapshot
            </h3>
            <dl className="mt-2 grid gap-3 text-[11px] text-slate-700 sm:grid-cols-2">
              <div>
                <dt className="font-medium text-slate-800">Function</dt>
                <dd>{job.department || "Not specified"}</dd>
              </div>
              <div>
                <dt className="font-medium text-slate-800">Location</dt>
                <dd>{job.location || "Location flexible"}</dd>
              </div>
              <div>
                <dt className="font-medium text-slate-800">
                  Employment type
                </dt>
                <dd>{employmentTypeLabel || "Not specified"}</dd>
              </div>
              <div>
                <dt className="font-medium text-slate-800">Seniority</dt>
                <dd>{job.seniority || "Not specified"}</dd>
              </div>
            </dl>
          </div>

          {job.description && (
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                Full description
              </h3>
              <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-slate-800">
                {job.description}
              </p>
            </div>
          )}
        </section>

        {/* Application form */}
        <section className="space-y-2">
          <h2 className="text-lg font-semibold text-slate-900">
            Apply for this role
          </h2>
          <p className="text-xs text-slate-600">
            Fields marked with <span className="text-red-500">*</span> are
            compulsory. You can apply without creating an account; we&apos;ll
            add you to our talent pool and reach out when there&apos;s a strong
            match.
          </p>

          <ApplicationForm
            jobId={job.id}
            tenantId={job.tenant_id}
            slug={job.slug}
            jobLocation={job.location}
          />
        </section>
      </article>
    </main>
  );
}

type ApplicationFormProps = {
  jobId: string;
  tenantId: string;
  slug: string | null;
  jobLocation: string | null;
};

function ApplicationForm({
  jobId,
  tenantId,
  slug,
  jobLocation,
}: ApplicationFormProps) {
  return (
    <form
      action="/api/job-applications"
      method="POST"
      encType="multipart/form-data"
      className="mt-3 space-y-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
    >
      {/* Hidden metadata */}
      <input type="hidden" name="jobId" value={jobId} />
      <input type="hidden" name="tenantId" value={tenantId} />
      <input type="hidden" name="jobSlug" value={slug ?? ""} />

      {/* SECTION 1: PERSONAL INFORMATION */}
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
            Phone number <span className="text-red-500">*</span>
          </label>
          <input
            name="phone"
            required
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
            defaultValue={jobLocation ?? ""}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none focus:border-[#172965] focus:ring-1 focus:ring-[#172965]/80"
          />
        </div>
      </div>

      {/* SECTION 2: PROFESSIONAL LINKS */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1">
          <label className="text-xs font-medium text-slate-800">
            LinkedIn profile
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

      {/* SECTION 3: DOCUMENTS */}
      <div className="space-y-1">
        <label className="text-xs font-medium text-slate-800">
          Résumé / CV <span className="text-red-500">*</span>
        </label>
        <input
          type="file"
          name="cv"
          required
          accept=".pdf,.doc,.docx"
          className="w-full text-xs text-slate-700"
        />
        <p className="text-[11px] text-slate-500">
          Upload a PDF or Word document (max ~5MB). If you have trouble
          uploading, you can also email your CV after submitting.
        </p>
      </div>

      {/* SECTION 4: SCREENING QUESTIONS */}
      <div className="space-y-2">
        <h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
          Screening questions
        </h3>

        <div className="space-y-1">
          <label className="text-xs font-medium text-slate-800">
            Do you have a valid work permit for the country of this role?
            <span className="text-red-500"> *</span>
          </label>
          <div className="mt-1 flex gap-4 text-xs text-slate-700">
            <label className="inline-flex items-center gap-1">
              <input
                type="radio"
                name="hasWorkPermit"
                value="yes"
                required
                className="h-3 w-3 border-slate-300 text-[#172965] focus:ring-[#172965]"
              />
              Yes
            </label>
            <label className="inline-flex items-center gap-1">
              <input
                type="radio"
                name="hasWorkPermit"
                value="no"
                className="h-3 w-3 border-slate-300 text-[#172965] focus:ring-[#172965]"
              />
              No
            </label>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-800">
              Current gross annual compensation (optional)
            </label>
            <input
              name="currentGross"
              placeholder="e.g. ₦5,000,000 per year"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none focus:border-[#172965] focus:ring-1 focus:ring-[#172965]/80"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-800">
              Expected gross annual compensation{" "}
              <span className="text-red-500">*</span>
            </label>
            <input
              name="expectedGross"
              required
              placeholder="e.g. ₦7,000,000 – ₦9,000,000 per year"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none focus:border-[#172965] focus:ring-1 focus:ring-[#172965]/80"
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium text-slate-800">
            Notice period <span className="text-red-500">*</span>
          </label>
          <input
            name="noticePeriod"
            required
            placeholder="e.g. Immediately, 2 weeks, 1 month"
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none focus:border-[#172965] focus:ring-1 focus:ring-[#172965]/80"
          />
        </div>
      </div>

      {/* SECTION 5: COVER LETTER */}
      <div className="space-y-1">
        <label className="text-xs font-medium text-slate-800">
          Short note / cover letter (optional)
        </label>
        <textarea
          name="coverLetter"
          rows={5}
          maxLength={2000}
          placeholder="Tell us why you're interested in this role and what makes you a great fit..."
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none focus:border-[#172965] focus:ring-1 focus:ring-[#172965]/80"
        />
        <p className="text-[11px] text-slate-500">
          You can paste a short cover letter or share any context you think is
          useful (max ~2000 characters).
        </p>
      </div>

      {/* SECTION 6: CONSENT */}
      <div className="space-y-2 text-[11px] text-slate-700">
        <label className="flex items-start gap-2">
          <input
            type="checkbox"
            name="dataConsent"
            required
            className="mt-0.5 h-3 w-3 border-slate-300 text-[#172965] focus:ring-[#172965]"
          />
          <span>
            I consent to Resourcin processing my personal data for recruitment
            purposes in line with their Privacy Policy.
          </span>
        </label>

        <label className="flex items-start gap-2">
          <input
            type="checkbox"
            name="infoAccurate"
            required
            className="mt-0.5 h-3 w-3 border-slate-300 text-[#172965] focus:ring-[#172965]"
          />
          <span>
            I confirm that the information provided is accurate and complete.
          </span>
        </label>

        <label className="flex items-start gap-2">
          <input
            type="checkbox"
            name="talentUpdates"
            className="mt-0.5 h-3 w-3 border-slate-300 text-[#172965] focus:ring-[#172965]"
          />
          <span>
            I would like to receive updates about future job opportunities with
            Resourcin and its clients.
          </span>
        </label>
      </div>

      {/* ACTIONS */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
        <button
          type="submit"
          className="inline-flex items-center justify-center rounded-full bg-[#172965] px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#111c4c] focus:outline-none focus:ring-2 focus:ring-[#172965]/70 focus:ring-offset-1"
        >
          Submit application
        </button>

        <p className="text-[11px] text-slate-500">
          After submitting, you&apos;ll see a confirmation page and we&apos;ll
          email you with next steps.
        </p>
      </div>
    </form>
  );
}
