// app/jobs/page.tsx

import type { Metadata } from "next";
import Link from "next/link";
import { jobs } from "@/lib/jobs";

export const metadata: Metadata = {
  title: "Jobs | Resourcin Human Capital Advisors",
  description:
    "Explore open roles curated by Resourcin Human Capital Advisors. Find your next opportunity and take the next step in your career.",
};

export default function JobsPage() {
  return (
    <main className="min-h-screen bg-slate-50">
      {/* Hero */}
      <section className="bg-[#172965] text-white py-16 px-6">
        <div className="mx-auto max-w-5xl">
          <p className="text-xs uppercase tracking-[0.2em] text-blue-200/80 mb-2">
            Jobs
          </p>
          <h1 className="text-3xl md:text-4xl font-semibold mb-3">
            Find Your Next Role
          </h1>
          <p className="max-w-2xl text-sm md:text-base text-blue-100 leading-relaxed">
            Explore curated opportunities from Resourcin and our client
            partners. We focus on roles that align skills, ambition, and
            culture—so you can do your best work.
          </p>
        </div>
      </section>

      {/* Jobs list */}
      <section className="px-6 py-10">
        <div className="mx-auto max-w-5xl">
          {jobs.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center">
              <p className="text-sm text-slate-600">
                There are no open roles at the moment. Please check back soon or
                follow us on LinkedIn for updates.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {jobs.map((job) => (
                <article
                  key={job.id}
                  className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                    <div>
                      <h2 className="text-lg font-semibold text-slate-900">
                        {job.title}
                      </h2>
                      <p className="text-xs text-slate-500 mt-1">
                        {job.company} · {job.department}
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        {job.location} · {job.type}
                      </p>
                    </div>
                    <div className="flex gap-3">
                      <Link
                        href={`/jobs/${job.slug}`}
                        className="inline-flex items-center rounded-full border border-slate-300 px-4 py-2 text-xs font-medium text-slate-800 hover:bg-slate-50 transition-colors"
                      >
                        View details
                      </Link>
                      <a
                        href={`mailto:hello@resourcin.com?subject=${encodeURIComponent(
                          `Application: ${job.title}`
                        )}`}
                        className="inline-flex items-center rounded-full bg-[#172965] px-4 py-2 text-xs font-medium text-white hover:bg-[#101c44] transition-colors"
                      >
                        Apply via Email
                      </a>
                    </div>
                  </div>
                  <p className="mt-3 text-sm text-slate-600 leading-relaxed">
                    {job.summary}
                  </p>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
