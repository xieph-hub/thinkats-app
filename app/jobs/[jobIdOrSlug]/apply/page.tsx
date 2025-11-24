// app/jobs/[jobIdOrSlug]/apply/page.tsx
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { ApplicationSuccessBanner } from "@/components/jobs/ApplicationSuccessBanner";
import { JobApplicationForm } from "@/components/jobs/JobApplicationForm"; // adjust path if needed

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Apply for this role | Resourcin",
  description:
    "Submit your application for this open mandate via Resourcin.",
};

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    value
  );
}

type JobMini = {
  id: string;
  slug: string | null;
  title: string;
  location: string | null;
};

export default async function ApplyPage({
  params,
}: {
  params: { jobIdOrSlug: string };
}) {
  const identifier = params.jobIdOrSlug;

  // Resolve job just to show title/location at top of apply page
  let job: JobMini | null = null;

  const baseSelect = "id, slug, title, location, visibility";
  if (isUuid(identifier)) {
    const { data } = await supabaseAdmin
      .from("jobs")
      .select(baseSelect)
      .eq("id", identifier)
      .eq("visibility", "public")
      .limit(1);
    job = (data?.[0] as JobMini | undefined) || null;
  } else {
    const { data } = await supabaseAdmin
      .from("jobs")
      .select(baseSelect)
      .eq("slug", identifier)
      .eq("visibility", "public")
      .limit(1);
    job = (data?.[0] as JobMini | undefined) || null;
  }

  if (!job) {
    notFound();
  }

  const slugOrId = job.slug || job.id;

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      {/* Success banner driven by ?applied=1 */}
      <ApplicationSuccessBanner />

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

      {/* Header */}
      <header className="mb-4 border-b border-slate-100 pb-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
          Application
        </p>
        <h1 className="mt-1 text-xl font-semibold text-slate-900">
          Apply for {job.title}
        </h1>
        {job.location && (
          <p className="mt-1 text-[11px] text-slate-500">{job.location}</p>
        )}
        <p className="mt-2 max-w-2xl text-xs text-slate-600">
          Share a current CV and a few details so we can assess fit for this
          role and similar mandates. You don&apos;t need an account to apply.
        </p>
      </header>

      {/* Application form */}
      <JobApplicationForm jobIdOrSlug={slugOrId} />
    </main>
  );
}
