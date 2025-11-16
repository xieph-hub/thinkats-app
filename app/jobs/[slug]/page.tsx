// app/jobs/[slug]/page.tsx
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SITE_URL } from "@/lib/site";
import { getJobBySlug, jobs, type Job } from "@/lib/jobs";

// ---------- Metadata ----------
type JobPageProps = {
  params: { slug: string };
};

export async function generateMetadata(
  { params }: JobPageProps
): Promise<Metadata> {
  const job = getJobBySlug(params.slug);
  if (!job) {
    return {
      title: "Role not found | Resourcin",
      description: "This role is no longer active or does not exist.",
    };
  }

  return {
    title: `${job.title} | Jobs | Resourcin`,
    description: job.summary ?? `Learn more about the ${job.title} role.`,
    openGraph: {
      title: `${job.title} | Resourcin`,
      description: job.summary,
      url: `${SITE_URL}/jobs/${job.slug}`,
    },
  };
}

// ---------- Small helpers ----------

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="border-t border-slate-100 pt-6 first:border-t-0 first:pt-0">
      <h2 className="text-sm font-semibold text-slate-900 sm:text-base">
        {title}
      </h2>
      <div className="mt-3 space-y-3 text-sm text-slate-700">{children}</div>
    </section>
  );
}

function BulletList({ items }: { items: string[] }) {
  if (!items?.length) return null;
  return (
    <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-slate-700">
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}

// ---------- Simple badges / pills ----------

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full bg-slate-50 px-2.5 py-1 text-[0.7rem] font-medium text-slate-600 ring-1 ring-slate-200">
      {children}
    </span>
  );
}

// ---------- Page ----------

export default function JobDetailPage({ params }: JobPageProps) {
  const job = getJobBySlug(params.slug);
  if (!job) return notFound();

  const jobSlug = encodeURIComponent(job.slug);
  const utmBase = `utm_source=resourcin_job_board&utm_campaign=job_${jobSlug}`;
  const detailUrl = `${SITE_URL}/jobs/${job.slug}`;

  // Social
  const linkedInLandingUrl = `${detailUrl}?${utmBase}&utm_medium=social&utm_content=linkedin`;
  const xLandingUrl = `${detailUrl}?${utmBase}&utm_medium=social&utm_content=x`;
  const whatsAppLandingUrl = `${detailUrl}?${utmBase}&utm_medium=social&utm_content=whatsapp`;

  const encodedLinkedInLanding = encodeURIComponent(linkedInLandingUrl);
  const encodedXLanding = encodeURIComponent(xLandingUrl);
  const shareText = encodeURIComponent(`${job.title} – via Resourcin`);

  const linkedInShareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodedLinkedInLanding}`;
  const xShareUrl = `https://twitter.com/intent/tweet?url=${encodedXLanding}&text=${shareText}`;
  const whatsAppMessage = encodeURIComponent(
    `${job.title} – via Resourcin\n${whatsAppLandingUrl}`
  );
  const whatsAppShareUrl = `https://wa.me/?text=${whatsAppMessage}`;

  // Apply / I'm interested CTA
  const applyUrl = `/talent-network?job=${jobSlug}&${utmBase}&utm_medium=job_detail&utm_content=primary_cta`;

  // Simple related roles: same department or seniority
  const related = jobs
    .filter((j) => j.slug !== job.slug)
    .filter(
      (j) => j.department === job.department || j.seniority === job.seniority
    )
    .slice(0, 3);

  return (
    <div className="min-h-screen bg-slate-50">
      <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <nav className="mb-4 flex items-center gap-2 text-xs text-slate-500">
          <Link href="/jobs" className="hover:text-slate-800">
            Jobs
          </Link>
          <span>/</span>
          <span className="truncate">{job.title}</span>
        </nav>

        {/* Header card */}
        <header className="mb-6 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#172965] text-sm font-semibold text-white shadow-sm sm:h-12 sm:w-12">
                {job.employerInitials}
              </div>
              <div className="space-y-1.5">
                <h1 className="text-lg font-semibold text-slate-900 sm:text-xl">
                  {job.title}
                </h1>
                <p className="text-sm text-slate-600">
                  {job.employerName}{" "}
                  <span className="text-slate-400">•</span>{" "}
                  {job.location}
                </p>
                <div className="flex flex-wrap gap-2 pt-1">
                  <Pill>
                    {job.workType} • {job.type}
                  </Pill>
                  <Pill>{job.department}</Pill>
                  <Pill>{job.seniority} level</Pill>
                  {job.salaryRange && <Pill>{job.salaryRange}</Pill>}
                </div>
                <p className="pt-1 text-xs text-slate-500">
                  {job.postedAt}
                </p>
              </div>
            </div>

            {/* Apply block */}
            <div className="flex flex-col items-stretch gap-2 sm:items-end">
              <Link
                href={applyUrl}
                className="inline-flex items-center justify-center rounded-lg bg-[#172965] px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-[#111c4c]"
              >
                I&apos;m interested in this role
                <span className="ml-1.5 text-xs" aria-hidden="true">
                  →
                </span>
              </Link>
              <p className="text-[0.7rem] text-slate-500 sm:text-xs text-right">
                One profile, multiple searches. We share full employer details
                at the appropriate stage.
              </p>

              {/* Social share */}
              <div className="mt-1 flex flex-wrap items-center justify-end gap-2 text-[0.7rem] text-slate-500 sm:text-xs">
                <span className="font-medium text-slate-600">Share:</span>
                <a
                  href={linkedInShareUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-full bg-slate-50 px-2.5 py-1 ring-1 ring-slate-200 hover:bg-slate-100"
                >
                  LinkedIn
                </a>
                <a
                  href={xShareUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-full bg-slate-50 px-2.5 py-1 ring-1 ring-slate-200 hover:bg-slate-100"
                >
                  X
                </a>
                <a
                  href={whatsAppShareUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-full bg-slate-50 px-2.5 py-1 ring-1 ring-slate-200 hover:bg-slate-100"
                >
                  WhatsApp
                </a>
              </div>
            </div>
          </div>
        </header>

        {/* Main content layout */}
        <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
          {/* Left: role content */}
          <div className="space-y-6 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:p-6">
            <Section title="Role overview">
              <p>{job.summary}</p>
              {job.highlight && (
                <p className="text-sm text-slate-600">{job.highlight}</p>
              )}
            </Section>

            {job.responsibilities?.length ? (
              <Section title="What you will be doing">
                <BulletList items={job.responsibilities} />
              </Section>
            ) : null}

            {job.requirements?.length ? (
              <Section title="What you should have">
                <BulletList items={job.requirements} />
              </Section>
            ) : null}

            {job.niceToHave?.length ? (
              <Section title="Nice to have">
                <BulletList items={job.niceToHave} />
              </Section>
            ) : null}

            {job.hiringProcess?.length ? (
              <Section title="Hiring process">
                <BulletList items={job.hiringProcess} />
              </Section>
            ) : null}

            {/* CTA again at bottom for mobile scroll behaviour */}
            <div className="pt-4">
              <Link
                href={applyUrl}
                className="inline-flex items-center justify-center rounded-lg bg-[#172965] px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-[#111c4c]"
              >
                I&apos;m interested in this role
                <span className="ml-1.5 text-xs" aria-hidden="true">
                  →
                </span>
              </Link>
            </div>
          </div>

          {/* Right: extras & related */}
          <aside className="space-y-4">
            {/* Employer / anonymised context */}
            <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 sm:p-5">
              <h2 className="text-sm font-semibold text-slate-900">
                About the employer
              </h2>
              <p className="mt-2 text-sm text-slate-700">
                This description is anonymised. Full details are shared once
                we&apos;ve confirmed mutual interest and alignment on basics
                (compensation, location, seniority).
              </p>
              <p className="mt-2 text-sm text-slate-700">
                We prioritise teams with clear missions, reasonable expectations
                and leadership that respect people and process.
              </p>
            </div>

            {/* Related insights CTA (ties back to funnel) */}
            <div className="rounded-2xl bg-slate-900 p-4 text-slate-50 shadow-sm sm:p-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-300">
                Related reading
              </p>
              <p className="mt-1.5 text-sm font-medium">
                Want to think more deeply about your next move?
              </p>
              <p className="mt-1.5 text-xs text-slate-200">
                Explore insights on hiring, leadership and careers in our
                content section. It&apos;s the same quality thinking we use when
                advising clients.
              </p>
              <Link
                href="/insights?utm_source=job_detail&utm_medium=sidebar_cta&utm_campaign=insights"
                className="mt-3 inline-flex items-center justify-center rounded-lg bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-900 hover:bg-white"
              >
                Browse insights
                <span className="ml-1.5 text-[0.65rem]" aria-hidden="true">
                  →
                </span>
              </Link>
            </div>

            {/* Related roles */}
            {related.length > 0 && (
              <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 sm:p-5">
                <h2 className="text-sm font-semibold text-slate-900">
                  Related roles
                </h2>
                <p className="mt-1 text-xs text-slate-500">
                  Similar roles you might also want to explore.
                </p>
                <ul className="mt-3 space-y-2">
                  {related.map((r) => (
                    <li key={r.slug}>
                      <Link
                        href={`/jobs/${r.slug}?utm_source=job_detail&utm_medium=related_jobs&utm_campaign=job_${encodeURIComponent(
                          r.slug
                        )}`}
                        className="group flex flex-col rounded-lg px-2 py-1.5 hover:bg-slate-50"
                      >
                        <span className="text-xs font-medium text-slate-900 group-hover:text-[#172965]">
                          {r.title}
                        </span>
                        <span className="text-[0.7rem] text-slate-500">
                          {r.location} • {r.seniority}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Back link */}
            <div className="text-xs">
              <Link
                href="/jobs"
                className="inline-flex items-center text-slate-600 hover:text-slate-900"
              >
                ← Back to all roles
              </Link>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
