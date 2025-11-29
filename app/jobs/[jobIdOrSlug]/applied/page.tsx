// app/jobs/[jobIdOrSlug]/applied/page.tsx
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Application received | Resourcin",
  description:
    "Confirmation that your application has been received by Resourcin.",
};

type PageProps = {
  params: { jobIdOrSlug: string };
};

type JobRow = {
  id: string;
  slug: string | null;
  title: string;
  location: string | null;
  short_description: string | null;
  confidential: boolean | null;
};

function looksLikeUuid(value: string): boolean {
  return /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(
    value,
  );
}

export default async function JobAppliedPage({ params }: PageProps) {
  const { jobIdOrSlug } = params;
  const isUuid = looksLikeUuid(jobIdOrSlug);

  let query = supabaseAdmin
    .from("jobs")
    .select(
      `
      id,
      slug,
      title,
      location,
      short_description,
      confidential
    `,
    )
    .eq("visibility", "public");

  if (isUuid) {
    query = query.eq("id", jobIdOrSlug);
  } else {
    query = query.eq("slug", jobIdOrSlug);
  }

  const { data, error } = await query.maybeSingle();

  if (error) {
    console.error("Error loading job for applied page:", error);
  }

  if (!data) {
    notFound();
  }

  const job = data as JobRow;

  const canonicalPath = job.slug
    ? `/jobs/${encodeURIComponent(job.slug)}`
    : `/jobs/${encodeURIComponent(job.id)}`;

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <section className="border-b border-slate-200 bg-gradient-to-br from-white via-white to-[#172965]/4">
        <div className="mx-auto max-w-5xl px-4 py-10 sm:py-14">
          <div className="mb-4 flex flex-wrap items-center gap-2 text-xs text-slate-500">
            <Link
              href="/jobs"
              className="inline-flex items-center gap-1 hover:text-[#172965]"
            >
              ← All roles
            </Link>
            <span className="h-0.5 w-0.5 rounded-full bg-slate-300" />
            <Link
              href={canonicalPath}
              className="inline-flex items-center gap-1 hover:text-[#172965]"
            >
              {job.title}
            </Link>
          </div>

          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100">
                <span className="text-lg" aria-hidden="true">
                  ✅
                </span>
              </div>
              <div>
                <h1 className="text-2xl font-semibold tracking-tight text-[#172965] sm:text-3xl">
                  Application received
                </h1>
                <p className="mt-1 text-sm text-slate-700">
                  This is to acknowledge receipt of your application. A member
                  of our recruitment team will reach out to you if you are a
                  good fit for the role.
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  A confirmation email has also been sent to you.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Link
                href={canonicalPath}
                className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-[#172965] hover:bg-slate-50"
              >
                View role again
              </Link>
              <Link
                href="/jobs"
                className="inline-flex items-center justify-center rounded-full bg-[#172965] px-4 py-2 text-xs font-semibold text-white hover:bg-[#0f1c48]"
              >
                Browse other roles
              </Link>
            </div>
          </div>

          {job.short_description && (
            <p className="mt-6 max-w-2xl text-sm text-slate-700">
              You just applied for:{" "}
              <span className="font-semibold">{job.title}</span>
              {job.location ? ` · ${job.location}` : ""}. {job.short_description}
            </p>
          )}
        </div>
      </section>
    </main>
  );
}
