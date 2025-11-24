// app/jobs/page.tsx
import type { Metadata } from "next";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import type { JobCardData } from "@/components/jobs/JobCard";
import { JobsGridClient } from "./JobsGridClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Jobs | Resourcin",
  description:
    "Open roles managed by Resourcin and its clients. Browse and apply without creating an account.",
};

type PublicJob = {
  id: string;
  slug: string | null;
  title: string;
  location: string | null;
  employment_type: string | null;
  seniority: string | null;
  status: string | null;
  visibility: string | null;
  created_at: string;
  tags: string[] | null;
  department: string | null;
  description: string | null;
};

const BASE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://www.resourcin.com";

function normaliseEmploymentType(
  value: string | null
): JobCardData["type"] | null {
  if (!value) return null;
  const v = value.toLowerCase();

  if (v === "full-time" || v === "full_time") return "Full-time";
  if (v === "part-time" || v === "part_time") return "Part-time";
  if (v === "contract") return "Contract";
  if (v === "remote") return "Remote";

  // Fallback – treat unknown as Full-time (or keep as Remote, etc. if you prefer)
  return "Full-time";
}

function deriveExperienceLabel(seniority: string | null): string {
  if (!seniority) return "Not specified";
  const v = seniority.toLowerCase();

  if (v.includes("entry")) return "Entry level";
  if (v.includes("junior")) return "Entry / Junior";
  if (v.includes("mid")) return "Mid level";
  if (v.includes("senior")) return "Senior level";
  if (v.includes("lead") || v.includes("principal")) return "Lead / Principal";
  if (v.includes("exec")) return "Executive";

  return seniority;
}

export default async function JobsPage() {
  const { data, error } = await supabaseAdmin
    .from("jobs")
    .select(
      `
      id,
      slug,
      title,
      location,
      employment_type,
      seniority,
      status,
      visibility,
      created_at,
      tags,
      department,
      description
    `
    )
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Jobs page – error loading jobs:", error);
  }

  const rows = (data ?? []) as PublicJob[];

  // Only show open + public roles on the public jobs page
  const openPublicJobs = rows.filter(
    (job) => job.status === "open" && job.visibility === "public"
  );

  const cardJobs: JobCardData[] = openPublicJobs
    .map((job) => {
      const slugOrId = job.slug || job.id;
      if (!slugOrId) {
        console.warn("Jobs page – job missing slug and id", job);
        return null;
      }

      const url = `${BASE_URL}/jobs/${encodeURIComponent(slugOrId)}`;

      const type =
        normaliseEmploymentType(job.employment_type) ?? "Full-time";

      const experienceLevel = deriveExperienceLabel(job.seniority);

      const skills = job.tags ?? [];

      return {
        id: job.id,
        title: job.title,
        company: "Resourcin client", // we don’t have per-client names in this schema
        location: job.location || "Location flexible",
        type,
        salary: "Not disclosed",
        applicants: 0, // can wire real counts later from job_applications
        postedDate: job.created_at,
        experienceLevel,
        department: job.department || "",
        description: job.description || "",
        skills,
        shareUrl: url,
      } satisfies JobCardData;
    })
    .filter((j): j is JobCardData => j !== null);

  const count = cardJobs.length;

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <header className="mb-6 border-b border-slate-100 pb-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
          For candidates
        </p>
        <h1 className="mt-1 text-2xl font-semibold text-slate-900">
          Open roles
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-600">
          Browse live mandates from Resourcin and our clients. Apply in a few
          minutes; no account required.
        </p>
        {count > 0 && (
          <p className="mt-1 text-[11px] text-slate-500">
            Showing {count} role{count === 1 ? "" : "s"}.
          </p>
        )}
      </header>

      {count === 0 ? (
        <p className="mt-8 text-sm text-slate-500">
          No public roles are currently open. Once you publish roles in the ATS
          with status <code className="rounded bg-slate-100 px-1 text-[11px]">
            open
          </code>{" "}
          and visibility{" "}
          <code className="rounded bg-slate-100 px-1 text-[11px]">
            public
          </code>
          , they&apos;ll appear here automatically.
        </p>
      ) : (
        <section className="mt-4">
          <JobsGridClient jobs={cardJobs} />
        </section>
      )}
    </main>
  );
}
