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

function deriveWorkMode(job: PublicJob): string | null {
  const loc = (job.location || "").toLowerCase();
  const tags = (job.tags || []).map((t) => t.toLowerCase());

  if (loc.includes("remote") || tags.includes("remote")) return "Remote";
  if (loc.includes("hybrid") || tags.includes("hybrid")) return "Hybrid";
  if (loc.includes("flexible") || tags.includes("flexible")) return "Flexible";
  if (loc.includes("on-site") || loc.includes("onsite")) return "On-site";

  return null;
}

function MetaItem({ icon, label }: { icon: ReactNode; label: string }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-[11px] text-slate-700">
      <span aria-hidden="true">{icon}</span>
      <span>{label}</span>
    </span>
  );
}

// === ICONS (location / briefcase / seniority / work-mode) ===

function IconLocation() {
  // Red pin
  return (
    <svg
      className="h-3.5 w-3.5"
      viewBox="0 0 20 20"
      aria-hidden="true"
      fill="none"
    >
      <path
        d="M10 2.5a4.5 4.5 0 0 0-4.5 4.5c0 3.038 3.287 6.87 4.063 7.69a.6.6 0 0 0 .874 0C11.213 13.87 14.5 10.038 14.5 7A4.5 4.5 0 0 0 10 2.5Z"
        stroke="#EF4444"
        strokeWidth="1.3"
      />
      <circle cx="10" cy="7" r="1.6" fill="#F87171" />
    </svg>
  );
}

function IconBriefcase() {
  // Brown / amber briefcase
  return (
    <svg
      className="h-3.5 w-3.5"
      viewBox="0 0 20 20"
      aria-hidden="true"
      fill="none"
    >
      <rect
        x="3"
        y="6"
        width="14"
        height="9"
        rx="1.7"
        stroke="#92400E"
        strokeWidth="1.3"
        fill="#FEF3C7"
      />
      <path
        d="M7.5 6V5.4A1.9 1.9 0 0 1 9.4 3.5h1.2a1.9 1.9 0 0 1 1.9 1.9V6"
        stroke="#92400E"
        strokeWidth="1.3"
      />
      <path
        d="M3.5 9.5h4m5 0h4"
        stroke="#B45309"
        strokeWidth="1.1"
        strokeLinecap="round"
      />
    </svg>
  );
}

function IconStar() {
  // Gold-ish seniority
  return (
    <svg
      className="h-3.5 w-3.5"
      viewBox="0 0 20 20"
      aria-hidden="true"
      fill="none"
    >
      <path
        d="m10 3.2 1.54 3.12 3.44.5-2.49 2.43.59 3.47L10 11.6l-3.08 1.62.59-3.47L5.02 6.82l3.44-.5L10 3.2Z"
        stroke="#EAB308"
        strokeWidth="1.2"
        strokeLinejoin="round"
        fill="#FEF9C3"
      />
    </svg>
  );
}

function IconGlobe() {
  // Teal work-mode icon
  return (
    <svg
      className="h-3.5 w-3.5"
      viewBox="0 0 20 20"
      aria-hidden="true"
      fill="none"
    >
      <circle cx="10" cy="10" r="6.2" stroke="#0D9488" strokeWidth="1.2" />
      <path
        d="M10 3.8c-1.5 1.7-2.3 3.9-2.3 6.2 0 2.3.8 4.5 2.3 6.2 1.5-1.7 2.3-3.9 2.3-6.2 0-2.3-.8-4.5-2.3-6.2Zm-5.8 6.2h11.6"
        stroke="#0D9488"
        strokeWidth="1.1"
      />
    </svg>
  );
}

// === SOCIAL ICON LINKS (logos only, no pills) ===

type SocialIconButtonProps = {
  href: string;
  label: string;
  className?: string;
  children: ReactNode;
};

function SocialIconButton({
  href,
  label,
  className,
  children,
}: SocialIconButtonProps) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      aria-label={label}
      title={label}
      className={`inline-flex items-center justify-center text-xs transition hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#172965] focus-visible:ring-offset-1 ${className ?? ""}`}
    >
      {children}
    </a>
  );
}

function LinkedInLogoIcon() {
  // Blue tile + white "in"
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="h-4 w-4"
      role="img"
    >
      {/* Background square */}
      <rect x="2" y="2" width="20" height="20" rx="4" fill="#0A66C2" />
      {/* "in" letters */}
      <path
        d="M8.15 16.5H6.25V10h1.9v6.5Zm-.95-7.5c-.63 0-1.15-.5-1.15-1.15 0-.66.52-1.16 1.15-1.16.64 0 1.16.5 1.16 1.16 0 .65-.52 1.15-1.16 1.15Zm4.13 7.5h-1.9V10h1.82v.9c.32-.6.95-1.03 1.95-1.03 1.68 0 2.85 1.12 2.85 3.3v3.33h-1.9v-3.02c0-1.02-.48-1.69-1.45-1.69-.88 0-1.43.58-1.63 1.18-.06.14-.09.33-.09.52v3.01Z"
        fill="#FFFFFF"
      />
    </svg>
  );
}

function XLogoIcon() {
  // Simple X mark logo (you said this one is good)
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="h-4 w-4"
      role="img"
    >
      <path
        d="M5 5h3.2L13 11.1 16.7 5H19l-4.7 7.1L19 19h-3.2L11 12.9 7.3 19H5l4.7-6.9L5 5Z"
        fill="#000000"
      />
    </svg>
  );
}

function WhatsAppLogoIcon() {
  // Green bubble + white phone-ish mark
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="h-4 w-4"
      role="img"
    >
      {/* green bubble */}
      <path
        d="M4.5 19.5 5.7 16A7.3 7.3 0 0 1 4.7 11.5 7.3 7.3 0 0 1 12 4.2a7.3 7.3 0 0 1 7.3 7.3c0 4.1-3.3 7.3-7.3 7.3-1 0-2-.2-2.9-.6L4.5 19.5Z"
        fill="#25D366"
      />
      {/* white phone / chat mark */}
      <path
        d="M9.9 9.3c.1-.2.2-.3.4-.3h.3c.1 0 .2 0 .3.2l.6 1c.1.2.1.3 0 .4l-.3.4c-.1.1-.1.2-.1.3 0 .1.3.7.9 1.2.5.5 1.1.8 1.2.8.1 0 .2 0 .3-.1l.5-.5c.1-.1.2-.1.4 0l1 .5c.1.1.2.2.2.3 0 .2-.2.8-.6 1.2-.4.4-.9.6-1.5.6-.3 0-.6 0-1-.1-1.1-.3-2-1-2.8-1.8-.8-.8-1.4-1.7-1.7-2.7-.2-.6-.2-1.1 0-1.5.1-.2.2-.3.3-.4Z"
        fill="#FFFFFF"
      />
    </svg>
  );
}

// === PAGE ===

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
      department
    `
    )
    .eq("status", "open")
    .eq("visibility", "public")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Jobs page – error loading jobs:", error);
  }

  const jobs = (data ?? []) as PublicJob[];
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
        <section className="mt-4 space-y-4">
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
                className="rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-sm ring-1 ring-transparent transition hover:border-[#172965]/70 hover:bg-white hover:shadow-md hover:ring-[#172965]/5"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="space-y-2">
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
                        {job.department || "Client role"}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {job.location && (
                        <MetaItem
                          icon={<IconLocation />}
                          label={job.location}
                        />
                      )}
                      {workModeLabel && (
                        <MetaItem icon={<IconGlobe />} label={workModeLabel} />
                      )}
                      {employmentTypeLabel && (
                        <MetaItem
                          icon={<IconBriefcase />}
                          label={employmentTypeLabel}
                        />
                      )}
                      {job.seniority && (
                        <MetaItem icon={<IconStar />} label={job.seniority} />
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

                    <div className="mt-2 flex flex-wrap items-center gap-2 text-[10px] text-slate-500">
                      <span className="font-medium text-slate-600">
                        Share:
                      </span>
                      <SocialIconButton
                        href={linkedInUrl}
                        label="Share on LinkedIn"
                      >
                        <LinkedInLogoIcon />
                      </SocialIconButton>
                      <SocialIconButton href={xUrl} label="Share on X">
                        <XLogoIcon />
                      </SocialIconButton>
                      <SocialIconButton
                        href={whatsappUrl}
                        label="Share on WhatsApp"
                      >
                        <WhatsAppLogoIcon />
                      </SocialIconButton>
                    </div>
                  </div>

                  <div className="flex flex-col items-start gap-2 text-[11px] text-slate-500 sm:items-end">
                    <span>Posted {formatDate(job.created_at)}</span>
                    {(job.status || job.visibility) && (
                      <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] text-slate-700">
                        {job.status || "unspecified"}
                        {job.visibility ? ` · ${job.visibility}` : ""}
                      </span>
                    )}
                    <Link
                      href={`/jobs/${encodeURIComponent(slugOrId)}`}
                      className="mt-1 inline-flex items-center rounded-full bg-[#172965] px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-[#111c4c] transition"
                    >
                      View role
                      <span className="ml-1 text-[11px]" aria-hidden="true">
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
