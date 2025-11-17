import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getDefaultTenant } from "@/lib/tenant";
import { SITE_URL } from "@/lib/site";
import JobApplyForm from "@/components/JobApplyForm";

type JobPageProps = {
  params: { slug: string };
};

// ---------- Metadata (dynamic) ----------
export async function generateMetadata(
  { params }: JobPageProps
): Promise<Metadata> {
  const tenant = await getDefaultTenant();

  const job = await prisma.job.findFirst({
    where: {
      tenantId: tenant.id,
      isPublished: true,
      slug: params.slug,
    },
    select: {
      title: true,
      summary: true,
      slug: true,
    },
  });

  if (!job) {
    return {
      title: "Role not found | Resourcin",
      description: "This role is no longer active or does not exist.",
    };
  }

  const url = `${SITE_URL}/jobs/${job.slug}`;

  return {
    title: `${job.title} | Jobs | Resourcin`,
    description: job.summary ?? `Learn more about the ${job.title} role.`,
    openGraph: {
      title: `${job.title} | Resourcin`,
      description: job.summary ?? "",
      url,
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

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full bg-slate-50 px-2.5 py-1 text-[0.7rem] font-medium text-slate-600 ring-1 ring-slate-200">
      {children}
    </span>
  );
}

// ---------- Page ----------
export default async function JobDetailPage({ params }: JobPageProps) {
  const tenant = await getDefaultTenant();

  const job = await prisma.job.findFirst({
    where: {
      tenantId: tenant.id,
      isPublished: true,
      slug: params.slug,
    },
    include: {
      clientCompany: true,
    },
  });

  if (!job) {
    notFound();
  }

  const companyName = job.clientCompany?.name ?? "Confidential client";
  const employerInitials = companyName
    .split(" ")
    .filter(Boolean)
    .map((word) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const postedAt = job.createdAt.toLocaleDateString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  const jobSlug = encodeURIComponent(job.slug);
  const detailUrl = `${SITE_URL}/jobs/${job.slug}`;
  const utmBase = `utm_source=resourcin_job_board&utm_campaign=job_${jobSlug}`;

  // Social share landing URLs
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

  // Simple "related roles" – same function or seniority
  const related = await prisma.job.findMany({
    where: {
      tenantId: tenant.id,
      isPublished: true,
      NOT: { id: job.id },
      OR: [
        { function: job.function },
        { seniority: job.seniority },
      ],
    },
    take: 3,
  });

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
                {employerInitials}
              </div>
              <div className="space-y-1.5">
                <h1 className="text-lg font-semibold text-slate-900 sm:text-xl">
                  {job.title}
                </h1>
                <p className="text-sm text-slate-600">
                  {companyName} <span className="text-slate-400">•</span>{" "}
                  {job.location}
                </p>
                <div className="flex flex-wrap gap-2 pt-1">
                  {job.location && <Pill>{job.location}</Pill>}
                  {job.employmentType && <Pill>{job.employmentType}</Pill>}
                  {job.function && <Pill>{job.function}</Pill>}
                  {job.seniority && <Pill>{job.seniority} level</Pill>}
                </div>
                <p className="pt-1 text-xs text-slate-500">
                  Posted on {postedAt}
                </p>
              </div>
            </div>

            {/* Apply block */}
            <div className="flex flex-col items-stretch gap-2 sm:items-end">
              {/* Scroll to apply form on same page */}
              <a
                href="#apply"
                className="inline-flex items-center justify-center rounded-lg bg-[#172965] px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-[#111c4c]"
              >
                I&apos;m interested in this role
                <span className="ml-1.5 text-xs" aria-hidden="true">
                  →
                </span>
              </a>
              <p className="text-right text-[0.7rem] text-slate-500 sm:text-xs">
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
            </Section>

            <Section title="Full description">
              <div className="whitespace-pre-line text-sm leading-relaxed text-slate-700">
                {job.description}
              </div>
            </Section>

            {/* CTA again at bottom for mobile scroll behaviour */}
            <div className="pt-4">
              <a
                href="#apply"
                className="inline-flex items-center justify-center rounded-lg bg-[#172965] px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-[#111c4c]"
              >
                I&apos;m interested in this role
                <span className="ml-1.5 text-xs" aria-hidden="true">
                  →
                </span>
              </a>
            </div>
          </div>

          {/* Right: apply form & extras */}
         <aside className="space-y-4" id="apply">
  {/* Apply form wired to this specific job */}
  <JobApplyForm jobId={job.id} />

  {/* Employer / anonymised context */}
  <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 sm:p-5">
    ...
  </div>
  ...
</aside>       
            {/* Related insights CTA */}
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
                    <li key={r.id}>
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
