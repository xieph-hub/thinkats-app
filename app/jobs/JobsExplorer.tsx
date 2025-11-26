// app/jobs/JobsExplorer.tsx
"use client";

import React from "react";
import JobCard, { type JobCardData } from "@/components/jobs/JobCard";

interface JobsExplorerProps {
  jobs: JobCardData[];
}

export default function JobsExplorer({ jobs }: JobsExplorerProps) {
  if (!jobs || jobs.length === 0) {
    return (
      <section className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-600">
        <p>No open roles are currently live. Please check back soon.</p>
      </section>
    );
  }

  return (
    <section>
      <div className="mb-4 text-xs text-slate-500">
        {jobs.length} role{jobs.length === 1 ? "" : "s"} currently live.
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {jobs.map((job) => (
          <JobCard key={job.id} job={job} />
        ))}
      </div>
    </section>
  );
}
