// app/careers/[tenantSlug]/page.tsx
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";

type CareersPageProps = {
  params: { tenantSlug: string };
};

export async function generateMetadata(
  { params }: CareersPageProps,
): Promise<Metadata> {
  const slug = decodeURIComponent(params.tenantSlug);

  const tenant = await prisma.tenant.findUnique({
    where: { slug },
    select: { name: true },
  });

  if (!tenant) {
    return {
      title: "Careers | ThinkATS",
      description: "Jobs listed on ThinkATS.",
    };
  }

  return {
    title: `Careers at ${tenant.name} | ThinkATS`,
    description: `Open roles at ${tenant.name}, powered by ThinkATS.`,
  };
}

export default async function TenantCareersPage({
  params,
}: CareersPageProps) {
  const slug = decodeURIComponent(params.tenantSlug);

  const tenant = await prisma.tenant.findUnique({
    where: { slug },
    include: {
      careerSiteSettings: true,
    },
  });

  if (!tenant) {
    notFound();
  }

  const settings = tenant.careerSiteSettings[0] ?? null;

  // If you want the ability to "turn off" a tenant's public careers page:
  if (settings && settings.isPublic === false) {
    notFound();
  }

  const jobs = await prisma.job.findMany({
    where: {
      tenantId: tenant.id,
      status: "open",
      visibility: "public",
    },
    orderBy: { createdAt: "desc" },
  });

  const hasJobs = jobs.length > 0;

  const heroTitle =
    settings?.heroTitle || `Join ${tenant.name}`;
  const heroSubtitle =
    settings?.heroSubtitle ||
    "These roles are managed through ThinkATS. Apply once and we’ll keep you updated through each stage.";
  const aboutHtml = settings?.aboutHtml;

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 lg:px-8">
      {/* HERO */}
      <header className="mb-8 space-y-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Careers
        </p>
        <h1 className="text-3xl font-semibold text-slate-900">
          {heroTitle}
        </h1>
        <p className="max-w-2xl text-sm text-slate-600">
          {heroSubtitle}
        </p>

        {aboutHtml && (
          <div
            className="prose prose-sm mt-4 max-w-none text-slate-700"
            dangerouslySetInnerHTML={{ __html: aboutHtml }}
          />
        )}
      </header>

      {/* JOBS LIST */}
      {!hasJobs ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-600">
          There are no open roles right now. Check back soon or follow our
          updates on social media.
        </div>
      ) : (
        <div className="space-y-3">
          {jobs.map((job) => {
            const href = `/jobs/${encodeURIComponent(job.slug || job.id)}`;

            return (
              <Link
                key={job.id}
                href={href}
                className="block rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-[#172965]/50 hover:shadow-md"
              >
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="text-base font-semibold text-slate-900">
                      {job.title}
                    </h2>
                    {job.shortDescription && (
                      <p className="mt-1 line-clamp-2 text-sm text-slate-600">
                        {job.shortDescription}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2 text-xs text-slate-600">
                    {job.location && (
                      <span className="inline-flex items-center rounded-full bg-slate-50 px-3 py-1">
                        {job.location}
                      </span>
                    )}
                    {job.employmentType && (
                      <span className="inline-flex items-center rounded-full bg-slate-50 px-3 py-1">
                        {job.employmentType}
                      </span>
                    )}
                    {job.seniority && (
                      <span className="inline-flex items-center rounded-full bg-slate-50 px-3 py-1">
                        {job.seniority}
                      </span>
                    )}
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
                  <span>
                    Posted {job.createdAt.toLocaleDateString("en-GB")}
                  </span>
                  <span className="font-semibold text-[#172965]">
                    View role →
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
