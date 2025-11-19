// lib/jobs.ts

// High-level seniority buckets for filtering / labelling
export type JobSeniority =
  | "Internship"
  | "Entry"
  | "Junior"
  | "Mid"
  | "Senior"
  | "Lead"
  | "Manager"
  | "Director"
  | "Executive";

export const JOB_SENIORITY_OPTIONS: JobSeniority[] = [
  "Internship",
  "Entry",
  "Junior",
  "Mid",
  "Senior",
  "Lead",
  "Manager",
  "Director",
  "Executive",
];

// Base Job type used by the public job board UI (JobBoardClient).
// We keep this loose and allow extra fields so the UI can read
// any additional props without TypeScript complaining.
export type Job = {
  id: string;
  title: string;
  slug: string;

  // Display fields used on the public job board
  department?: string | null;       // maps from jobs.function
  location?: string | null;
  employment_type?: string | null;  // "full_time", "contract", etc.
  work_type?: string | null;        // "Remote", "Hybrid", "Onsite"
  summary?: string | null;
  tags?: string[] | null;
  created_at?: string;

  // Any extra fields the UI might access
  [key: string]: any;
};
