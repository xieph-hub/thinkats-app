// app/jobs/page.tsx

import type { Metadata } from "next";
import { jobs } from "@/lib/jobs";
import JobsListing from "@/components/JobsListing";

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
            Explore curated opportunities from Resourcin and our client partners.
            We focus on roles that align skills, ambition, and culture—so you can
            do your best work.
          </p>
        </div>
      </section>

      {/* Filters + List */}
      <section className="px-6 py-10">
        <div className="mx-auto max-w-5xl">
          <JobsListing initialJobs={jobs} />
        </div>
      </section>
    </main>
  );
}
