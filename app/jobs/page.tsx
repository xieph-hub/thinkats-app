// app/jobs/page.tsx
import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

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

// --- helpers ---

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

function deriveWorkMode(job: PublicJob): string | null {
  const loc = (job.location || "").toLowerCase();
  const tags = (job.tags || []).map((t) => t.toLowerCase());

  if (loc.includes("remote") || tags.includes("remote")) return "Remote";
  if (loc.includes("hybrid") || tags.includes("hybrid")) return "Hybrid";
  if (loc.includes("flexible") || tags.includes("flexible")) return "Flexible";
  if (loc.includes("on-site") || loc.includes("onsite")) return "On-site";

  return null;
}

function descriptionPreview(description: string | null, maxLength = 180) {
  if (!description) return null;
  const clean = description.replace(/\s+/g, " ").trim();
  if (clean.length <= maxLength) return clean;
  return `${clean.slice(0, maxLength - 1)}…`;
}

function MetaItem({
  icon,
  label,
}: {
  icon: ReactNode;
  label: string;
}) {
  return (
    <span className="inline-flex items-center gap-1 text-[11px] text-slate-600">
      <span aria-hidden="true">{icon}</span>
      <span>{label}</span>
    </span>
  );
}

// small, minimal icon (using just initials) in a brand-coloured circle
function SocialIcon({
  href,
  label,
  bgColor,
  children,
}: {
  href: string;
  label: string;
  bgColor: string;
  children: ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      aria-label={label}
      title={label}
      className="inline-flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-semibold text-white shadow-sm transition hover:scale-110 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-[#172965]/60 focus:ring-offset-1"
      style={{ backgroundColor: bgColor }}
    >
      {children}
    </a>
  );
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

  const allJobs = (data ?? []) as PublicJob[];

  // Only show open + public roles, but be forgiving with casing/whitespace
  const jobs = allJobs.filter(
    (job) =>
      (job.status ?? "").trim().toLowerCase() === "open" &&
      (job.visibility ?? "").trim().toLowerCase() === "public"
  );

  const count = jobs.length;

  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <header className="mb-6 border-b border-slate-100 pb-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
          For candidates
        </p>
        <h1 className="mt-1 text-2xl font-semibold text-slate-900">
          Open roles
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-600">
          Browse live mandates from Resourcin and our clients. Apply in a few
          minutes; no account required. We&apos;ll only reach out when
          there&apos;s a strong match.
        </p>
        {count > 0 && (
          <p className="mt-1 text-[11px] text-slate-500">
            Showing {count} role{count === 1 ? "" : "s"}.
          </p>
        )}
      </header>

      {count === 0 ? (
        <p className="mt-8 text-sm text-slate-500">
          No public roles are currently open. Check back soon or{" "}
          <Link
            href="/talent-network"
            className="font-medium text-[#172965] hover:underline"
          >
            join our talent network
          </Link>
          .
        </p>
      ) : (
        <section className="mt-4 rounded-2xl border border-slate-100 bg-white/70">
          <ul className="divide-y divide-slate-100">
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
              const preview = descriptionPreview(job.description);

              const jobUrl = `${BASE_URL}/jobs/${encodeURIComponent(slugOrId)}`;
              const shareText = `${job.title}${
                job.location ? ` – ${job.location}` : ""
              } (via Resourcin)`;

              const encodedUrl = encodeURIComponent(jobUrl);
              const encodedText = encodeURIComponent(shareText);

              const linkedInUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`;
              const xUrl = `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`;
              const whatsappUrl = `https://api.whatsapp.com/send?text=${encodedText}%20${encodedUrl}`;

              return (
                <li key={job.id}>
                  <article className="group flex flex-col gap-3 px-4 py-4 transition hover:bg-slate-50 sm:flex-row sm:items-start sm:justify-between">
                    {/* Left side: main info */}
                    <div className="flex-1 space-y-2">
                      <div>
                        <h2 className="text-sm font-semibold text-slate-900">
                          <Link
                            href={`/jobs/${encodeURIComponent(slugOrId)}`}
                            className="hover:underline"
                          >
                            {job.title}
                          </Link>
                        </h2>
                        <p className="mt-0.5 text-[11px] text-slate-500">
                          {job.department || "Client role via Resourcin"}
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-3 text-[11px] text-slate-600">
                        {job.location && (
                          <MetaItem
                            icon={
                              <span className="inline-block h-2 w-2 rounded-full bg-rose-400" />
                            }
                            label={job.location}
                          />
                        )}
                        {workModeLabel && (
                          <MetaItem
                            icon={
                              <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" />
                            }
                            label={workModeLabel}
                          />
                        )}
                        {employmentTypeLabel && (
                          <MetaItem
                            icon={
                              <span className="inline-block h-2 w-2 rounded-full bg-amber-500" />
                            }
                            label={employmentTypeLabel}
                          />
                        )}
                        {job.seniority && (
                          <MetaItem
                            icon={
                              <span className="inline-block h-2 w-2 rounded-full bg-slate-400" />
                            }
                            label={job.seniority}
                          />
                        )}
                      </div>

                      {preview && (
                        <p className="text-[11px] leading-relaxed text-slate-600">
                          {preview}{" "}
                          <Link
                            href={`/jobs/${encodeURIComponent(slugOrId)}`}
                            className="font-medium text-[#172965] hover:underline"
                          >
                            Read more
                          </Link>
                        </p>
                      )}

                      {job.tags && job.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {job.tags.slice(0, 5).map((tag) => (
                            <span
                              key={tag}
                              className="inline-flex items-center rounded-full bg-slate-50 px-2 py-0.5 text-[10px] font-medium text-slate-700"
                            >
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Right side: meta + actions */}
                    <div className="flex flex-col items-start gap-2 text-[11px] text-slate-500 sm:items-end">
                      <span>Posted {formatDate(job.created_at)}</span>

                      <div className="flex items-center gap-2">
                        <SocialIcon
                          href={linkedInUrl}
                          label="Share on LinkedIn"
                          bgColor="#0A66C2"
                        >
                          <span className="text-[11px] font-bold leading-none">
                            in
                          </span>
                        </SocialIcon>
                        <SocialIcon
                          href={xUrl}
                          label="Share on X"
                          bgColor="#000000"
                        >
                          <span className="text-[11px] font-bold leading-none">
                            X
                          </span>
                        </SocialIcon>
                        <SocialIcon
                          href={whatsappUrl}
                          label="Share on WhatsApp"
                          bgColor="#25D366"
                        >
                          <span className="text-[11px] font-semibold leading-none">
                            wa
                          </span>
                        </SocialIcon>
                      </div>

                      <Link
                        href={`/jobs/${encodeURIComponent(slugOrId)}`}
                        className="mt-1 inline-flex items-center rounded-full bg-[#172965] px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-[#111c4c]"
                      >
                        View &amp; apply
                        <span className="ml-1 text-[11px]" aria-hidden="true">
                          →
                        </span>
                      </Link>
                    </div>
                  </article>
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </main>
  );
}
