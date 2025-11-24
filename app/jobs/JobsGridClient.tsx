// app/jobs/JobsGridClient.tsx
"use client";

import React from "react";
import { useRouter } from "next/navigation";
import type { JobCardData } from "@/components/jobs/JobCard";
import { JobCardGrid } from "@/components/jobs/JobCardGrid";

type Props = {
  jobs: JobCardData[];
};

export function JobsGridClient({ jobs }: Props) {
  const router = useRouter();

  return (
    <JobCardGrid
      jobs={jobs}
      onOpenJob={(job) => {
        // Navigate to the public job detail page
        router.push(job.shareUrl);
      }}
      onApply={(job) => {
        // For now, go to the job page – your form is already there
        router.push(job.shareUrl + "#apply");
      }}
      onSave={(job) => {
        // Hook this to a “saved jobs” API later if you want
        console.log("Save job", job.id);
      }}
    />
  );
}
