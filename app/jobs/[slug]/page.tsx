// app/jobs/[jobIdOrSlug]/page.tsx
import { notFound } from "next/navigation";
import Link from "next/link";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

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

export default async function JobDetailPage({
  params,
  searchParams,
}: PageProps) {
  const rawParam = params.jobIdOrSlug;

  // If the param is missing or literally "undefined", treat it as 404
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
      created_at
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

  const appliedFlag = searchParams?.applied;

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

      <article className="mt-6 space-y-6">
        <header className="space-y-2">
          <h1 className="text-2xl font-semibold text-slate-900">
            {job.title}
          </h1>
          <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-600">
            <span>{job.location || "Location flexible"}</span>
            {job.employment_type && (
              <>
                <span className="text-slate-300">•</span>
                <span>{job.employment_type}</span>
              </>
            )}
            {job.seniority && (
              <>
                <span className="text-slate-300">•</span>
                <span className="uppercase tracking-wide">
                  {job.seniority}
                </span>
              </>
            )}
          </div>
          {job.created_at && (
            <p className="text-[11px] text-slate-500">
              Posted {formatDate(job.created_at)}
            </p>
          )}
        </header>

        {job.description && (
          <section className="prose prose-sm max-w-none">
            <p className="whitespace-pre-line text-sm leading-relaxed text-slate-700">
              {job.description}
            </p>
          </section>
        )}

        <section className="mt-8">
          <h2 className="text-lg font-semibold text-slate-900">
            Apply for this role
          </h2>
          <p className="mt-1 text-xs text-slate-600">
            You can apply without creating an account. We&apos;ll add you to our
            talent pool and only reach out when there&apos;s a strong match.
          </p>

          <ApplicationForm jobId={job.id} tenantId={job.tenant_id} slug={job.slug} />
        </section>
      </article>
    </main>
  );
}

function ApplicationForm(props: { jobId: string; tenantId: string; slug: string | null }) {
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
          <label className="text-xs font-medium text-slate-800">Location</label>
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
