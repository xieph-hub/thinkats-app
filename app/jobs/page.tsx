// app/jobs/page.tsx
import type { Metadata } from "next";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import JobsExplorer from "./JobsExplorer";
import type { JobCardData } from "@/components/jobs/JobCard";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Open roles | Resourcin",
  description:
    "Live mandates managed by Resourcin via ThinkATS. Apply directly or join the talent network.",
};

type RawJobRow = {
  id: string;
  slug: string | null;
  title: string;
  short_description: string | null;
  location: string | null;
  employment_type: string | null;
  experience_level: string | null;
  work_mode: string | null;
  department: string | null;
  tags: string[] | null;
  status: string | null;
  visibility: string | null;
  internal_only: boolean | null;
  confidential: boolean | null;
  created_at: string;
  salary_min: number | null;
  salary_max: number | null;
  salary_currency: string | null;
  salary_visible: boolean | null;
};

function formatEmploymentType(raw: string | null): string | undefined {
  if (!raw) return undefined;
  switch (raw) {
    case "full_time":
      return "Full-time";
    case "part_time":
      return "Part-time";
    case "contract":
      return "Contract";
    case "temporary":
      return "Temporary";
    case "internship":
      return "Internship";
    default:
      return raw;
  }
}

function formatSalary(row: RawJobRow): string | undefined {
  if (!row.salary_visible) return undefined;
  if (!row.salary_min && !row.salary_max) return undefined;

  const currency = (row.salary_currency || "NGN").toUpperCase();
  const symbol =
    currency === "NGN"
      ? "₦"
      : currency === "USD"
      ? "$"
      : currency === "KES"
      ? "KSh "
      : currency === "GHS"
      ? "GH₵"
      : currency === "ZAR"
      ? "R"
      : `${currency} `;

  const fmt = (n: number | null) =>
    n == null ? "" : n.toLocaleString("en-NG", { maximumFractionDigits: 0 });

  if (row.salary_min && row.salary_max) {
    return `${symbol}${fmt(row.salary_min)} – ${symbol}${fmt(row.salary_max)}`;
  }
  if (row.salary_min) {
    return `From ${symbol}${fmt(row.salary_min)}`;
  }
  if (row.salary_max) {
    return `Up to ${symbol}${fmt(row.salary_max)}`;
  }
  return undefined;
}

export default async function JobsPage() {
  // ⬇️ PUBLIC BOARD: no tenant filter here
  const { data, error } = await supabaseAdmin
    .from("jobs")
    .select(
      `
      id,
      slug,
      title,
      short_description,
      location,
      employment_type,
      experience_level,
      work_mode,
      department,
      tags,
      status,
      visibility,
      internal_only,
      confidential,
      created_at,
      salary_min,
      salary_max,
      salary_currency,
      salary_visible
    `
    )
    .order("created_at", { ascending: false });

  if (error) {
    console.error("JobsPage – error loading jobs:", error);
  }

  const rows = (data ?? []) as RawJobRow[];

  // Only show open + public, not internal-only
  const publicRows = rows.filter((row) => {
    const status = (row.status || "").toLowerCase();
    const visibility = (row.visibility || "").toLowerCase();
    const isOpen = status === "open";
    const isPublic = visibility === "public";
    const isInternal =
      row.internal_only === true || (row.internal_only as any) === "true";
    return isOpen && isPublic && !isInternal;
  });

  const jobs: JobCardData[] = publicRows.map((row) => {
    const slugOrId = row.slug ?? row.id;
    const company = row.confidential
      ? "Confidential search – via Resourcin"
      : "Resourcin";
    const type = formatEmploymentType(row.employment_type);
    const salary = formatSalary(row);

    return {
      id: row.id,
      title: row.title,
      location: row.location ?? "Location flexible",
      postedAt: row.created_at,
      shareUrl: `/jobs/${slugOrId}`,

      // Optional / rich fields expected by JobCard
      company,
      type,
      salary,
      applicants: 0,
      workMode: row.work_mode ?? undefined,
      experienceLevel: row.experience_level ?? undefined,
      department: row.department ?? undefined,
      shortDescription: row.short_description ?? undefined,
      tags: row.tags ?? [],
      isConfidential: row.confidential === true,
    };
  });

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <header className="mb-8">
        <p
          className="text-xs font-semibold uppercase tracking-[0.18em]"
          style={{ color: "#172965" }} // Resourcin blue
        >
          Open roles
        </p>
        <h1
          className="mt-2 text-3xl font-semibold"
          style={{ color: "#172965" }}
        >
          Opportunities via Resourcin
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-600">
          Roles managed through ThinkATS. Apply directly or share with someone
          who fits.
        </p>
      </header>

      <JobsExplorer jobs={jobs} />
    </main>
  );
}
