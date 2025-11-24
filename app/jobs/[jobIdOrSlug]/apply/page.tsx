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
    "Submit your application for an open mandate managed by Resourcin.",
};

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    value
  );
}

export default async function JobApplyPage({
  params,
}: {
  params: { jobIdOrSlug: string };
}) {
  const identifier = params.jobIdOrSlug;

  const selectFields = `
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
  `;

  let job: PublicJobApplyJob | null = null;

  // 1) Try slug
  const { data: slugData, error: slugError } = await supabaseAdmin
    .from("jobs")
    .select(selectFields)
    .eq("slug", identifier)
    .eq("visibility", "public")
    .eq("status", "open")
    .limit(1);

  if (slugError) {
    console.error("Job apply – error querying by slug:", slugError);
  }

  if (slugData && slugData.length > 0) {
    job = slugData[0] as PublicJobApplyJob;
  } else if (isUuid(identifier)) {
    // 2) Try id as fallback
    const { data: idData, error: idError } = await supabaseAdmin
      .from("jobs")
      .select(selectFields)
      .eq("id", identifier)
      .eq("visibility", "public")
      .eq("status", "open")
      .limit(1);

    if (idError) {
      console.error("Job apply – error querying by id:", idError);
    }

    job = (idData?.[0] as PublicJobApplyJob | undefined) || null;
  }

  if (!job) {
    notFound();
  }

  const slugOrId = job.slug || job.id;

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-4 text-[11px] text-slate-500">
        <Link
          href={`/jobs/${encodeURIComponent(slugOrId)}`}
          className="inline-flex items-center gap-1 text-slate-500 hover:text-[#172965]"
        >
          <span aria-hidden="true">←</span>
          <span>Back to role</span>
        </Link>
      </div>

      <PublicJobApplyForm job={job} />
    </main>
  );
}
