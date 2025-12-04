// app/careers/[tenantSlug]/page.tsx
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { prisma } from "@/lib/prisma";

type PageProps = {
  params: { tenantSlug: string };
};

export const dynamic = "force-dynamic";

/**
 * Per-tenant SEO
 */
export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const slug = params.tenantSlug;

  const tenant = await prisma.tenant.findUnique({
    where: { slug },
    select: { name: true },
  });

  const name = tenant?.name || "Careers";

  return {
    title: `${name} – Careers | ThinkATS`,
    description: `Explore open roles at ${name}, powered by ThinkATS.`,
  };
}

export default async function TenantCareersPage({ params }: PageProps) {
  const slug = params.tenantSlug;

  // 1) Load tenant + latest career site settings
  const tenant = await prisma.tenant.findUnique({
    where: { slug },
    select: {
      id: true,
      name: true,
      slug: true,
      logoUrl: true,
      careerSiteSettings: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: {
          logoUrl: true,
          heroTitle: true,
          heroSubtitle: true,
          aboutHtml: true,
          primaryColor: true,
          accentColor: true,
        },
      },
    },
  });

  if (!tenant) {
    notFound();
  }

  const site = tenant.careerSiteSettings[0] ?? null;

  // Simple color fallbacks
  const primaryColor = site?.primaryColor || "#172965";
  const accentColor = site?.accentColor || "#64C247";

  // 2) Load public jobs for this tenant
  const jobs = await prisma.job.findMany({
    where: {
      tenantId: tenant.id,
      status: "open",
      visibility: "public",
      OR: [
        { internalOnly: false },
        { internalOnly: null }, // treat null as public
      ],
    },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      location: true,
      locationType: true,
      experienceLevel: true,
      shortDescription: true,
      createdAt: true,
      clientCompany: {
        select: { name: true },
      },
    },
  });

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top bar / hero */}
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-6 sm:px-6 lg:px-8">
          {(site?.logoUrl || tenant.logoUrl) && (
            <div className="relative h-10 w-10 overflow-hidden rounded-md border border-slate-200 bg-white">
              <Image
                src={site?.logoUrl || tenant.logoUrl || ""}
                alt={`${tenant.name} logo`}
                width={40}
                height={40}
                className="h-full w-full object-contain"
              />
            </div>
          )}
          <div>
            <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
              Careers at
            </p>
            <h1 className="text-2xl font-semibold text-slate-900">
              {tenant.name}
            </h1>
            {site?.heroSubtitle && (
              <p className="mt-1 text-sm text-slate-600">
                {site.heroSubtitle}
              </p>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto flex max-w-5xl flex-col gap-8 px-4 py-8 sm:px-6 lg:px-8">
        {/* Open roles */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-sm font-semibold text-slate-900">
              {site?.heroTitle || "Open roles"}
            </h2>
            <span
              className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium text-slate-600"
              style={{ backgroundColor: `${accentColor}22` }}
            >
              {jobs.length} role{jobs.length === 1 ? "" : "s"} open
            </span>
          </div>

          {jobs.length === 0 ? (
            <p className="mt-4 text-[13px] text-slate-600">
              There are currently no open roles. Please check back soon, or
              connect with the team to be notified about future opportunities.
            </p>
          ) : (
            <ul className="mt-4 space-y-3">
              {jobs.map((job) => {
                const companyName = job.clientCompany?.name ?? tenant.name;
                const created = new Date(job.createdAt);
                const createdLabel = created.toLocaleDateString("en-GB", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                });

                return (
                  <li
                    key={job.id}
                    className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-slate-300 hover:shadow-md"
                  >
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
                          {companyName}
                        </p>
                        <h3 className="mt-0.5 text-sm font-semibold text-slate-900">
                          {job.title}
                        </h3>
                        <div className="mt-1 flex flex-wrap gap-1.5 text-[11px] text-slate-600">
                          {job.location && (
                            <span className="inline-flex items-center rounded-full bg-slate-50 px-2 py-0.5">
                              {job.location}
                            </span>
                          )}
                          {job.locationType && (
                            <span className="inline-flex items-center rounded-full bg-slate-50 px-2 py-0.5">
                              {job.locationType}
                            </span>
                          )}
                          {job.experienceLevel && (
                            <span className="inline-flex items-center rounded-full bg-slate-50 px-2 py-0.5">
                              {job.experienceLevel}
                            </span>
                          )}
                          <span className="inline-flex items-center rounded-full bg-slate-50 px-2 py-0.5">
                            Posted {createdLabel}
                          </span>
                        </div>
                        {job.shortDescription && (
                          <p className="mt-2 line-clamp-3 text-[13px] text-slate-600">
                            {job.shortDescription}
                          </p>
                        )}
                      </div>

                      <div className="flex flex-col items-end gap-2">
                        <Link
                          href={`/jobs/${job.id}`}
                          className="inline-flex items-center rounded-full px-3 py-1.5 text-xs font-semibold text-white shadow-sm"
                          style={{ backgroundColor: primaryColor }}
                        >
                          View role
                        </Link>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {/* About section */}
        {site?.aboutHtml && (
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-sm font-semibold text-slate-900">
              About {tenant.name}
            </h2>
            <div
              className="prose prose-sm mt-3 max-w-none text-slate-700 prose-p:mb-3 prose-p:mt-0"
              dangerouslySetInnerHTML={{ __html: site.aboutHtml }}
            />
          </section>
        )}
      </main>

      {/* Small footer hint */}
      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4 text-[11px] text-slate-500 sm:px-6 lg:px-8">
          <span>Powered by ThinkATS</span>
          <Link
            href="https://www.thinkats.com"
            className="underline-offset-2 hover:underline"
          >
            Learn more
          </Link>
        </div>
      </footer>
    </div>
  );
}
