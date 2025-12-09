// components/careers/CareersSitePage.tsx
import Image from "next/image";
import Link from "next/link";

type CareersSitePageProps = {
  tenant: any;
  clientCompany: any | null;
  settings: any | null;
  jobs: any[];
};

function getBranding(
  tenant: any,
  clientCompany: any | null,
  settings: any | null,
) {
  const companyName =
    clientCompany?.name || tenant?.name || "this team";

  const heroTitle =
    settings?.heroTitle || `Careers at ${companyName}`;

  const heroSubtitle =
    settings?.heroSubtitle ||
    `Join ${companyName} and help build what comes next.`;

  const aboutHtml =
    settings?.aboutHtml ||
    `We’re building a high-trust, high-ownership environment where good people can do their best work.`;

  const logoUrl =
    settings?.logoUrl ||
    clientCompany?.logoUrl ||
    tenant?.logoUrl ||
    null;

  const primaryColorHex =
    settings?.primaryColorHex || "#0f172a"; // slate-900
  const accentColorHex =
    settings?.accentColorHex || "#38bdf8"; // sky-400
  const heroBackgroundHex =
    settings?.heroBackgroundHex || "#020617"; // slate-950

  // For now we only have website; social handles can be added later
  const websiteUrl =
    clientCompany?.website || tenant?.websiteUrl || null;

  return {
    companyName,
    heroTitle,
    heroSubtitle,
    aboutHtml,
    logoUrl,
    primaryColorHex,
    accentColorHex,
    heroBackgroundHex,
    websiteUrl,
  };
}

type JobCardProps = {
  job: any;
};

function JobCard({ job }: JobCardProps) {
  const createdAt = job.createdAt ? new Date(job.createdAt) : null;

  const meta: string[] = [];
  if (job.location) meta.push(job.location);
  const employmentType =
    job.employmentType || job.employment_type || null;
  if (employmentType) meta.push(employmentType);
  if (job.department) meta.push(job.department);

  const metaLine = meta.join(" • ");

  // Use relative URL so we stay on the same host (tenant/client careersite)
  const href = `/jobs/${job.slug || job.id}`;

  const shortDescription =
    job.shortDescription || job.short_description || null;

  return (
    <article className="group rounded-2xl border border-slate-800 bg-slate-900/50 p-5 transition hover:border-sky-500/70 hover:bg-slate-900">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-base font-semibold text-slate-50 group-hover:text-sky-300">
            {job.title}
          </h3>
          {metaLine && (
            <p className="mt-1 text-xs text-slate-400">{metaLine}</p>
          )}
        </div>
        {createdAt && (
          <span className="rounded-full bg-slate-800 px-3 py-1 text-xs text-slate-300">
            Posted{" "}
            {createdAt.toLocaleDateString(undefined, {
              month: "short",
              day: "numeric",
            })}
          </span>
        )}
      </div>

      {shortDescription && (
        <p className="mt-3 line-clamp-2 text-sm text-slate-300">
          {shortDescription}
        </p>
      )}

      <div className="mt-4 flex items-center justify-between gap-3">
        <Link
          href={href}
          className="inline-flex items-center gap-2 text-sm font-medium text-sky-400 hover:text-sky-300"
        >
          View role
          <span aria-hidden="true">↗</span>
        </Link>
      </div>
    </article>
  );
}

export default function CareersSitePage({
  tenant,
  clientCompany,
  settings,
  jobs,
}: CareersSitePageProps) {
  const {
    companyName,
    heroTitle,
    heroSubtitle,
    aboutHtml,
    logoUrl,
    heroBackgroundHex,
    websiteUrl,
  } = getBranding(tenant, clientCompany, settings);

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50">
      {/* Hero */}
      <section
        className="relative overflow-hidden border-b border-slate-800 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950"
        style={{ backgroundColor: heroBackgroundHex }}
      >
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.16),_transparent_60%),radial-gradient(circle_at_bottom,_rgba(56,189,248,0.08),_transparent_55%)]" />
        <div className="relative mx-auto flex max-w-6xl flex-col gap-10 px-4 py-10 md:flex-row md:items-center md:justify-between md:px-8 md:py-14">
          <div className="max-w-xl space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-900/60 px-3 py-1 text-xs font-medium text-slate-300">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              Now hiring at {companyName}
            </div>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-50 md:text-4xl">
              {heroTitle}
            </h1>
            <p className="text-sm leading-relaxed text-slate-300 md:text-base">
              {heroSubtitle}
            </p>
          </div>

          <div className="relative h-48 w-full max-w-md overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/60 md:h-56">
            {/* If you add a proper banner image later, you can wire it here.
                For now we keep a clean gradient and logo chip. */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(56,189,248,0.35),_transparent_55%),radial-gradient(circle_at_bottom_right,_rgba(56,189,248,0.12),_transparent_60%)]" />
            {logoUrl && (
              <div className="absolute bottom-4 left-4 flex items-center gap-3 rounded-xl bg-slate-950/80 px-3 py-2">
                <div className="relative h-8 w-8 overflow-hidden rounded-lg bg-slate-800">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={logoUrl}
                    alt={companyName}
                    className="h-full w-full object-contain"
                  />
                </div>
                <p className="text-xs font-medium text-slate-100">
                  {companyName}
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Body */}
      <section className="mx-auto flex max-w-6xl flex-col gap-10 px-4 py-10 md:flex-row md:px-8 md:py-12">
        {/* Jobs list */}
        <div className="flex-1 space-y-6">
          <div className="space-y-1">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-sky-400">
              Open roles
            </h2>
            <p className="text-sm text-slate-400">
              Explore opportunities across teams and locations. Apply in a
              few minutes – no account required.
            </p>
          </div>

          {jobs.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-900/40 p-6 text-sm text-slate-400">
              <p>
                There are currently no open roles published for this
                organisation. Please check back soon or follow their
                announcements for updates.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {jobs.map((job) => (
                <JobCard key={job.id} job={job} />
              ))}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <aside className="w-full max-w-sm space-y-6 rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-slate-200">
              Working at {companyName}
            </h3>
            {aboutHtml ? (
              <div
                className="text-sm leading-relaxed text-slate-400"
                dangerouslySetInnerHTML={{ __html: aboutHtml }}
              />
            ) : (
              <p className="text-sm leading-relaxed text-slate-400">
                We focus on thoughtful work, clear communication and a
                healthy pace. You&apos;ll join a team that values
                ownership, curiosity and long-term thinking.
              </p>
            )}
          </div>

          {websiteUrl && (
            <div className="space-y-3">
              <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Learn more
              </h4>
              <Link
                href={websiteUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-full bg-slate-800 px-4 py-2 text-sm font-medium text-slate-50 shadow-sm transition hover:bg-slate-700"
              >
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-slate-900 text-xs font-semibold uppercase">
                  www
                </span>
                <span>Visit company website</span>
              </Link>
            </div>
          )}

          <div className="space-y-2 rounded-xl border border-slate-800 bg-slate-950/70 p-4">
            <p className="text-xs font-medium text-slate-300">
              Powered by ThinkATS
            </p>
            <p className="text-xs text-slate-500">
              This careers site is hosted on ThinkATS – a modern applicant
              tracking system for agencies and in-house teams.
            </p>
          </div>
        </aside>
      </section>
    </main>
  );
}
