// app/jobs/page.tsx
import type { Metadata } from "next";
import { jobs } from "@/lib/jobs";
import JobBoardClient from "./JobBoardClient";

export const metadata: Metadata = {
  title: "Jobs | Resourcin",
  description:
    "Curated roles across Product, Engineering, People and Operations. Browse open roles or share your profile once via the Resourcin talent network.",
};

export default function JobsPage() {
  return <JobBoardClient initialJobs={jobs} />;
}
