// app/ats/jobs/AtsJobsPageClient.tsx
"use client";

import { useRouter } from "next/navigation";
import {
  JobListWithDrawer,
  type AtsJobListItem,
} from "@/components/ats/JobListWithDrawer";

type Props = {
  jobs: AtsJobListItem[];
};

export default function AtsJobsPageClient({ jobs }: Props) {
  const router = useRouter();

  const handleEditJob = (jobId: string) => {
    if (jobId === "new") {
      router.push("/ats/jobs/new");
    } else {
      router.push(`/ats/jobs/${jobId}/edit`);
    }
  };

  const handleViewApplications = (jobId: string) => {
    router.push(`/ats/jobs/${jobId}`);
  };

  const handleDeleteJob = async (jobId: string) => {
    try {
      await fetch(`/api/ats/jobs/${jobId}`, {
        method: "DELETE",
      });
      router.refresh();
    } catch (err) {
      console.error("Error deleting job", err);
    }
  };

  return (
    <JobListWithDrawer
      jobs={jobs}
      onEditJob={handleEditJob}
      onViewApplications={handleViewApplications}
      onDeleteJob={handleDeleteJob}
    />
  );
}
