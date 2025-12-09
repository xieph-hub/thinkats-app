// components/careers/CareersPageRenderer.tsx
import type { CareerSiteSettings, Job } from "@prisma/client";

interface CareersPageRendererProps {
  displayName: string;
  settings?: CareerSiteSettings | null;
  jobs: Job[];

  primaryColor: string;
  accentColor: string;
}

function formatDate(date: Date | string): string {
  try {
    return new Date(date).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return "";
  }
}

export default function CareersPageRenderer(props: CareersPageRendererProps) {
  const { displayName, settings, jobs, primaryColor, accentColor } = props;

  const heroTitle =
    settings?.heroTitle ||
    `At ${displayName}, we believe in the power of people.`;
  const heroSubtitle =
    settings?.heroSubtitle ||
    "Explore how you can grow your career and make meaningful impact with us.";

  const aboutHtml =
    settings?.aboutHtml ||
    `<p>${displayName} is building a team of curious, ambitious people who care deeply about their work and the people they work with.</p>`;

  const bannerImageUrl = settings?.bannerImageUrl || null;

  const linkedinUrl = settings?.linkedinUrl || null;
  const twitterUrl = settings?.twitterUrl || null;
  const instagramUrl = settings?.instagramUrl || null;

  const hasSocial =
    Boolean(linkedinUrl) || Boolean(twitterUrl) || Boolean(instagramUrl);

  const hasJobs = jobs.length > 0;
  const featuredJobs = jobs.slice(0, 8); // first version – up to 8 roles

  return (
    <div className="space-y-10">
      {/* Hero + banner / culture card */}
      <section className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1.4fr)] lg:items-start">
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
            Careers at {displayName}
          </p>
          <h1 className="text-2xl font-semibold leading-snug text-slate-950 lg:text-3xl">
            {heroTitle}
          </h1>
          <p className="text-sm text-slate-600">{heroSubtitle}</p>

          {hasSocial && (
            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-500">
              <span className="text-[11px] uppercase tracking-[0.18em] text-slate-400">
                Connect with us
              </span>
              {linkedinUrl && (
                <a
                  href={linkedinUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-full border border-slate-200 px-2.5 py-1 text-[11px] font-medium hover:border-slate-300 hover:text-slate-900"
                >
                  LinkedIn
                </a>
              )}
              {twitterUrl && (
                <a
                  href={twitterUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-full border border-slate-200 px-2.5 py-1 text-[11px] font-medium hover:border-slate-300 hover:text-slate-900"
                >
                  X / Twitter
                </a>
              )}
              {instagramUrl && (
                <a
                  href={instagramUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-full border border-slate-200 px-2.5 py-1 text-[11px] font-medium hover:border-slate-300 hover:text-slate-900"
                >
                  Instagram
                </a>
              )}
            </div>
          )}
        </div>

        <div className="space-y-3">
          {bannerImageUrl ? (
            <div className="overflow-hidden rounded-2xl border border-slate-100 bg-slate-50">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={bannerImageUrl}
                alt={`${displayName} careers banner`}
                className="h-40 w-full object-cover"
              />
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-5 text-xs text-slate-500">
              Use your careers site settings to upload a banner image that
              reflects your culture and workspace.
            </div>
          )}

          <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-4 text-xs text-slate-600">
            <p className="font-semibold text-slate-900">Why join us</p>
            <p className="mt-1 text-slate-600">
              We&apos;re looking for people who are excited to solve meaningful
              problems, collaborate with kind teammates, and grow their careers
              over the long term.
            </p>
          </div>
        </div>
      </section>

      {/* About / story block */}
      <section className="grid gap-6 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1.2fr)]">
        <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-4 text-sm text-slate-700">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
            About {displayName}
          </p>
          <div
            className="prose prose-sm max-w-none prose-headings:text-slate-900 prose-p:mb-2 prose-p:text-slate-700 prose-a:text-sky-600"
            dangerouslySetInnerHTML={{ __html: aboutHtml }}
          />
        </div>

        <div className="space-y-3">
          <div
            className="rounded-2xl border px-4 py-4 text-xs text-slate-700"
            style={{ borderColor: primaryColor }}
          >
            <p className="mb-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
              Don&apos;t see your role yet?
            </p>
            <p>
              We&apos;re always interested in exceptional people. If you don&apos;t
              see a perfect match today, you can still apply to a general
              talent pool or check back again soon.
            </p>
          </div>

          {hasJobs && (
            <div
              className="rounded-2xl border px-4 py-4 text-xs text-slate-700"
              style={{ borderColor: accentColor }}
            >
              <p className="mb-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                How our hiring works
              </p>
              <p>
                Our process typically includes an intro conversation, role-fit
                interview, and a practical case or portfolio review. We aim to
                give you clear timelines and feedback along the way.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Featured roles */}
      <section className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold text-slate-900">
            {hasJobs ? "Open roles" : "No open roles right now"}
          </h2>
          {hasJobs && (
            <p className="text-[11px] text-slate-500">
              Showing {featuredJobs.length} role
              {featuredJobs.length > 1 ? "s" : ""}. See more under{" "}
              <span className="font-medium">Open roles</span>.
            </p>
          )}
        </div>

        {!hasJobs ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center text-xs text-slate-500">
            There are no live openings at the moment. Please check back soon or
            follow {displayName} on social channels for updates.
          </div>
        ) : (
          <div className="space-y-3">
            {featuredJobs.map((job) => {
              const slugOrId = job.slug || job.id;

              return (
                <article
                  key={job.id}
                  className="group flex gap-4 rounded-2xl border border-slate-100 bg-slate-50/80 px-4 py-4 transition hover:border-slate-200 hover:bg-white"
                >
                  <div className="flex-1 space-y-1.5">
                    <h3 className="text-sm font-semibold text-slate-900 group-hover:underline">
                      {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
                      <a href={`/jobs/${slugOrId}`}>{job.title}</a>
                    </h3>
                    <div className="flex flex-wrap gap-2 text-[11px] text-slate-500">
                      {job.location && (
                        <span className="rounded-full bg-slate-100 px-2 py-0.5">
                          {job.location}
                        </span>
                      )}
                      {job.department && (
                        <span className="rounded-full bg-slate-100 px-2 py-0.5">
                          {job.department}
                        </span>
                      )}
                      {job.employmentType && (
                        <span className="rounded-full bg-slate-100 px-2 py-0.5">
                          {job.employmentType}
                        </span>
                      )}
                      {job.experienceLevel && (
                        <span className="rounded-full bg-slate-100 px-2 py-0.5">
                          {job.experienceLevel}
                        </span>
                      )}
                    </div>
                    {job.shortDescription && (
                      <p className="mt-1 line-clamp-2 text-xs text-slate-600">
                        {job.shortDescription}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-col items-end justify-between gap-2 text-right">
                    <p className="text-[11px] text-slate-400">
                      Posted {formatDate(job.createdAt)}
                    </p>
                    <a
                      href={`/jobs/${slugOrId}`}
                      className="inline-flex items-center justify-center rounded-full px-3 py-1 text-[11px] font-semibold shadow-sm"
                      style={{ backgroundColor: accentColor, color: "#0f172a" }}
                    >
                      View role
                    </a>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
