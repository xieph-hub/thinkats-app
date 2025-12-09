// app/careers/page.tsx
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { getHostContext } from "@/lib/host";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Careers | ThinkATS",
  description: "Explore roles at companies hiring on ThinkATS.",
};

function formatWorkMode(value?: string | null) {
  if (!value) return "";
  const map: Record<string, string> = {
    onsite: "Onsite",
    hybrid: "Hybrid",
    remote: "Remote",
    field_based: "Field-based",
  };
  const key = value.toLowerCase();
  return map[key] || value;
}

function formatEmploymentType(value?: string | null) {
  if (!value) return "";
  const map: Record<string, string> = {
    full_time: "Full Time",
    part_time: "Part Time",
    contract: "Contract",
    temporary: "Temporary",
    internship: "Internship",
    consulting: "Consulting / Advisory",
  };
  const key = value.toLowerCase();
  return map[key] || value;
}

function formatDate(value: string | Date | null | undefined) {
  if (!value) return "";
  const d = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default async function HostAwareCareersPage() {
  const { isPrimaryHost, tenantSlugFromHost } = getHostContext();

  // Primary host (thinkats.com): /careers behaves like /jobs
  if (isPrimaryHost || !tenantSlugFromHost) {
    redirect("/jobs");
  }

  const slug = decodeURIComponent(tenantSlugFromHost);

  // 1) Resolve tenant by slug
  const tenant = await prisma.tenant.findFirst({
    where: { slug },
  });

  // If the tenant doesn't exist at all, soft message – no 404.
  if (!tenant) {
    return (
      <main className="min-h-screen bg-[#F5F6FA]">
        <div className="mx-auto max-w-xl px-4 pb-12 pt-16 sm:px-6 lg:px-0">
          <section className="rounded-3xl border border-slate-200 bg-white p-6 text-sm text-slate-700 shadow-sm">
            <h1 className="text-lg font-semibold text-slate-900">
              Careers site not available
            </h1>
            <p className="mt-2 text-sm text-slate-600">
              We couldn&apos;t find an active hiring workspace for this
              subdomain.
            </p>
            <p className="mt-2 text-xs text-slate-500">
              If you&apos;re expecting a careers site here, please contact{" "}
              <a
                href="mailto:support@thinkats.com"
                className="font-medium text-[#172965] hover:underline"
              >
                support@thinkats.com
              </a>{" "}
              so we can help you get set up.
            </p>
          </section>
        </div>
      </main>
    );
  }

  // 2) Load careersite settings (branding, copy, flags)
  const settings = await prisma.careerSiteSettings.findFirst({
    where: { tenantId: tenant.id },
  });

  // If tenant explicitly turned off their careers page
  if (settings && settings.isPublic === false) {
    return (
      <main className="min-h-screen bg-[#F5F6FA]">
        <div className="mx-auto max-w-xl px-4 pb-12 pt-16 sm:px-6 lg:px-0">
          <section className="rounded-3xl border border-slate-200 bg-white p-6 text-sm text-slate-700 shadow-sm">
            <h1 className="text-lg font-semibold text-slate-900">
              Careers page currently unavailable
            </h1>
            <p className="mt-2 text-sm text-slate-600">
              {tenant.name || slug} is not displaying a public careers page at
              the moment.
            </p>
            <p className="mt-2 text-xs text-slate-500">
              If you&apos;re an admin for this workspace, you can turn the
              careers page back on from your ATS settings. Otherwise, please
              contact{" "}
              <a
                href="mailto:support@thinkats.com"
                className="font-medium text-[#172965] hover:underline"
              >
                support@thinkats.com
              </a>{" "}
              for assistance.
            </p>
          </section>
        </div>
      </main>
    );
  }

  // 3) Load this tenant's public, open jobs
  const jobs = await prisma.job.findMany({
    where: {
      tenantId: tenant.id,
      status: "open",
      visibility: "public",
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  const totalJobs = jobs.length;

  const heroTitle =
    settings?.heroTitle ||
    `Careers at ${tenant.name || tenant.slug || "our company"}`;
  const heroSubtitle =
    settings?.heroSubtitle ||
    "Explore open roles and opportunities to join the team.";

  const aboutHtml =
    settings?.aboutHtml ||
    `<p>We use a structured, candidate-friendly hiring process. Every application is reviewed by a real hiring team member and you can expect clear communication throughout.</p>`;

  const logoUrl = (settings && settings.logoUrl) || (tenant as any).logoUrl || null;

  const primaryColor = settings?.primaryColorHex || "#172965";
  const accentColor = settings?.accentColorHex || "#FFC000";
  const heroBackground = settings?.heroBackgroundHex || "#F5F6FA";

  const trackingSource = `CAREERS_${(tenant.slug || tenant.id).toUpperCase()}`;

  function jobPublicUrl(job: any) {
    const basePath = job.slug
      ? `/jobs/${encodeURIComponent(job.slug)}`
      : `/jobs/${job.id}`;

    const connector = basePath.includes("?") ? "&" : "?";
    return `${basePath}${connector}src=${encodeURIComponent(trackingSource)}`;
  }

  return (
    <div className="min-h-screen bg-[#F5F6FA]">
      <div className="mx-auto max-w-5xl px-4 pb-12 pt-10 sm:px-6 lg:px-0">
        {/* HERO */}
        <section
          className="mb-8 rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-sm backdrop-blur sm:p-8"
          style={{ backgroundColor: heroBackground }}
        >
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            {/* Brand side */}
            <div className="flex items-start gap-4">
              <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
                {logoUrl ? (
                  <Image
                    src={logoUrl}
                    alt={tenant.name || "Company logo"}
                    width={56}
                    height={56}
                    className="h-full w-full object-contain p-1"
                  />
                ) : (
                  <span
                    className="text-xl font-semibold"
                    style={{ color: primaryColor }}
                  >
                    {(tenant.name || tenant.slug || "T")
                      .charAt(0)
                      .toUpperCase()}
                  </span>
                )}
              </div>

              <div className="max-w-xl">
                <p
                  className="text-[11px] font-semibold uppercase tracking-[0.18em]"
                  style={{ color: accentColor }}
                >
                  Careers
                </p>
                <h1
                  className="mt-1 text-2xl font-semibold sm:text-3xl"
                  style={{ color: primaryColor }}
                >
                  {heroTitle}
                </h1>
                {tenant.name && (
                  <p className="mt-1 text-xs font-medium uppercase tracking-[0.16em] text-slate-500">
                    {tenant.name}
                  </p>
                )}
                <p className="mt-3 text-sm text-slate-600">
                  {heroSubtitle}
                </p>
                <p className="mt-2 text-xs text-slate-500">
                  {totalJobs === 0
                    ? "No open roles at the moment."
                    : `${totalJobs} open ${
                        totalJobs === 1 ? "role" : "roles"
                      } currently accepting applications.`}
                </p>
              </div>
            </div>

            {/* Meta card / ThinkATS badge */}
            <div
              className="space-y-3 rounded-2xl px-4 py-3 text-xs text-slate-100 sm:w-64"
              style={{ backgroundColor: primaryColor }}
            >
              <p
                className="text-[11px] font-semibold uppercase tracking-[0.16em]"
                style={{ color: accentColor }}
              >
                Powered by ThinkATS
              </p>
              <p className="text-xs text-slate-100">
                This careers site is fully branded for{" "}
                <span className="font-semibold">
                  {tenant.name || tenant.slug || "this company"}
                </span>
                . Applications flow into a structured ATS workspace with clear
                stages and decision history.
              </p>
              <p className="text-[11px] text-slate-200">
                Your profile can be reused for other roles with your consent,
                keeping the candidate experience fast but respectful.
              </p>
              <Link
                href="/jobs"
                className="inline-flex items-center text-[11px] font-medium hover:text-white"
                style={{ color: accentColor }}
              >
                Discover more roles on ThinkATS
                <span className="ml-1 text-[10px]">↗</span>
              </Link>
            </div>
          </div>
        </section>

        {/* ABOUT + PROCESS */}
        <section className="mb-8 grid gap-6 md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-700 shadow-sm">
            <h2 className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
              Life at {tenant.name || "the company"}
            </h2>
            <div
              className="prose prose-sm max-w-none text-slate-700 prose-p:mb-2 prose-ul:mt-1 prose-ul:list-disc prose-ul:pl-4"
              dangerouslySetInnerHTML={{ __html: aboutHtml }}
            />
          </div>

          <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5 text-xs text-slate-600 shadow-sm">
            <h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
              Hiring process at a glance
            </h3>
            <ol className="mt-2 space-y-1.5 list-decimal pl-4">
              <li>Submit your application for a relevant role.</li>
              <li>Screening by the hiring team using structured pipelines.</li>
              <li>Interviews and any assessments, communicated in advance.</li>
              <li>Decision and feedback as soon as reasonably possible.</li>
            </ol>
            <p className="mt-2 text-[11px] text-slate-500">
              Exact steps can vary per role, but you can expect clarity on what
              happens next at each stage.
            </p>
          </div>
        </section>

        {/* JOBS LIST */}
        {totalJobs === 0 ? (
          <section className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
            <p>No open roles are currently listed on this careers site.</p>
            <p className="mt-1 text-[11px]">
              You can still{" "}
              <Link
                href="/jobs"
                className="font-medium text-[#172965] hover:underline"
              >
                explore other roles on ThinkATS
              </Link>{" "}
              or check back soon.
            </p>
          </section>
        ) : (
          <section className="space-y-3">
            {jobs.map((job: any) => {
              const location = job.location || "Location flexible";
              const workModeValue =
                (job.workMode as string | null) ||
                (job.locationType as string | null) ||
                null;
              const workModeLabel = formatWorkMode(workModeValue) || undefined;
              const employmentLabel =
                formatEmploymentType(job.employmentType) || undefined;
              const posted = formatDate(job.createdAt);
              const snippet =
                job.shortDescription ||
                job.overview ||
                job.description ||
                "This is a live role with a detailed specification available on the next page.";

              return (
                <article
                  key={job.id}
                  className="group flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-4 text-xs text-slate-700 shadow-sm transition hover:border-slate-300 hover:shadow-md sm:flex-row sm:items-stretch"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="truncate text-sm font-semibold text-slate-900 group-hover:text-[#172965]">
                        {job.title}
                      </h2>
                      <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700">
                        <span className="mr-1 h-1.5 w-1.5 rounded-full bg-emerald-500" />
                        Actively hiring
                      </span>
                    </div>

                    <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-slate-600">
                      <span>{location}</span>
                      {workModeLabel && (
                        <>
                          <span className="text-slate-300">•</span>
                          <span>{workModeLabel}</span>
                        </>
                      )}
                      {employmentLabel && (
                        <>
                          <span className="text-slate-300">•</span>
                          <span>{employmentLabel}</span>
                        </>
                      )}
                      {job.department && (
                        <>
                          <span className="text-slate-300">•</span>
                          <span>{job.department}</span>
                        </>
                      )}
                    </div>

                    <p className="mt-3 line-clamp-2 text-xs text-slate-700">
                      {snippet}
                    </p>

                    <p className="mt-2 text-[11px] text-slate-400">
                      Posted {posted}
                    </p>
                  </div>

                  <div className="flex w-full flex-col items-stretch justify-between gap-2 sm:w-52 sm:items-end">
                    <div className="flex flex-wrap justify-start gap-1 text-[10px] sm:justify-end">
                      <span className="inline-flex items-center rounded-full bg-slate-50 px-2 py-0.5 font-medium text-slate-600">
                        Careers site
                      </span>
                    </div>

                    <div className="flex flex-wrap justify-start gap-2 sm:justify-end">
                      <Link
                        href={jobPublicUrl(job)}
                        className="inline-flex items-center rounded-full px-4 py-1.5 text-[11px] font-semibold text-white shadow-sm"
                        style={{ backgroundColor: primaryColor }}
                      >
                        View &amp; apply
                        <span className="ml-1.5 text-[10px] opacity-80">
                          ↗
                        </span>
                      </Link>
                    </div>
                  </div>
                </article>
              );
            })}
          </section>
        )}

        {/* Small footer badge – easy to hide later for full white-label */}
        <footer className="mt-8 flex justify-end">
          <div className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[10px] text-slate-500 shadow-sm">
            <span className="mr-1 h-1.5 w-1.5 rounded-full bg-emerald-500" />
            Hiring workflows powered by{" "}
            <span className="ml-1 font-semibold text-slate-700">
              ThinkATS
            </span>
          </div>
        </footer>
      </div>
    </div>
  );
}
