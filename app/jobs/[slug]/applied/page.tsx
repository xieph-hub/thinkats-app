// app/jobs/[slug]/applied/page.tsx
import Link from "next/link";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const revalidate = 0;
export const dynamic = "force-dynamic";

type PageProps = {
  params: { slug: string };
};

type JobTitleRow = {
  id: string;
  title: string | null;
};

// simple UUID pattern: 8-4-4-4-12 hex segments
function looksLikeUuid(value: string) {
  return /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(
    value
  );
}

export default async function JobApplicationThankYouPage({ params }: PageProps) {
  const rawParam = params.slug;
  const slugOrId = decodeURIComponent(rawParam);

  let jobTitle: string | null = null;

  // Try find job by slug first
  const { data: slugData, error: slugError } = await supabaseAdmin
    .from("jobs")
    .select("id, title")
    .eq("slug", slugOrId)
    .limit(1);

  if (!slugError && slugData && slugData.length > 0) {
    jobTitle = (slugData[0] as JobTitleRow).title;
  } else if (looksLikeUuid(slugOrId)) {
    // Fallback: if it looks like a UUID, try by id
    const { data: idData, error: idError } = await supabaseAdmin
      .from("jobs")
      .select("id, title")
      .eq("id", slugOrId)
      .limit(1);

    if (!idError && idData && idData.length > 0) {
      jobTitle = (idData[0] as JobTitleRow).title;
    }
  }

  return (
    <main className="mx-auto flex min-h-[60vh] max-w-md flex-col justify-center px-4 py-12">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-600">
          Application received
        </p>

        <h1 className="mt-2 text-xl font-semibold text-slate-900">
          Thank you for applying
          {jobTitle ? (
            <>
              {" "}
              for <span className="block text-base font-normal">{jobTitle}</span>
            </>
          ) : null}
        </h1>

        <p className="mt-3 text-sm text-slate-600">
          We&apos;ve added your profile to our pipeline. If there&apos;s a strong
          match, someone from Resourcin or the client team will reach out with
          next steps.
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/jobs"
            className="inline-flex items-center justify-center rounded-full bg-[#172965] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#111c4c]"
          >
            Back to all jobs
          </Link>

          <Link
            href={`/jobs/${encodeURIComponent(slugOrId)}`}
            className="inline-flex items-center justify-center rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            View this role again
          </Link>
        </div>
      </section>
    </main>
  );
}
