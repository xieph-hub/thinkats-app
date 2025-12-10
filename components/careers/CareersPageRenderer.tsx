// components/careers/CareersPageRenderer.tsx
import Link from "next/link";
import type {
  CareerSiteSettings,
  CareerTheme,
  Job,
  ClientCompany,
} from "@prisma/client";
import type {
  CareerLayout,
  CareerLayoutSection,
} from "@/lib/careersLayout";
import { parseCareerLayout, getDefaultCareerLayout } from "@/lib/careersLayout";

type JobWithClient = Job & { clientCompany: ClientCompany | null };

type Props = {
  displayName: string;
  settings: CareerSiteSettings | null;
  theme: CareerTheme | null;
  layout: CareerLayout | null;
  jobs: JobWithClient[];
  primaryColor: string;
  accentColor: string;
  assetBaseUrl: string | null;
};

export default function CareersPageRenderer({
  displayName,
  settings,
  theme,
  layout,
  jobs,
  primaryColor,
  accentColor,
}: Props) {
  const effectiveLayout =
    layout && layout.sections
      ? parseCareerLayout(layout)
      : getDefaultCareerLayout();

  const hasJobs = jobs.length > 0;

  return (
    <div className="space-y-10 pb-12">
      {effectiveLayout.sections.map((section, idx) => (
        <section key={idx}>
          {renderSection(section, {
            displayName,
            settings,
            theme,
            primaryColor,
            accentColor,
            jobs,
            hasJobs,
          })}
        </section>
      ))}
    </div>
  );
}

function renderSection(
  section: CareerLayoutSection,
  ctx: {
    displayName: string;
    settings: CareerSiteSettings | null;
    theme: CareerTheme | null;
    primaryColor: string;
    accentColor: string;
    jobs: JobWithClient[];
    hasJobs: boolean;
  },
) {
  switch (section.type) {
    case "hero":
      return (
        <div
          className="rounded-3xl border border-slate-800/70 bg-slate-950/80 px-6 py-10 shadow-lg md:px-10 md:py-12"
          style={{
            backgroundImage: `radial-gradient(circle at top left, ${ctx.accentColor}33, transparent 55%), radial-gradient(circle at bottom right, ${ctx.primaryColor}33, transparent 55%)`,
          }}
        >
          <div className="space-y-4 md:max-w-2xl">
            {section.eyebrow && (
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-300/80">
                {section.eyebrow}
              </p>
            )}
            <h1
              className={`text-3xl font-semibold tracking-tight text-slate-50 md:text-4xl ${
                section.align === "center" ? "text-center" : "text-left"
              }`}
            >
              {section.title || `Careers at ${ctx.displayName}`}
            </h1>
            {section.subtitle && (
              <p
                className={`text-sm text-slate-300/90 ${
                  section.align === "center" ? "text-center" : "text-left"
                }`}
              >
                {section.subtitle}
              </p>
            )}
            {ctx.hasJobs && (
              <p
                className={`text-[11px] text-slate-400 ${
                  section.align === "center" ? "text-center" : "text-left"
                }`}
              >
                Showing{" "}
                <span className="font-semibold text-slate-50">
                  {ctx.jobs.length}
                </span>{" "}
                open role{ctx.jobs.length === 1 ? "" : "s"}.
              </p>
            )}
          </div>
        </div>
      );

    case "rich_text":
      if (!section.html && !section.title) return null;
      return (
        <div className="rounded-2xl border border-slate-800/60 bg-slate-950/80 p-6">
          {section.title && (
            <h2 className="mb-2 text-sm font-semibold text-slate-100">
              {section.title}
            </h2>
          )}
          {section.html && (
            <div
              className="prose prose-invert max-w-none prose-p:text-slate-200 prose-li:text-slate-200 prose-strong:text-slate-50 prose-a:text-sky-400"
              dangerouslySetInnerHTML={{ __html: section.html }}
            />
          )}
        </div>
      );

    case "values":
      if (!section.items?.length) return null;
      return (
        <div className="rounded-2xl border border-slate-800/60 bg-slate-950/80 p-6">
          {section.title && (
            <h2 className="mb-4 text-sm font-semibold text-slate-100">
              {section.title}
            </h2>
          )}
          <div className="grid gap-4 md:grid-cols-3">
            {section.items.map((item, idx) => (
              <div
                key={idx}
                className="rounded-xl border border-slate-800/80 bg-slate-950/90 p-4"
              >
                <p className="text-xs font-semibold text-slate-100">
                  {item.label}
                </p>
                {item.description && (
                  <p className="mt-1 text-[11px] text-slate-400">
                    {item.description}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      );

    case "stats":
      if (!section.items?.length) return null;
      return (
        <div className="rounded-2xl border border-slate-800/60 bg-slate-950/80 p-6">
          {section.title && (
            <h2 className="mb-4 text-sm font-semibold text-slate-100">
              {section.title}
            </h2>
          )}
          <div className="grid gap-4 md:grid-cols-4">
            {section.items.map((item, idx) => (
              <div
                key={idx}
                className="flex flex-col rounded-xl border border-slate-800/80 bg-slate-950/90 px-4 py-3"
              >
                <span className="text-xs text-slate-400">{item.label}</span>
                <span className="mt-1 text-lg font-semibold text-slate-50">
                  {item.value}
                </span>
              </div>
            ))}
          </div>
        </div>
      );

    case "jobs_list":
      return (
        <div className="rounded-2xl border border-slate-800/60 bg-slate-950/80 p-6">
          <div className="mb-4 flex items-end justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold text-slate-100">
                {section.title || "Open positions"}
              </h2>
              {section.intro && (
                <p className="mt-1 text-[11px] text-slate-400">
                  {section.intro}
                </p>
              )}
            </div>
            {ctx.hasJobs && (
              <p className="text-[10px] text-slate-500">
                {ctx.jobs.length} open role
                {ctx.jobs.length === 1 ? "" : "s"}
              </p>
            )}
          </div>

          {!ctx.hasJobs ? (
            <p className="text-[11px] text-slate-500">
              No open roles right now. Check back soon or follow our updates on
              LinkedIn.
            </p>
          ) : section.layout === "rows" ? (
            <div className="divide-y divide-slate-800/70">
              {ctx.jobs.map((job) => (
                <JobRow key={job.id} job={job} accentColor={ctx.accentColor} />
              ))}
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {ctx.jobs.map((job) => (
                <JobCard
                  key={job.id}
                  job={job}
                  accentColor={ctx.accentColor}
                />
              ))}
            </div>
          )}
        </div>
      );

    default:
      return null;
  }
}

function jobHref(job: JobWithClient) {
  const slugOrId = job.slug || job.id;
  return `/jobs/${encodeURIComponent(slugOrId)}`;
}

function JobCard({
  job,
  accentColor,
}: {
  job: JobWithClient;
  accentColor: string;
}) {
  return (
    <Link
      href={jobHref(job)}
      className="flex h-full flex-col rounded-xl border border-slate-800/80 bg-slate-950/90 p-4 transition hover:border-slate-500 hover:bg-slate-900/90"
    >
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold text-slate-50">
            {job.title}
          </h3>
          {job.clientCompany && (
            <p className="mt-0.5 text-[11px] text-slate-400">
              {job.clientCompany.name}
            </p>
          )}
        </div>
        {job.location && (
          <span className="inline-flex items-center rounded-full border border-slate-700/70 bg-slate-950/80 px-2.5 py-0.5 text-[10px] font-medium text-slate-300">
            {job.location}
          </span>
        )}
      </div>

      {job.shortDescription && (
        <p className="mb-3 line-clamp-2 text-[11px] text-slate-400">
          {job.shortDescription}
        </p>
      )}

      <div className="mt-auto flex items-center justify-between pt-1 text-[10px] text-slate-500">
        <span>
          {job.employmentType || "Full time"}
          {job.department ? ` · ${job.department}` : ""}
        </span>
        <span
          className="font-semibold"
          style={{ color: accentColor || "#0ea5e9" }}
        >
          View role →
        </span>
      </div>
    </Link>
  );
}

function JobRow({
  job,
  accentColor,
}: {
  job: JobWithClient;
  accentColor: string;
}) {
  return (
    <Link
      href={jobHref(job)}
      className="flex flex-col gap-2 py-3 transition hover:bg-slate-900/40"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-col">
          <span className="text-sm font-semibold text-slate-50">
            {job.title}
          </span>
          <span className="text-[11px] text-slate-400">
            {job.clientCompany?.name || "Open role"}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-[10px] text-slate-400">
          {job.location && (
            <span className="rounded-full border border-slate-700/70 bg-slate-950/80 px-2 py-0.5">
              {job.location}
            </span>
          )}
          {job.employmentType && (
            <span className="rounded-full border border-slate-700/70 bg-slate-950/80 px-2 py-0.5">
              {job.employmentType}
            </span>
          )}
          <span
            className="font-semibold"
            style={{ color: accentColor || "#0ea5e9" }}
          >
            View →
          </span>
        </div>
      </div>
    </Link>
  );
}
