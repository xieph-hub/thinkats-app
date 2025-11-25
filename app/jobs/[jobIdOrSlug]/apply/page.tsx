// app/jobs/[jobIdOrSlug]/apply/page.tsx
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import {
  PublicJobApplyForm,
  type PublicJobApplyJob,
} from "@/components/jobs/PublicJobApplyForm";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Apply for this role | Resourcin",
  description:
    "Submit your application directly into the Resourcin ATS pipeline for this mandate.",
};

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    value
  );
}

async function fetchJobForApply(
  identifier: string
): Promise<PublicJobApplyJob | null> {
  // First: try by slug
  const { data: slugData, error: slugError } = await supabaseAdmin
    .from("jobs")
    .select(
      `
      id,
      slug,
      title,
      short_description,
      department,
      location,
      location_type,
      employment_type,
      experience_level,
      salary_min,
      salary_max,
      salary_currency,
      salary_visible,
      work_mode,
      tags,
      created_at,
      confidential,
      client_company:client_companies (
        name,
        logo_url,
        slug
      )
    `
    )
    .eq("slug", identifier)
    .eq("visibility", "public")
    .limit(1);

  if (slugError) {
    console.error("Apply page – error querying job by slug:", slugError);
  }

  let row = (slugData?.[0] as PublicJobApplyJob | undefined) || null;

  // Fallback: if not found and identifier looks like a UUID, try by id
  if (!row && isUuid(identifier)) {
    const { data: idData, error: idError } = await supabaseAdmin
      .from("jobs")
      .select(
        `
        id,
        slug,
        title,
        short_description,
        department,
        location,
        location_type,
        employment_type,
        experience_level,
        salary_min,
        salary_max,
        salary_currency,
        salary_visible,
        work_mode,
        tags,
        created_at,
        confidential,
        client_company:client_companies (
          name,
          logo_url,
          slug
        )
      `
      )
      .eq("id", identifier)
      .eq("visibility", "public")
      .limit(1);

    if (idError) {
      console.error("Apply page – error querying job by id:", idError);
    }

    row = (idData?.[0] as PublicJobApplyJob | undefined) || null;
  }

  return row;
}

export default async function ApplyPage({
  params,
}: {
  params: { jobIdOrSlug: string };
}) {
  const identifier = params.jobIdOrSlug;
  const job = await fetchJobForApply(identifier);

  if (!job) {
    notFound();
  }

  const slugOrId = job.slug || job.id;

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      {/* Breadcrumb */}
      <div className="mb-4 text-[11px] text-slate-500">
        <Link
          href={`/jobs/${encodeURIComponent(slugOrId)}`}
          className="inline-flex items-center gap-1 text-slate-500 hover:text-[#172965]"
        >
          <span aria-hidden="true">←</span>
          <span>Back to role details</span>
        </Link>
      </div>

      {/* Apply form + recap */}
      <PublicJobApplyForm job={job} />
    </main>
  );
}
