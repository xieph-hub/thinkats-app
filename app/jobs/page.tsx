// app/jobs/page.tsx
import type { Metadata } from "next";
import Link from "next/link";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

// Always hit Supabase at request time
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Jobs | Resourcin",
  description:
    "Open roles managed by Resourcin across Africa and beyond. Browse and apply without creating an account.",
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
};

const BASE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://www.resourcin.com";

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
  });
}

function formatEmploymentType(value: string | null) {
  if (!value) return null;
  const lower = value.toLowerCase();
  if (lower === "full-time" || lower === "full_time") return "Full-time";
  if (lower === "part-time" || lower === "part_time") return "Part-time";
  if (lower === "contract") return "Contract";
  if (lower === "internship") return "Internship";
  return value;
}

// Very simple heuristic work-mode from location / tags
function deriveWorkMode(job: PublicJob): string | null {
  const loc = (job.location || "").toLowerCase();
  const tags = (job.tags || []).map((t) => t.toLowerCase());

  if (loc.includes("remote") || tags.includes("remote")) return "Remote";
  if (loc.includes("hybrid") || tags.includes("hybrid")) return "Hybrid";
  if (loc.includes("flexible") || tags.includes("flexible")) return "Flexible";
  if (loc.includes("on-site") || loc.includes("onsite")) return "On-site";

  return null;
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
      tags
    `
    )
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Jobs page – error loading jobs:", error);
  }

  const jobs = (data ?? []) as PublicJob[];
  const count = jobs.length;

  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <header className="mb-6">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
          For candidates
        </p>
        <h1 className="mt-1 text-2xl font-semibold text-slate-900">
          Open roles
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-600">
          Browse live mandates from Resourcin and our clients. You can apply
          without creating an account; we&apos;ll only reach out when
          there&apos;s a strong match.
        </p>
        {count > 0 && (
          <p className="mt-1 text-[11px] text-slate-500">
            Showing {count} role{count === 1 ? "" : "s"} from your ATS.
          </p>
        )}
      </header>

      {count === 0 ? (
        <p className="mt-8 text-sm text-slate-500">
          No jobs found in your{" "}
          <code className="rounded bg-slate-100 px-1 text-[11px]">jobs</code>{" "}
          table. Once you create roles in the ATS, they&apos;ll appear here.
        </p>
      ) : (
        <section className="mt-6 space-y-4">
          {jobs.map((job) => {
            const slugOrId = job.slug || job.id;
            if (!slugOrId) {
              console.warn("Jobs page – job missing slug and id", job);
              return null;
            }

            const employmentTypeLabel = formatEmploymentType(
              job.employment_type
            );
            const workModeLabel = deriveWorkMode(job);

            const jobUrl = `${BASE_URL}/jobs/${encodeURIComponent(slugOrId)}`;
            const shareText = encodeURIComponent(
              `${job.title}${
                job.location ? ` – ${job.location}` : ""
              } (via Resourcin)`
            );
            const encodedUrl = encodeURIComponent(jobUrl);

            const xUrl = `https://twitter.com/intent/tweet?text=${shareText}&url=${encodedUrl}`;
            const linkedInUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`;
            const whatsappUrl = `https://api.whatsapp.com/send?text=${shareText}%20${encodedUrl}`;

            return (
              <article
                key={job.id}
                className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-[#172965]/70 hover:shadow-md"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="space-y-2">
                    <h2 className="text-sm font-semibold text-slate-900">
                      <Link
                        href={`/jobs/${encodeURIComponent(slugOrId)}`}
                        className="hover:underline"
                      >
                        {job.title}
                      </Link>
                    </h2>

                    <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-600">
                      {job.location && (
                        <span className="inline-flex items-center rounded-full bg-slate-50 px-2.5 py-0.5">
                          <span className="mr-1" aria-hidden="true">
                            📍
                          </span>
                          {job.location}
                        </span>
                      )}

                      {workModeLabel && (
                        <span className="inline-flex items-center rounded-full bg-sky-50 px-2.5 py-0.5 text-sky-900">
                          <span className="mr-1" aria-hidden="true">
                            🏡
                          </span>
                          {workModeLabel}
                        </span>
                      )}

                      {employmentTypeLabel && (
                        <span className="inline-flex items-center rounded-full bg-amber-50 px-2.5 py-0.5 text-amber-900">
                          <span className="mr-1" aria-hidden="true">
                            💼
                          </span>
                          {employmentTypeLabel}
                        </span>
                      )}

                      {job.seniority && (
                        <span className="inline-flex items-center rounded-full bg-slate-50 px-2.5 py-0.5">
                          <span className="mr-1" aria-hidden="true">
                            ⭐
                          </span>
                          {job.seniority}
                        </span>
                      )}

                      {job.status && (
                        <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-slate-700">
                          <span className="mr-1" aria-hidden="true">
                            📌
                          </span>
                          {job.status}
                          {job.visibility ? ` · ${job.visibility}` : ""}
                        </span>
                      )}
                    </div>

                    {job.tags && job.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {job.tags.map((tag) => (
                          <span
                            key={tag}
                            className="inline-flex items-center rounded-full bg-slate-50 px-2 py-0.5 text-[10px] font-medium text-slate-700"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Social share */}
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-[10px] text-slate-500">
                      <span className="font-medium text-slate-600">
                        Share:
                      </span>
                      <a
                        href={xUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 hover:text-[#172965]"
                      >
                        <span aria-hidden="true">𝕏</span>
                        <span>X</span>
                      </a>
                      <span className="text-slate-300">•</span>
                      <a
                        href={linkedInUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 hover:text-[#172965]"
                      >
                        <span aria-hidden="true">in</span>
                        <span>LinkedIn</span>
                      </a>
                      <span className="text-slate-300">•</span>
                      <a
                        href={whatsappUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 hover:text-[#172965]"
                      >
                        <span aria-hidden="true">🟢</span>
                        <span>WhatsApp</span>
                      </a>
                    </div>
                  </div>

                  <div className="flex flex-col items-start gap-1 text-[11px] text-slate-500 sm:items-end">
                    <span>Posted {formatDate(job.created_at)}</span>
                    <Link
                      href={`/jobs/${encodeURIComponent(slugOrId)}`}
                      className="inline-flex items-center rounded-full bg-[#172965] px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-[#111c4c] transition"
                    >
                      View role
                      <span className="ml-1 text-xs" aria-hidden="true">
                        →
                      </span>
                    </Link>
                  </div>
                </div>
              </article>
            );
          })}
        </section>
      )}
    </main>
  );
}
