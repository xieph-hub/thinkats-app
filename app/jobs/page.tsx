// app/jobs/page.tsx
import Link from "next/link";
import { listPublicJobsForCurrentTenant, type JobsTableRow } from "@/lib/jobs";

export const dynamic = "force-dynamic"; // so new jobs appear immediately while building

function formatWorkMode(mode?: JobsTableRow["work_mode"]) {
  if (!mode) return null;
  switch (mode) {
    case "remote":
      return "Remote";
    case "hybrid":
      return "Hybrid";
    case "onsite":
      return "On-site";
    case "flexible":
      return "Flexible";
    default:
      return mode;
  }
}

function getShareUrls() {
  const base =
    process.env.NEXT_PUBLIC_SITE_URL ??
    process.env.SITE_URL ??
    "https://resourcin.com";

  const url = `${base.replace(/\/+$/, "")}/jobs`;
  const text = "Open roles via Resourcin – executive & specialist hiring across Africa.";

  const encodedUrl = encodeURIComponent(url);
  const encodedText = encodeURIComponent(text);

  return {
    url,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
    twitter: `https://x.com/intent/tweet?url=${encodedUrl}&text=${encodedText}`,
    whatsapp: `https://wa.me/?text=${encodedText}%20${encodedUrl}`,
  };
}

export default async function JobsPage() {
  const jobs = await listPublicJobsForCurrentTenant();
  const share = getShareUrls();

  return (
    <div className="mx-auto max-w-5xl px-4 py-16">
      {/* Header / hero */}
      <header className="mb-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">
            Opportunities
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight md:text-4xl">
            Roles Resourcin is currently leading.
          </h1>
          <p className="mt-3 max-w-xl text-sm text-gray-500">
            Executive, specialist and critical hires across Africa and beyond.{" "}
            Some searches are fully public; others are confidential – we&apos;ll
            note this on each role.
          </p>
        </div>

        {/* Share bar */}
        <div className="flex flex-col items-start gap-2 md:items-end">
          <span className="text-xs font-medium uppercase tracking-[0.16em] text-gray-500">
            Share this page
          </span>
          <div className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs shadow-sm">
            <a
              href={share.linkedin}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 rounded-full px-2 py-1 hover:bg-gray-50"
            >
              <span className="text-base">in</span>
              <span className="hidden sm:inline">LinkedIn</span>
            </a>
            <span className="h-4 w-px bg-gray-200" />
            <a
              href={share.twitter}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 rounded-full px-2 py-1 hover:bg-gray-50"
            >
              <span className="text-base">𝕏</span>
              <span className="hidden sm:inline">Post</span>
            </a>
            <span className="h-4 w-px bg-gray-200" />
            <a
              href={share.whatsapp}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 rounded-full px-2 py-1 hover:bg-gray-50"
            >
              <span className="text-base">🟢</span>
              <span className="hidden sm:inline">WhatsApp</span>
            </a>
          </div>
          <p className="max-w-xs text-[11px] text-gray-400">
            Founders, HR leaders and operators often forward this page directly
            to candidates they want to nudge.
          </p>
        </div>
      </header>

      {/* Job list */}
      {jobs.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 px-4 py-10 text-center text-sm text-gray-500">
          No open roles are live right now.
          <br />
          Check back soon or share your CV to join our talent network.
        </div>
      ) : (
        <section className="space-y-4">
          {jobs.map((job) => {
            const isConfidential = job.visibility === "confidential";
            const href = job.slug ? `/jobs/${job.slug}` : `/jobs/${job.id}`;
            const workModeLabel = formatWorkMode(job.work_mode);

            return (
              <Link
                key={job.id}
                href={href}
                className="block rounded-2xl border border-gray-200 bg-white px-4 py-4 transition hover:border-gray-900 hover:bg-gray-50 md:px-5 md:py-5"
              >
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  {/* Left: title + metadata */}
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-base font-semibold md:text-lg">
                        {job.title}
                      </h2>
                      {isConfidential ? (
                        <span className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-700">
                          Confidential search
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
                          Open role
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-gray-500">
                      {job.location && (
                        <span className="inline-flex items-center gap-1">
                          <span>📍</span>
                          <span>{job.location}</span>
                        </span>
                      )}

                      {workModeLabel && (
                        <span className="inline-flex items-center gap-1">
                          <span>💼</span>
                          <span>{workModeLabel}</span>
                        </span>
                      )}

                      {job.department && (
                        <span className="inline-flex items-center gap-1">
                          <span>🏷</span>
                          <span>{job.department}</span>
                        </span>
                      )}
                    </div>

                    {job.short_description && (
                      <p className="max-w-2xl text-sm text-gray-600">
                        {job.short_description}
                      </p>
                    )}
                  </div>

                  {/* Right: subtle CTA */}
                  <div className="flex items-center justify-between gap-3 md:flex-col md:items-end md:justify-start">
                    <span className="text-xs font-medium text-gray-500">
                      View details
                    </span>
                    <span className="hidden text-lg md:inline" aria-hidden="true">
                      ↗
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </section>
      )}
    </div>
  );
}
