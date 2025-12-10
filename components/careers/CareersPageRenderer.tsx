// components/careers/CareersPageRenderer.tsx
import type {
  CareerSiteSettings,
  Job,
  CareerTheme,
  ClientCompany,
} from "@prisma/client";
import type { CareerLayout } from "@/types/careersLayout";

type JobsWithClient = Job & { clientCompany?: ClientCompany | null };

type Props = {
  displayName: string;
  settings: CareerSiteSettings | null;
  theme: CareerTheme | null;
  layout: CareerLayout | null | any;
  jobs: JobsWithClient[];
  primaryColor: string;
  accentColor: string;
  assetBaseUrl: string | null;
};

function getEffectiveLayout(displayName: string, layout: any): CareerLayout {
  if (layout && Array.isArray((layout as any).sections)) {
    return layout as CareerLayout;
  }

  const heroTitle = `Jobs at ${displayName}`;
  const heroSubtitle =
    "Explore open jobs, learn more about how we work and apply in a few clicks.";

  return {
    sections: [
      {
        type: "hero",
        title: heroTitle,
        subtitle: heroSubtitle,
        align: "left",
        showCta: true,
      },
      {
        type: "intro",
        title: "Working here",
        bodyHtml:
          "<p>Use this space to explain what makes this organisation distinct – how decisions are made, how teams collaborate and what growth can look like.</p>",
      },
      {
        type: "jobs_list",
        title: "Open jobs",
        layout: "list",
        showSearch: false,
        showFilters: false,
      },
    ],
  } as CareerLayout;
}

function renderHeroSection(
  section: any,
  settings: CareerSiteSettings | null,
  primaryColor: string,
  accentColor: string,
) {
  const title = section.title ?? "Jobs";
  const subtitle =
    section.subtitle ??
    "Join the team and work on meaningful problems with people who care.";

  const align =
    section.align === "center" || section.align === "right"
      ? section.align
      : "left";

  const alignmentClasses =
    align === "center"
      ? "items-center text-center"
      : align === "right"
        ? "items-end text-right"
        : "items-start text-left";

  return (
    <section className="rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-900/60 to-slate-950 p-6 sm:p-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
        <div className={`flex-1 ${alignmentClasses}`}>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
            Jobs
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-50 sm:text-3xl">
            {title}
          </h2>
          <p className="mt-2 max-w-xl text-[12px] leading-relaxed text-slate-300">
            {subtitle}
          </p>
        </div>
        {section.showCta !== false && (
          <div className="flex flex-none items-end justify-start sm:justify-end">
            <a
              href="#jobs"
              className="inline-flex items-center rounded-full px-4 py-2 text-[11px] font-semibold text-slate-950 shadow-sm"
              style={{
                backgroundColor: accentColor || primaryColor,
              }}
            >
              View open jobs
            </a>
          </div>
        )}
      </div>
    </section>
  );
}

function renderIntroSection(section: any, settings: CareerSiteSettings | null) {
  const title = section.title ?? "About this team";
  const bodyHtml =
    section.bodyHtml ??
    settings?.aboutHtml ??
    "<p>Use this section to describe the mission, how teams work together and what you value in teammates.</p>";

  return (
    <section className="rounded-3xl border border-slate-800 bg-slate-950/40 p-5 sm:p-6">
      <h3 className="text-sm font-semibold text-slate-50">{title}</h3>
      <div
        className="prose prose-invert mt-3 max-w-none text-[12px] prose-p:mt-2 prose-p:leading-relaxed prose-strong:text-slate-50 prose-a:text-sky-400"
        dangerouslySetInnerHTML={{ __html: bodyHtml }}
      />
    </section>
  );
}

function renderJobsListSection(section: any, jobs: JobsWithClient[]) {
  const title = section.title ?? "Open jobs";

  if (!jobs || jobs.length === 0) {
    return (
      <section
        id="jobs"
        className="rounded-3xl border border-dashed border-slate-800 bg-slate-950/40 p-5 sm:p-6"
      >
        <h3 className="text-sm font-semibold text-slate-50">{title}</h3>
        <p className="mt-2 text-[12px] text-slate-400">
          There are no open jobs published right now. Check back soon or follow
          this organisation on their social channels.
        </p>
      </section>
    );
  }

  return (
    <section
      id="jobs"
      className="rounded-3xl border border-slate-800 bg-slate-950/40 p-5 sm:p-6"
    >
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-slate-50">{title}</h3>
        <p className="text-[11px] text-slate-400">
          {jobs.length} open {jobs.length === 1 ? "job" : "jobs"}
        </p>
      </div>

      <div className="mt-4 grid gap-3">
        {jobs.map((job) => {
          const href = job.slug
            ? `/jobs/${encodeURIComponent(job.slug)}`
            : `/jobs/${job.id}`;

          return (
            <a
              key={job.id}
              href={href}
              className="group flex items-start justify-between gap-3 rounded-2xl border border-slate-800/80 bg-slate-950/60 px-4 py-3 hover:border-sky-500/80 hover:bg-slate-900/80"
            >
              <div className="min-w-0">
                <h4 className="truncate text-[13px] font-medium text-slate-50 group-hover:text-sky-100">
                  {job.title}
                </h4>
                <div className="mt-1 flex flex-wrap items-center gap-2 text-[10px] text-slate-400">
                  {job.clientCompany && (
                    <span className="rounded-full border border-slate-700/70 bg-slate-900/70 px-2 py-0.5 text-[9px] uppercase tracking-wide text-slate-300">
                      {job.clientCompany.name}
                    </span>
                  )}
                  {job.location && <span>{job.location}</span>}
                  {job.locationType && (
                    <span className="rounded-full border border-slate-700/70 bg-slate-900/70 px-2 py-0.5 text-[9px] uppercase tracking-wide text-slate-300">
                      {job.locationType}
                    </span>
                  )}
                  {job.employmentType && (
                    <span className="rounded-full border border-slate-700/70 bg-slate-900/70 px-2 py-0.5 text-[9px] uppercase tracking-wide text-slate-300">
                      {job.employmentType}
                    </span>
                  )}
                </div>
              </div>
              <span className="text-[10px] text-slate-500">View job →</span>
            </a>
          );
        })}
      </div>
    </section>
  );
}

export default function CareersPageRenderer({
  displayName,
  settings,
  theme,
  layout,
  jobs,
  primaryColor,
  accentColor,
}: Props) {
  const effectiveLayout = getEffectiveLayout(displayName, layout);
  const rawSections = (effectiveLayout as any)?.sections;
  const sections: any[] = Array.isArray(rawSections) ? rawSections : [];

  return (
    <div className="space-y-4 sm:space-y-5">
      {sections.map((section, index) => {
        if (!section || typeof section !== "object") return null;

        switch (section.type) {
          case "hero":
            return (
              <div key={`hero-${index}`}>
                {renderHeroSection(section, settings, primaryColor, accentColor)}
              </div>
            );
          case "intro":
            return (
              <div key={`intro-${index}`}>
                {renderIntroSection(section, settings)}
              </div>
            );
          case "jobs_list":
            return (
              <div key={`jobs-${index}`}>
                {renderJobsListSection(section, jobs)}
              </div>
            );
          default:
            return null;
        }
      })}
    </div>
  );
}
