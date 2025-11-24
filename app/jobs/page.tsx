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
      <span className="text-slate-500" aria-hidden="true">
        {icon}
      </span>
      <span>{label}</span>
    </span>
  );
}

function IconLocation() {
  return (
    <svg
      className="h-3 w-3"
      viewBox="0 0 20 20"
      aria-hidden="true"
      fill="none"
    >
      <path
        d="M10 2.5a4.5 4.5 0 0 0-4.5 4.5c0 3.038 3.287 6.87 4.063 7.69a.6.6 0 0 0 .874 0C11.213 13.87 14.5 10.038 14.5 7A4.5 4.5 0 0 0 10 2.5Z"
        stroke="currentColor"
        strokeWidth="1.3"
      />
      <circle cx="10" cy="7" r="1.6" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  );
}

function IconBriefcase() {
  return (
    <svg
      className="h-3 w-3"
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
        stroke="currentColor"
        strokeWidth="1.3"
      />
      <path
        d="M7.5 6V5.4A1.9 1.9 0 0 1 9.4 3.5h1.2a1.9 1.9 0 0 1 1.9 1.9V6"
        stroke="currentColor"
        strokeWidth="1.3"
      />
      <path
        d="M3.5 9.5h4m5 0h4"
        stroke="currentColor"
        strokeWidth="1.1"
        strokeLinecap="round"
      />
    </svg>
  );
}

function IconStar() {
  return (
    <svg
      className="h-3 w-3"
      viewBox="0 0 20 20"
      aria-hidden="true"
      fill="none"
    >
      <path
        d="m10 3.2 1.54 3.12 3.44.5-2.49 2.43.59 3.47L10 11.6l-3.08 1.62.59-3.47L5.02 6.82l3.44-.5L10 3.2Z"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconGlobe() {
  return (
    <svg
      className="h-3 w-3"
      viewBox="0 0 20 20"
      aria-hidden="true"
      fill="none"
    >
      <circle cx="10" cy="10" r="6.2" stroke="currentColor" strokeWidth="1.2" />
      <path
        d="M10 3.8c-1.5 1.7-2.3 3.9-2.3 6.2 0 2.3.8 4.5 2.3 6.2m0-12.4c1.5 1.7 2.3 3.9 2.3 6.2 0 2.3-.8 4.5-2.3 6.2M4.2 10h11.6"
        stroke="currentColor"
        strokeWidth="1.1"
      />
    </svg>
  );
}

type SocialIconButtonProps = {
  href: string;
  label: string;
  bgColor: string;
  children: ReactNode;
};

function SocialIconButton({
  href,
  label,
  bgColor,
  children,
}: SocialIconButtonProps) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      aria-label={label}
      className="inline-flex h-7 w-7 items-center justify-center rounded-full text-white shadow-sm transition hover:-translate-y-[1px] hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#172965] focus-visible:ring-offset-1"
      style={{ backgroundColor: bgColor }}
    >
      {children}
    </a>
  );
}

/**
 * Brand-style logos – they inherit the button's text color (white)
 * and we give the brand colour via SocialIconButton.bgColor
 */
function LinkedInLogoIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="h-3.5 w-3.5"
      fill="currentColor"
    >
      <rect x="3" y="3" width="18" height="18" rx="2.5" />
      <path d="M8.16 17h-2.2V10h2.2v7Zm-1.1-8A1.28 1.28 0 1 1 7.28 8a1.27 1.27 0 0 1-1.22 1Z" />
      <path d="M18.5 17h-2.18v-3.63c0-.92-.36-1.55-1.16-1.55-.62 0-1 .42-1.17.83-.06.14-.08.33-.08.52V17h-2.18V10h2.18v1.03c.31-.48.87-1.16 2.08-1.16 1.52 0 2.51 1 2.51 3.17V17Z" />
    </svg>
  );
}

function XLogoIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="h-3.5 w-3.5"
      fill="currentColor"
    >
      <path d="M5 5h3.1L12 9.8 15.9 5H19l-5.1 6.1L19 19h-3.1L12 14.2 8.1 19H5l5.1-7.9L5 5Z" />
    </svg>
  );
}

function WhatsAppLogoIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="h-3.5 w-3.5"
    >
      <path
        d="M12 4.5A7 7 0 0 0 5 11.5c0 1.2.3 2.1.9 3.1L5 19l4.4-.9c.9.4 1.7.5 2.6.5 3.9 0 7-3.1 7-7.1a7 7 0 0 0-7-7Z"
        stroke="currentColor"
        strokeWidth="1.3"
        fill="none"
      />
      <path
        d="M9.5 9.2c.1-.2.2-.2.4-.2h.3c.1 0 .2 0 .3.2l.6 1c.1.1.1.2 0 .3l-.3.4c-.1.1-.1.2 0 .3 0 0 .6 1.1 1.6 1.6.7.4.8.3.9.2l.4-.5c.1-.1.2-.1.4 0l1 .5c.2.1.3.2.3.3 0 .2-.1.8-.5 1.2-.5.5-1.1.5-1.9.3-1.1-.3-2-1-2.7-1.7-.7-.7-1.3-1.6-1.6-2.5-.3-.9-.1-1.4.2-1.8Z"
        fill="currentColor"
      />
    </svg>
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
                        bgColor="#0A66C2"
                      >
                        <LinkedInLogoIcon />
                      </SocialIconButton>
                      <SocialIconButton
                        href={xUrl}
                        label="Share on X"
                        bgColor="#000000"
                      >
                        <XLogoIcon />
                      </SocialIconButton>
                      <SocialIconButton
                        href={whatsappUrl}
                        label="Share on WhatsApp"
                        bgColor="#25D366"
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
