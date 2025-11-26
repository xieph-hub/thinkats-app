// components/jobs/JobCard.tsx
export type JobCardData = {
  id: string;
  title: string;
  location: string;
  postedAt: string;
  shareUrl: string;

  // Optional / nice-to-have fields
  company?: string;
  type?: string;          // e.g. "Full-time"
  salary?: string;        // formatted range or "Not disclosed"
  applicants?: number;    // number of applicants (can be 0 for now)
  workMode?: string;      // e.g. "Remote", "Hybrid"
  experienceLevel?: string;
  department?: string;
  shortDescription?: string;
  tags?: string[];
  isConfidential?: boolean;
};
