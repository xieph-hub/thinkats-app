"use client";

import React from "react";
import { JobCard, JobCardData } from "./JobCard";

export interface JobCardGridProps {
  jobs: JobCardData[];
  onOpenJob: (job: JobCardData) => void;
  onApply: (job: JobCardData) => void;
  onSave: (job: JobCardData) => void;
}

export const JobCardGrid: React.FC<JobCardGridProps> = ({
  jobs,
  onOpenJob,
  onApply,
  onSave,
}) => {
  if (!jobs || jobs.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/60 px-4 py-8 text-center text-sm text-slate-500">
        No open roles just yet. Once you publish roles in your ATS, they’ll
        appear here automatically.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
      {jobs.map((job) => (
        <JobCard
          key={job.id}
          job={job}
          onCardClick={() => onOpenJob(job)}
          onApply={() => onApply(job)}
          onSave={() => onSave(job)}
        />
      ))}
    </div>
  );
};

// Example usage with sample data – you can drop this into a dev-only page
export const SampleJobsGrid: React.FC = () => {
  const sampleJobs: JobCardData[] = [
    {
      id: "1",
      title: "Senior Product Manager",
      company: "Resourcin (for a Fintech client)",
      location: "Lagos, Nigeria (Hybrid)",
      type: "Full-time",
      salary: "₦30m – ₦45m per year",
      applicants: 18,
      postedDate: new Date().toISOString(),
      experienceLevel: "Senior (6–10 years)",
      department: "Product & Strategy",
      description:
        "Own the product roadmap for a high-growth fintech, working closely with engineering, design and commercial teams to ship products that move the needle on revenue and retention.",
      skills: ["Product strategy", "Stakeholder management", "Fintech"],
      shareUrl: "https://www.resourcin.com/jobs/senior-product-manager",
    },
    {
      id: "2",
      title: "Head of People & Culture",
      company: "Resourcin (for a Tech client)",
      location: "Remote – Africa",
      type: "Full-time",
      salary: "$70k – $90k per year",
      applicants: 7,
      postedDate: new Date().toISOString(),
      experienceLevel: "Lead / Principal",
      department: "People & Culture",
      description:
        "Lead culture, performance and leadership development for a distributed team. You'll design scalable people programs and partner directly with the founders.",
      skills: ["HR strategy", "Leadership", "Remote-first HR"],
      shareUrl: "https://www.resourcin.com/jobs/head-of-people",
    },
    {
      id: "3",
      title: "Senior Software Engineer (Node/React)",
      company: "Resourcin (for a TravelTech client)",
      location: "Nairobi, Kenya (Hybrid)",
      type: "Full-time",
      salary: "$45k – $60k per year",
      applicants: 3,
      postedDate: new Date().toISOString(),
      experienceLevel: "Senior (5+ years)",
      department: "Engineering",
      description:
        "Build and scale APIs and frontends that power ticketing and inventory for airlines and bus operators across Africa.",
      skills: ["Node.js", "React", "PostgreSQL", "AWS"],
      shareUrl:
        "https://www.resourcin.com/jobs/senior-software-engineer-node-react",
    },
    {
      id: "4",
      title: "Wealth Manager",
      company: "Resourcin (for a Private Wealth client)",
      location: "Victoria Island, Lagos (On-site)",
      type: "Full-time",
      salary: "Competitive, plus performance bonus",
      applicants: 0,
      postedDate: new Date().toISOString(),
      experienceLevel: "Mid–Senior",
      department: "Wealth Management",
      description:
        "Manage a portfolio of HNI clients, advise on asset allocation and build long-term relationships while working with investment and research teams.",
      skills: ["Private banking", "Portfolio management", "Sales"],
      shareUrl: "https://www.resourcin.com/jobs/wealth-manager",
    },
  ];

  const handleOpenJob = (job: JobCardData) => {
    // In real app: open drawer / route to /jobs/[slug]
    console.log("Open job", job.id);
  };

  const handleApply = (job: JobCardData) => {
    // In real app: scroll to form, or open application drawer
    console.log("Apply for", job.id);
  };

  const handleSave = (job: JobCardData) => {
    // In real app: call API to persist saved jobs per candidate
    console.log("Save job", job.id);
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="mb-4 text-xl font-semibold text-slate-900">
        Sample job cards
      </h1>
      <JobCardGrid
        jobs={sampleJobs}
        onOpenJob={handleOpenJob}
        onApply={handleApply}
        onSave={handleSave}
      />
    </div>
  );
};
