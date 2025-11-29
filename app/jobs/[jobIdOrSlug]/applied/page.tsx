// app/jobs/[jobIdOrSlug]/applied/page.tsx
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Application received | Resourcin",
  description:
    "Confirmation page for applications submitted to roles managed by Resourcin.",
};

type PageProps = {
  params: { jobIdOrSlug: string };
};

type JobRow = {
  id: string;
  slug: string | null;
  title: string;
  location: string | null;
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
        location
      `,
    )
    .eq("visibility", "public")
    .eq("status", "open");

  if (isUuid) {
    query = query.eq("id", jobIdOrSlug);
  } else {
    query = query.eq("slug", jobIdOrSlug);
  }

  const { data, error } = await query.maybeSingle();

  if (error) {
    console.error("Error loading job in applied page:", error);
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
      {/* Top header + breadcrumbs */}
      <section className="border-b border-slate-200 bg-gradient-to-br from-white via-white to-[#172965]/4">
        <div className="mx-auto max-w-5xl px-4 py-8 sm:py-10">
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
              Back to role page
            </Link>
          </div>

          <h1 className="text-2xl font-semibold tracking-tight text-[#172965] sm:text-3xl">
            Application received
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-700">
            Thank you for applying for{" "}
            <span className="font-semibold">{job.title}</span>
            {job.location ? ` in ${job.location}` : ""}. This is to acknowledge
            receipt of your application. A member of our recruitment team will
            reach out to you if you are a good fit for the role.
          </p>
        </div>
      </section>

      {/* Centered confirmation card */}
      <section className="mx-auto max-w-5xl px-4 py-10">
        <div className="mx-auto max-w-lg rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-700 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
              ✓
            </div>
            <div>
              <h2 className="text-sm font-semibold text-[#172965]">
                Your application is in our system
              </h2>
              <p className="mt-2 text-sm text-slate-700">
                We review each application carefully. If your experience aligns
                with the requirements for this role, we&apos;ll contact you to
                discuss next steps.
              </p>

              <div className="mt-4 flex flex-wrap gap-3 text-xs">
                <Link
                  href={canonicalPath}
                  className="inline-flex items-center justify-center rounded-full border border-slate-200 px-4 py-1.5 text-xs font-semibold text-[#172965] hover:bg-slate-50"
                >
                  View full role again
                </Link>
                <Link
                  href="/jobs"
                  className="inline-flex items-center justify-center rounded-full bg-[#172965] px-4 py-1.5 text-xs font-semibold text-white hover:bg-[#0f1c48]"
                >
                  Browse all open roles
                </Link>
              </div>

              <p className="mt-4 text-[11px] text-slate-500">
                If you don&apos;t hear back immediately, it simply means we are
                still reviewing applications, or you may be a stronger fit for a
                future opportunity in our network.
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
