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
  Building2,
} from "lucide-react";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Jobs | Resourcin",
  description:
    "Open roles managed by Resourcin across Africa and beyond. Browse and apply without creating an account.",
};

type ClientCompany = {
  name: string | null;
  logo_url: string | null;
  slug: string | null;
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
  client_company?: ClientCompany | null;
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

type WorkModeConfig = {
  label: string;
  bgClass: string;
  textClass: string;
  dotClass: string;
};

// Derive Remote / Hybrid / On-site from employment_type + location text
function getWorkMode(
  employmentType: string | null,
  location: string | null
): WorkModeConfig | null {
  const source = `${employmentType || ""} ${location || ""}`.toLowerCase();

  if (source.includes("remote")) {
    return {
      label: "Remote",
      bgClass: "bg-emerald-50",
      textClass: "text-emerald-700",
      dotClass: "bg-emerald-500",
    };
  }

  if (source.includes("hybrid")) {
    return {
      label: "Hybrid",
      bgClass: "bg-indigo-50",
      textClass: "text-indigo-700",
      dotClass: "bg-indigo-500",
    };
  }

  if (
    source.includes("onsite") ||
    source.includes("on-site") ||
    source.includes("on site")
  ) {
    return {
      label: "On-site",
      bgClass: "bg-orange-50",
      textClass: "text-orange-700",
      dotClass: "bg-orange-500",
    };
  }

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
      tags,
      client_company:client_companies (
        name,
        logo_url,
        slug
      )
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
            const client = job.client_company;
            const workMode = getWorkMode(job.employment_type, job.location);

            return (
              <article
                key={job.id}
                className="group rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-[#172965]/70 hover:shadow-md"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  {/* Left side: core details */}
                  <div className="flex-1">
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

                    {/* Hiring company */}
                    {client && (client.name || client.logo_url) && (
                      <div className="mt-2 flex items-center gap-2">
                        {client.logo_url && (
                          <div className="flex h-7 w-7 items-center justify-center overflow-hidden rounded-md border border-slate-200 bg-slate-50">
                            <img
                              src={client.logo_url}
                              alt={client.name || "Client logo"}
                              className="h-full w-full object-contain"
                            />
                          </div>
                        )}
                        <div className="flex items-center gap-1 text-[11px] text-slate-600">
                          <Building2 className="h-3.5 w-3.5 text-slate-400" />
                          <span className="uppercase tracking-[0.14em] text-slate-400">
                            Hiring company
                          </span>
                          {client.name && (
                            <span className="ml-1 font-medium text-slate-800 normal-case tracking-normal">
                              {client.name}
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="mt-2 flex flex-wrap items-center gap-3 text-[11px] text-slate-600">
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5 text-red-400" />
                        {job.location || "Location flexible"}
                      </span>

                      {job.employment_type && (
                        <span className="inline-flex items-center gap-1">
                          <Briefcase className="h-3.5 w-3.5 text-amber-500" />
                          <span className="font-medium text-slate-800">
                            {job.employment_type}
                          </span>
                        </span>
                      )}

                      {job.seniority && (
                        <span className="inline-flex items-center gap-1 uppercase tracking-wide">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                          {job.seniority}
                        </span>
                      )}

                      {workMode && (
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-medium ring-1 ring-black/5 ${workMode.bgClass} ${workMode.textClass}`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${workMode.dotClass}`}
                          />
                          {workMode.label}
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
