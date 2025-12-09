// components/careers/CareersSitePage.tsx

import type {
  Tenant,
  ClientCompany,
  CareerSiteSettings,
  Job,
} from "@prisma/client";
import Link from "next/link";

type CareersSitePageProps = {
  tenant: Tenant;
  clientCompany: ClientCompany | null;
  settings: CareerSiteSettings | null;
  jobs: Job[];
};

export default function CareersSitePage({
  tenant,
  clientCompany,
  settings,
  jobs,
}: CareersSitePageProps) {
  const brandName = clientCompany?.name || tenant.name;
  const logoUrl =
    settings?.logoUrl || tenant.logoUrl || clientCompany?.logoUrl || null;

  const primaryColor =
    settings?.primaryColorHex ||
    settings?.primaryColor ||
    "#172965"; // sensible default
  const accentColor =
    settings?.accentColorHex || settings?.accentColor || "#FFC000";
  const heroBg = settings?.heroBackgroundHex || "#020617"; // slate-950 style

  const heroTitle =
    settings?.heroTitle ||
    `Careers at ${brandName}`;
  const heroSubtitle =
    settings?.heroSubtitle ||
    `Explore opportunities to grow your career with ${brandName}.`;
  const aboutHtml = settings?.aboutHtml || "";

  const hasJobs = jobs && jobs.length > 0;

  const linkedinUrl = settings?.linkedinUrl;
  const twitterUrl = settings?.twitterUrl;
  const instagramUrl = settings?.instagramUrl;

  const isPublic = settings?.isPublic ?? true;

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50">
      {/* Hero */}
      <section
        className="border-b border-slate-800"
        style={{ backgroundColor: heroBg }}
      >
        <div className="mx-auto flex max-w-5xl flex-col gap-6 px-4 pb-10 pt-10 lg:flex-row lg:items-center">
          {/* Left: logo + text */}
          <div className="flex-1 space-y-4">
            <div className="flex items-center gap-3">
              {logoUrl ? (
                <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-xl bg-slate-900/70 ring-1 ring-slate-800">
                  <img
                    src={logoUrl}
                    alt={brandName}
                    className="h-full w-full object-contain"
                  />
                </div>
              ) : (
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900/70 text-sm font-semibold text-slate-100 ring-1 ring-slate-800">
                  {brandName
                    .split(" ")
                    .map((p) => p.charAt(0))
                    .join("")
                    .slice(0, 2)
                    .toUpperCase()}
                </div>
              )}

              <div className="space-y-0.5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                  {tenant.name} · Careers
                </p>
                <p className="text-xs text-slate-300">
                  Powered by ThinkATS, fully branded for {brandName}.
                </p>
              </div>
            </div>

            <h1 className="text-3xl font-semibold leading-tight sm:text-4xl">
              {heroTitle}
            </h1>

            <p className="max-w-xl text-sm text-slate-200 sm:text-base">
              {heroSubtitle}
            </p>

            {aboutHtml && (
              <div className="mt-3 max-w-2xl space-y-2 text-xs leading-relaxed text-slate-200">
                {aboutHtml.split(/\r?\n\r?\n/).map((para, idx) => (
                  <p key={idx}>{para}</p>
                ))}
              </div>
            )}

            {/* Social links */}
            {(linkedinUrl || twitterUrl || instagramUrl) && (
              <div className="mt-4 flex flex-wrap items-center gap-3 text-[11px] text-slate-300">
                <span className="text-slate-400">Connect:</span>
                {linkedinUrl && (
                  <a
                    href={linkedinUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-full bg-slate-900/70 px-3 py-1 text-[11px] font-medium text-slate-100 ring-1 ring-slate-700 hover:bg-slate-900"
                  >
                    LinkedIn
                  </a>
                )}
                {twitterUrl && (
                  <a
                    href={twitterUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-full bg-slate-900/70 px-3 py-1 text-[11px] font-medium text-slate-100 ring-1 ring-slate-700 hover:bg-slate-900"
                  >
                    X / Twitter
                  </a>
                )}
                {instagramUrl && (
                  <a
                    href={instagramUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-full bg-slate-900/70 px-3 py-1 text-[11px] font-medium text-slate-100 ring-1 ring-slate-700 hover:bg-slate-900"
                  >
                    Instagram
                  </a>
                )}
              </div>
            )}
          </div>

          {/* Right: simple stats card */}
          <div className="flex-1">
            <div className="mx-auto w-full max-w-sm rounded-2xl border border-slate-800 bg-slate-900/70 p-4 shadow-lg shadow-slate-900/40">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                Snapshot
              </p>
              <p className="mt-1 text-sm font-semibold text-slate-50">
                Working at {brandName}
              </p>
              <p className="mt-1 text-xs text-slate-400">
                Roles listed here are managed in a structured ATS, but your
                application goes straight to the hiring team at {brandName}.
              </p>

              <div className="mt-3 space-y-2 text-[11px] text-slate-300">
                <div className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  <span>
                    {hasJobs
                      ? `${jobs.length} open role${jobs.length === 1 ? "" : "s"}`
                      : "No open roles listed right now"}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-sky-400" />
                  <span>Quick, candidate-first application flow.</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                  <span>Powered by ThinkATS — one workspace per client.</span>
                </div>
              </div>

              {!isPublic && (
                <p className="mt-3 rounded-md bg-amber-950/60 px-2 py-1.5 text-[10px] text-amber-200 ring-1 ring-amber-800/60">
                  This careers site is currently marked as{" "}
                  <span className="font-semibold">not public</span> in
                  configuration. You are seeing it because the link is known.
                </p>
              )}

              <p className="mt-4 border-t border-slate-800 pt-3 text-[10px] text-slate-500">
                Powered by{" "}
                <a
                  href="https://www.thinkats.com"
                  className="font-medium text-sky-400 hover:text-sky-300"
                >
                  ThinkATS
                </a>
                .
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Jobs list */}
      <section className="mx-auto max-w-5xl px-4 py-8">
        <header className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-50">
              Open roles at {brandName}
            </h2>
            <p className="text-xs text-slate-400">
              Roles listed here are managed in a single ATS workspace. Apply
              once; your profile can be considered across suitable roles.
            </p>
          </div>
        </header>

        {!hasJobs ? (
          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 text-sm text-slate-200">
            <p className="font-medium">No open roles right now</p>
            <p className="mt-1 text-xs text-slate-400">
              {brandName} doesn&apos;t have any public openings at the moment.
              You can check back later or follow their updates on social media.
            </p>
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {jobs.map((job) => {
              const jobSlugOrId = job.slug || job.id;
              return (
                <article
                  key={job.id}
                  className="flex flex-col justify-between rounded-2xl border border-slate-800 bg-slate-900/70 p-4 text-xs text-slate-200 shadow-sm"
                >
                  <div className="space-y-1.5">
                    <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-slate-400">
                      {job.department || "Open role"}
                    </p>
                    <h3 className="text-sm font-semibold text-slate-50">
                      {job.title}
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      {job.location || "Location flexible"}
                      {job.locationType && (
                        <>
                          {" "}
                          •{" "}
                          {job.locationType
                            .replace(/_/g, " ")
                            .toLowerCase()}
                        </>
                      )}
                    </p>
                    {job.shortDescription && (
                      <p className="mt-1 line-clamp-3 text-[11px] text-slate-300">
                        {job.shortDescription}
                      </p>
                    )}
                  </div>

                  <div className="mt-3 flex items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2 text-[10px] text-slate-400">
                      {job.employmentType && (
                        <span className="rounded-full bg-slate-900 px-2 py-0.5">
                          {job.employmentType}
                        </span>
                      )}
                      {job.experienceLevel && (
                        <span className="rounded-full bg-slate-900 px-2 py-0.5">
                          {job.experienceLevel}
                        </span>
                      )}
                    </div>

                    <Link
                      href={`/jobs/${encodeURIComponent(jobSlugOrId)}`}
                      className="inline-flex items-center rounded-full bg-sky-500 px-3 py-1 text-[11px] font-semibold text-slate-950 hover:bg-sky-400"
                    >
                      View role
                      <span className="ml-1 text-[10px]">↗</span>
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}
