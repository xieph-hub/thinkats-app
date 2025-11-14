// app/jobs/[slug]/page.tsx

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { jobs } from "@/lib/jobs";

type JobDetailPageProps = {
  params: { slug: string };
};

export function generateMetadata({
  params,
}: JobDetailPageProps): Metadata {
  const job = jobs.find((j) => j.slug === params.slug);

  if (!job) {
    return {
      title: "Job not found | Resourcin",
    };
  }

  return {
    title: `${job.title} | Jobs at Resourcin`,
    description: job.summary,
  };
}

export default function JobDetailPage({ params }: JobDetailPageProps) {
  const job = jobs.find((j) => j.slug === params.slug);

  if (!job) {
    notFound();
  }

  const applyMailto = `mailto:hello@resourcin.com?subject=${encodeURIComponent(
    `Application: ${job.title}`
  )}&body=${encodeURIComponent(
    `Hi Resourcin team,

I would like to express my interest in the role: ${job.title}.

You can find my CV attached, and below are a few quick details:

• Name:
• Phone:
• Current role / company:
• Notice period:
• LinkedIn profile:

Thank you, and I look forward to hearing from you.

Best regards,
`
  )}`;

  return (
    <main className="min-h-screen bg-slate-50">
      {/* Top bar */}
      <section className="bg-[#172965] text-white py-10 px-6">
        <div className="mx-auto max-w-5xl">
          <p className="text-xs uppercase tracking-[0.2em] text-blue-200/80 mb-2">
            Job details
          </p>
          <h1 className="text-2xl md:text-3xl font-semibold mb-2">
            {job.title}
          </h1>
          <p className="text-sm text-blue-100">
            {job.company} · {job.department}
          </p>
          <p className="mt-1 text-xs text-blue-100/90">
            {job.location} · {job.type}
          </p>

          <div className="mt-5 flex flex-wrap gap-3">
            <a
              href={applyMailto}
              className="inline-flex items-center rounded-full bg-white px-5 py-2 text-xs font-medium text-[#172965] hover:bg-blue-50 transition-colors"
            >
              Apply via Email
            </a>
            <Link
              href="/jobs"
              className="inline-flex items-center rounded-full border border-blue-200/70 px-5 py-2 text-xs font-medium text-blue-100 hover:bg-blue-900/40 transition-colors"
            >
              ← Back to all jobs
            </Link>
          </div>
        </div>
      </section>

      {/* Body */}
      <section className="px-6 py-10">
        <div className="mx-auto max-w-5xl grid gap-8 md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
          {/* Left: description */}
          <article className="rounded-xl bg-white p-6 shadow-sm border border-slate-200">
            <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-[0.15em] mb-4">
              Role Overview
            </h2>
            <p className="text-sm text-slate-700 whitespace-pre-line leading-relaxed">
              {job.description}
            </p>
          </article>

          {/* Right: quick info + simple “apply” guidance */}
          <aside className="space-y-4">
            <div className="rounded-xl bg-white p-5 shadow-sm border border-slate-200">
              <h3 className="text-sm font-semibold text-slate-900 mb-3">
                Role Snapshot
              </h3>
              <dl className="space-y-2 text-xs text-slate-700">
                <div className="flex justify-between gap-4">
                  <dt className="text-slate-500">Location</dt>
                  <dd className="text-right">{job.location}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-slate-500">Employment Type</dt>
                  <dd className="text-right">{job.type}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-slate-500">Company</dt>
                  <dd className="text-right">{job.company}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-slate-500">Department</dt>
                  <dd className="text-right">{job.department}</dd>
                </div>
              </dl>
            </div>

            <div className="rounded-xl bg-slate-900 text-slate-50 p-5 shadow-sm">
              <h3 className="text-sm font-semibold mb-2">
                How to Apply
              </h3>
              <p className="text-xs text-slate-100/90 leading-relaxed mb-3">
                Click the button above to open an email with this role
                pre-filled. Attach your CV and include a short note on why
                you&apos;re a strong fit.
              </p>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                If you experience any issues with the apply link, you can
                also email{" "}
                <a
                  href="mailto:hello@resourcin.com"
                  className="underline underline-offset-2"
                >
                  hello@resourcin.com
                </a>{" "}
                with the subject line{" "}
                <span className="font-mono">
                  Application: {job.title}
                </span>
                .
              </p>
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}
