// app/jobs/page.tsx
import type { Metadata } from "next";
import Link from "next/link";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import {
  Briefcase,
  MapPin,
  Clock,
  Share2,
  Tag as TagIcon,
  ArrowUpRight,
} from "lucide-react";

export const revalidate = 60;

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
  created_at: string;
  tags: string[] | null;
};

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL || "";

// Build share links for X, LinkedIn, WhatsApp
function buildShareLinks(slugOrId: string, title: string) {
  if (!SITE_URL) return null;

  const base = SITE_URL.replace(/\/$/, "");
  const url = `${base}/jobs/${encodeURIComponent(slugOrId)}`;
  const encodedUrl = encodeURIComponent(url);
  const text = encodeURIComponent(`${title} · Resourcin`);

  return {
    x: `https://x.com/intent/tweet?text=${text}&url=${encodedUrl}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
    whatsapp: `https://api.whatsapp.com/send?text=${text}%20${encodedUrl}`,
  };
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
  });
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
    .eq("status", "open")
    .eq("visibility", "public")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error loading public jobs:", error);
  }

  const jobs = (data ?? []) as PublicJob[];
  const count = jobs.length;

  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      {/* Header / Hero */}
      <header className="mb-8 rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 via-white to-slate-100 px-5 py-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="inline-flex items-center rounded-full bg-slate-900/90 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-50">
              For candidates
            </p>
            <h1 className="mt-3 text-2xl font-semibold text-slate-900 md:text-3xl">
              Open roles with Resourcin & clients
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-600">
              Browse live mandates across functions and locations. You can apply
              without creating an account; we&apos;ll only reach out when
              there&apos;s a strong match.
            </p>
          </div>

          <div className="flex flex-col items-start gap-2 text-xs text-slate-600 sm:items-end">
            <div className="inline-flex items-center rounded-full bg-white px-3 py-1 shadow-sm ring-1 ring-slate-200">
              <Briefcase className="mr-1.5 h-3.5 w-3.5 text-[#172965]" />
              <span className="font-medium">
                {count === 0
                  ? "No roles open"
                  : `${count} role${count === 1 ? "" : "s"} open`}
              </span>
            </div>
            <p className="max-w-[220px] text-[11px] text-slate-500 text-right">
              Join our{" "}
              <Link
                href="/talent-network"
                className="font-semibold text-[#172965] hover:underline"
              >
                talent network
              </Link>{" "}
              to be considered for upcoming roles.
            </p>
          </div>
        </div>
      </header>

      {/* Empty state */}
      {jobs.length === 0 ? (
        <section className="mt-8 rounded-2xl border border-dashed border-slate-200 bg-white p-6 text-sm text-slate-600">
          <p>
            There are no public roles open right now. You can{" "}
            <Link
              href="/talent-network"
              className="font-semibold text-[#172965] hover:underline"
            >
              join the talent network
            </Link>{" "}
            so we can reach out when there&apos;s a strong match.
          </p>
        </section>
      ) : (
        <section className="mt-4 space-y-4">
          {jobs.map((job) => {
            const slugOrId = job.slug || job.id;
            if (!slugOrId) {
              console.warn("Job missing slug and id", job);
              return null;
            }

            const share = buildShareLinks(slugOrId, job.title);

            return (
              <article
                key={job.id}
                className="group rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-[#172965]/70 hover:shadow-md"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  {/* Left side: core details */}
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-sm font-semibold text-slate-900">
                        <Link
                          href={`/jobs/${encodeURIComponent(slugOrId)}`}
                          className="inline-flex items-center gap-1 hover:underline"
                        >
                          {job.title}
                          <ArrowUpRight className="h-3.5 w-3.5 text-slate-400 group-hover:text-[#172965]" />
                        </Link>
                      </h2>
                    </div>

                    <div className="mt-2 flex flex-wrap items-center gap-3 text-[11px] text-slate-600">
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5 text-slate-400" />
                        {job.location || "Location flexible"}
                      </span>
                      {job.employment_type && (
                        <span className="inline-flex items-center gap-1">
                          <Briefcase className="h-3.5 w-3.5 text-slate-400" />
                          {job.employment_type}
                        </span>
                      )}
                      {job.seniority && (
                        <span className="inline-flex items-center gap-1 uppercase tracking-wide">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                          {job.seniority}
                        </span>
                      )}
                    </div>

                    <div className="mt-1 inline-flex items-center gap-1 text-[11px] text-slate-500">
                      <Clock className="h-3.5 w-3.5 text-slate-400" />
                      <span>Posted {formatDate(job.created_at)}</span>
                    </div>

                    {/* Tags */}
                    {job.tags && job.tags.length > 0 && (
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <span className="inline-flex items-center rounded-full bg-slate-50 px-2 py-0.5 text-[10px] font-medium text-slate-600">
                          <TagIcon className="mr-1 h-3 w-3 text-slate-400" />
                          Tags
                        </span>
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
                  </div>

                  {/* Right side: CTA + share */}
                  <div className="flex flex-col items-start gap-2 text-[11px] text-slate-500 sm:items-end">
                    <Link
                      href={`/jobs/${encodeURIComponent(slugOrId)}`}
                      className="inline-flex items-center rounded-full bg-[#172965] px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-[#111c4c] transition"
                    >
                      View role
                    </Link>

                    {share && (
                      <div className="flex flex-wrap items-center justify-end gap-2">
                        <span className="inline-flex items-center gap-1 text-[10px] text-slate-500">
                          <Share2 className="h-3 w-3 text-slate-400" />
                          Share:
                        </span>
                        <a
                          href={share.x}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[10px] font-medium text-slate-600 hover:text-black"
                        >
                          X
                        </a>
                        <span className="text-slate-300">•</span>
                        <a
                          href={share.linkedin}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[10px] font-medium text-slate-600 hover:text-[#0a66c2]"
                        >
                          LinkedIn
                        </a>
                        <span className="text-slate-300">•</span>
                        <a
                          href={share.whatsapp}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[10px] font-medium text-slate-600 hover:text-[#128c7e]"
                        >
                          WhatsApp
                        </a>
                      </div>
                    )}
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
