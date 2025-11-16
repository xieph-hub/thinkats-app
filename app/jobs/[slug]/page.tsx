import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";

interface JobPageProps {
  params: { slug: string };
}

export const dynamic = "force-dynamic";

export default async function JobDetailPage({ params }: JobPageProps) {
  const job = await prisma.job.findFirst({
    where: {
      slug: params.slug,
      status: "open",
    },
    select: {
      title: true,
      location: true,
      function: true,
      summary: true,
      description: true,
      salaryCurrency: true,
      salaryMin: true,
      salaryMax: true,
      remoteOption: true,
    },
  });

  if (!job) {
    notFound();
  }

  const salary =
    job.salaryMin && job.salaryMax
      ? `${job.salaryCurrency} ${job.salaryMin.toLocaleString()} – ${job.salaryMax.toLocaleString()}`
      : job.salaryMin
      ? `${job.salaryCurrency} ${job.salaryMin.toLocaleString()}+`
      : null;

  return (
    <div className="bg-slate-50 min-h-screen">
      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
        <Link
          href="/jobs"
          className="inline-flex items-center text-xs font-medium text-slate-600 hover:text-[#172965] hover:underline"
        >
          ← Back to all roles
        </Link>

        <section className="mt-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <header className="border-b border-slate-100 pb-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-[#306B34]">
              Resourcin shortlists
            </p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
              {job.title}
            </h1>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-500">
              {job.location && (
                <span className="inline-flex items-center rounded-full bg-slate-50 px-2.5 py-1">
                  📍 {job.location}
                </span>
              )}
              {job.remoteOption && (
                <span className="inline-flex items-center rounded-full bg-slate-50 px-2.5 py-1">
                  🌐 {job.remoteOption === "hybrid" ? "Hybrid" : job.remoteOption}
                </span>
              )}
              {job.function && (
                <span className="inline-flex items-center rounded-full bg-slate-50 px-2.5 py-1">
                  🧭 {job.function}
                </span>
              )}
              {salary && (
                <span className="inline-flex items-center rounded-full bg-slate-50 px-2.5 py-1">
                  💰 {salary}
                </span>
              )}
            </div>
          </header>

          {job.summary && (
            <p className="mt-4 text-sm font-medium text-slate-800">
              {job.summary}
            </p>
          )}

          <section className="mt-6 space-y-4 text-sm leading-relaxed text-slate-700">
            <h2 className="text-sm font-semibold text-slate-900">
              Role overview
            </h2>
            <p className="whitespace-pre-line">{job.description}</p>
          </section>

          <section className="mt-8 rounded-xl bg-slate-50 p-4">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-700">
              How to apply
            </h3>
            <p className="mt-2 text-sm text-slate-700">
              This role is managed by Resourcin on behalf of the hiring company.
              Share your profile and we&apos;ll review for a potential shortlist.
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <Link
                href={`/apply/${encodeURIComponent(params.slug)}`}
                className="inline-flex items-center justify-center rounded-full bg-[#172965] px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-slate-900 transition"
              >
                Apply for this role
              </Link>
              <Link
                href="/candidates/join"
                className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-5 py-2 text-sm font-semibold text-slate-800 hover:border-[#172965] hover:text-[#172965] transition"
              >
                Join Talent Network
              </Link>
            </div>
          </section>
        </section>
      </main>
    </div>
  );
}
