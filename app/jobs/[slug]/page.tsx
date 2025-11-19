// app/jobs/[slug]/page.tsx
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { SITE_URL } from "@/lib/site";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type JobRow = {
  id: string;
  slug: string | null;
  title: string | null;
  employer_name?: string | null;
  employer_initials?: string | null;
  department?: string | null;
  location?: string | null;
  work_type?: string | null;
  type?: string | null;
  seniority?: string | null;
  salary_range?: string | null;
  highlight?: string | null;
  description?: string | null;
  created_at?: string | null;
  posted_at?: string | null;
  tags?: string[] | string | null;
};

const JOB_SELECT =
  "id, slug, title, employer_name, employer_initials, department, location, work_type, type, seniority, salary_range, highlight, description, created_at, posted_at, tags";

async function fetchJobBySlugOrId(slug: string): Promise<JobRow | null> {
  const supabase = createClient();

  // 1) Try match by slug
  let { data, error } = await supabase
    .from("Job")
    .select(JOB_SELECT)
    .eq("slug", slug)
    .single();

  // If it's just "no rows" or slug is null in DB, try fallback by id
  if (error) {
    // console for your server logs, but don't break the page
    console.warn("Job lookup by slug failed, trying id:", slug, error);

    const byId = await supabase
      .from("Job")
      .select(JOB_SELECT)
      .eq("id", slug)
      .single();

    if (byId.error) {
      console.error("Job lookup by id also failed:", slug, byId.error);
      return null;
    }

    data = byId.data as JobRow;
  }

  if (!data) return null;
  return data as JobRow;
}

// Optional: nicer tab title / SEO
export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const job = await fetchJobBySlugOrId(params.slug);

  if (!job) {
    return {
      title: "Role not found · Resourcin",
    };
  }

  return {
    title: `${job.title ?? "Role"} – ${job.employer_name ?? "Resourcin"} · Jobs`,
    description:
      job.highlight ??
      "Executive and specialist roles across product, engineering, data, operations and growth.",
    alternates: {
      canonical: `${SITE_URL}/jobs/${job.slug ?? params.slug}`,
    },
  };
}

export default async function JobDetailPage({
  params,
}: {
  params: { slug: string };
}) {
  const job = await fetchJobBySlugOrId(params.slug);

  if (!job) {
    notFound();
  }

  const postedInput = job.posted_at || job.created_at;
  const postedAt = postedInput
    ? new Intl.DateTimeFormat("en-GB", {
        year: "numeric",
        month: "short",
        day: "numeric",
      }).format(new Date(postedInput))
    : "Recently";

  const tags: string[] = Array.isArray(job.tags)
    ? job.tags
    : typeof job.tags === "string"
    ? job.tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean)
    : [];

  const employerName = job.employer_name || "Resourcin search";
  const initials =
    job.employer_initials ||
    employerName
      .split(" ")
      .map((w) => w[0])
      .join("")
      .slice(0, 3)
      .toUpperCase();

  return (
    <div className="min-h-screen bg-slate-50">
      <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
        {/* Back link */}
        <div className="mb-4">
          <Link
            href="/jobs"
            className="inline-flex items-center text-xs font-medium text-slate-600 hover:text-slate-900"
          >
            ← Back to all roles
          </Link>
        </div>

        {/* Header card */}
        <section className="mb-6 rounded-2xl bg-white px-5 py-6 shadow-sm ring-1 ring-slate-200 sm:px-7">
          <div className="flex flex-col gap-4 sm:flex-row sm:justify-between">
            <div className="flex gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#172965] text-sm font-semibold text-white shadow-sm">
                {initials}
              </div>
              <div>
                <h1 className="text-lg font-semibold text-slate-900 sm:text-xl">
                  {job.title ?? "Role"}
                </h1>
                <p className="mt-1 text-sm text-slate-600">
                  {employerName} · {job.location || "Flexible location"}
                </p>
              </div>
            </div>

            <div className="flex flex-col items-start gap-2 text-xs text-slate-500 sm:items-end">
              <span>Posted {postedAt}</span>
              {job.salary_range && (
                <span className="inline-flex items-center rounded-full bg-slate-50 px-2.5 py-1 text-[0.7rem] font-medium text-slate-700 ring-1 ring-slate-200">
                  {job.salary_range}
                </span>
              )}
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2 text-[0.7rem] text-slate-600 sm:text-xs">
            {job.department && (
              <span className="rounded-full bg-slate-50 px-2.5 py-1 ring-1 ring-slate-200">
                {job.department}
              </span>
            )}
            {job.work_type && (
              <span className="rounded-full bg-slate-50 px-2.5 py-1 ring-1 ring-slate-200">
                {job.work_type}
              </span>
            )}
            {job.type && (
              <span className="rounded-full bg-slate-50 px-2.5 py-1 ring-1 ring-slate-200">
                {job.type}
              </span>
            )}
            {job.seniority && (
              <span className="rounded-full bg-slate-50 px-2.5 py-1 ring-1 ring-slate-200">
                {job.seniority} level
              </span>
            )}
            {tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-slate-100 px-2 py-0.5 text-[0.65rem] text-slate-600"
              >
                #{tag}
              </span>
            ))}
          </div>
        </section>

        {/* Body */}
        <section className="space-y-6 rounded-2xl bg-white px-5 py-6 shadow-sm ring-1 ring-slate-200 sm:px-7">
          {job.highlight && (
            <div className="rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-700">
              {job.highlight}
            </div>
          )}

          <article className="prose prose-sm max-w-none text-slate-800 prose-headings:text-slate-900 prose-a:text-[#172965]">
            {job.description ? (
              <div
                dangerouslySetInnerHTML={{ __html: job.description }}
              />
            ) : (
              <p>
                Full description will be shared at screening. This role is
                currently in active search via Resourcin.
              </p>
            )}
          </article>

          <div className="border-t border-slate-100 pt-4 text-sm text-slate-700">
            <p className="font-semibold text-[#172965]">
              How to express interest
            </p>
            <p className="mt-1">
              Use the{" "}
              <Link
                href={`/talent-network?utm_source=job_detail&utm_campaign=${encodeURIComponent(
                  job.slug ?? params.slug
                )}`}
                className="font-medium text-[#172965] underline-offset-2 hover:underline"
              >
                talent network form
              </Link>{" "}
              and mention this role in the notes, or reply directly if you
              received this via email from Resourcin.
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}
