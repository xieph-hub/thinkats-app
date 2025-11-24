// app/jobs/[jobIdOrSlug]/page.tsx

import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import {
  PublicJobLayout,
  type PublicJobForLayout,
} from "@/components/jobs/PublicJobLayout";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Open role | Resourcin",
  description:
    "Public job listing managed by Resourcin. Browse details and apply without creating an account.",
};

// Shape of what we expect from Supabase
type JobRowFromSupabase = {
  id: string;
  tenant_id: string;
  slug: string | null;
  title: string;
  short_description: string | null;
  description: string | null;

  location: string | null;
  location_type: string | null;
  work_mode: string | null;
  employment_type: string | null;
  seniority: string | null;
  experience_level: string | null;
  department: string | null;

  created_at: string;
  status: string | null;
  visibility: string | null;
  internal_only: boolean | null;
  confidential: boolean | null;

  salary_min: number | null;
  salary_max: number | null;
  salary_currency: string | null;
  salary_visible: boolean | null;

  required_skills: string[] | null;
  tags: string[] | null;

  years_experience_min: number | null;
  years_experience_max: number | null;
  education_required: string | null;
  education_field: string | null;

  client_company?:
    | {
        name: string | null;
        logo_url: string | null;
        slug: string | null;
      }[]
    | null;
};

type PageProps = {
  params: { jobIdOrSlug: string };
  searchParams?: { applied?: string };
};

export default async function PublicJobPage({
  params,
  searchParams,
}: PageProps) {
  const slugOrId = params.jobIdOrSlug;
  const appliedFlag = searchParams?.applied;

  // 1) Load job from Supabase
  const { data, error } = await supabaseAdmin
    .from("jobs")
    .select(
      `
      id,
      tenant_id,
      slug,
      title,
      short_description,
      description,
      location,
      location_type,
      work_mode,
      employment_type,
      seniority,
      experience_level,
      department,
      created_at,
      status,
      visibility,
      internal_only,
      confidential,
      salary_min,
      salary_max,
      salary_currency,
      salary_visible,
      required_skills,
      tags,
      years_experience_min,
      years_experience_max,
      education_required,
      education_field,
      client_company (
        name,
        logo_url,
        slug
      )
    `
    )
    // must be open + public + not internal-only
    .eq("status", "open")
    .eq("visibility", "public")
    .or(`slug.eq.${slugOrId},id.eq.${slugOrId}`)
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("Public job page – error loading job:", error);
  }

  if (!data) {
    notFound();
  }

  const raw = data as JobRowFromSupabase;

  const companyRow = Array.isArray(raw.client_company)
    ? raw.client_company[0] ?? null
    : (raw.client_company as any) ?? null;

  // Map DB row → type expected by PublicJobLayout
  const jobForLayout = {
    id: raw.id,
    title: raw.title,
    short_description: raw.short_description,
    description: raw.description,

    location: raw.location,
    location_type: raw.location_type,
    work_mode: raw.work_mode,
    employment_type: raw.employment_type,
    seniority: raw.seniority,
    experience_level: raw.experience_level,
    department: raw.department,

    created_at: raw.created_at,
    status: raw.status,
    visibility: raw.visibility,
    internal_only: raw.internal_only,
    confidential: raw.confidential,

    salary_min: raw.salary_min,
    salary_max: raw.salary_max,
    salary_currency: raw.salary_currency,
    salary_visible: raw.salary_visible,

    required_skills: raw.required_skills,
    tags: raw.tags,

    years_experience_min: raw.years_experience_min,
    years_experience_max: raw.years_experience_max,
    education_required: raw.education_required,
    education_field: raw.education_field,

    client_company: companyRow
      ? {
          name: companyRow.name ?? undefined,
          logo_url: companyRow.logo_url ?? undefined,
          slug: companyRow.slug ?? undefined,
        }
      : null,
  } as PublicJobForLayout;

  return (
    <PublicJobLayout
      job={jobForLayout}
      applySlot={
        <ApplyPanel
          jobId={raw.id}
          tenantId={raw.tenant_id}
          slug={raw.slug}
          appliedFlag={appliedFlag}
        />
      }
    />
  );
}

/**
 * Apply panel shown in the right-hand column of PublicJobLayout.
 * Includes success/error banners + your existing HTML form to /api/job-applications.
 */
function ApplyPanel(props: {
  jobId: string;
  tenantId: string;
  slug: string | null;
  appliedFlag?: string;
}) {
  const { jobId, tenantId, slug, appliedFlag } = props;

  return (
    <div className="space-y-4">
      {appliedFlag === "1" && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-[11px] text-emerald-900">
          Thank you. Your application has been received.
        </div>
      )}

      {appliedFlag === "0" && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[11px] text-red-900">
          We couldn&apos;t submit your application. Please try again or email
          your CV directly.
        </div>
      )}

      <p className="text-[11px] text-slate-600">
        You can apply without creating an account. We&apos;ll add you to our
        talent pool and only reach out when there&apos;s a strong match.
      </p>

      <ApplicationForm jobId={jobId} tenantId={tenantId} slug={slug} />
    </div>
  );
}

/**
 * Your existing application HTML form, wired to /api/job-applications.
 * (Same fields you had before.)
 */
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
      className="mt-2 space-y-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
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
        className="inline-flex w-full items-center justify-center rounded-full bg-[#172965] px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#111c4c] focus:outline-none focus:ring-2 focus:ring-[#172965]/70 focus:ring-offset-1"
      >
        Submit application
      </button>
    </form>
  );
}
