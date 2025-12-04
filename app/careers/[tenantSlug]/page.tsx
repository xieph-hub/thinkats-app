// app/careers/[tenantSlug]/page.tsx
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";

type PageProps = {
  params: { tenantSlug: string };
};

export const dynamic = "force-dynamic";

// Optional: dynamic metadata based on tenant
export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const tenant = await prisma.tenant.findFirst({
    where: { slug: params.tenantSlug },
    select: { name: true, slug: true },
  });

  const label = tenant?.name || tenant?.slug || params.tenantSlug;

  return {
    title: `${label} – Careers | ThinkATS`,
    description: `View open roles at ${label}, powered by ThinkATS.`,
  };
}

export default async function CareersTenantPage({ params }: PageProps) {
  const { tenantSlug } = params;

  // 🔍 Use findFirst (slug is NOT unique in Prisma schema)
  const tenant = await prisma.tenant.findFirst({
    where: { slug: tenantSlug },
    select: { id: true, name: true, slug: true },
  });

  if (!tenant) {
    notFound();
  }

  const [settings, jobs] = await Promise.all([
    prisma.careerSiteSettings.findFirst({
      where: { tenantId: tenant.id },
    }),
    prisma.job.findMany({
      where: {
        tenantId: tenant.id,
        status: "open",
        visibility: "public",
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const label = tenant.name || tenant.slug || tenantSlug;
  const heroTitle = settings?.heroTitle || `Careers at ${label}`;
  const heroSubtitle =
    settings?.heroSubtitle ||
    "Explore open roles and join the team.";

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 lg:px-8">
      {/* Header / hero */}
      <header className="mb-8 space-y-2">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
          Powered by ThinkATS
        </p>
        <h1 className="text-3xl font-semibold text-slate-900">
          {heroTitle}
        </h1>
        <p className="max-w-2xl text-sm text-slate-600">
          {heroSubtitle}
        </p>
      </header>

      {/* About section from CareerSiteSettings */}
      {settings?.aboutHtml && (
        <section className="mb-8 rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-700 shadow-sm">
          <div
            className="prose prose-sm max-w-none text-slate-700"
            dangerouslySetInnerHTML={{ __html: settings.aboutHtml }}
          />
        </section>
      )}

      {/* Jobs list */}
      <section className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-sm font-semibold text-slate-900">
            Open roles
          </h2>
          <p className="text-xs text-slate-500">
            {jobs.length === 0
              ? "No open roles at the moment."
              : `${jobs.length} open role${
                  jobs.length === 1 ? "" : "s"
                }.`}
          </p>
        </div>

        {jobs.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4 text-xs text-slate-600">
            Join the talent network to be notified when new roles go live.
          </div>
        ) : (
          <ul className="space-y-3">
            {jobs.map((job) => (
              <li
                key={job.id}
                className="rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-800 shadow-sm"
              >
                <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900">
                      {job.title}
                    </h3>
                    <p className="text-xs text-slate-500">
                      {job.location || "Location flexible"}
                      {job.employmentType
                        ? ` • ${job.employmentType}`
                        : ""}
                    </p>
                  </div>
                  <Link
                    href={`/jobs/${job.id}`}
                    className="mt-2 inline-flex items-center justify-center rounded-full bg-[#172965] px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-[#0f1c48] sm:mt-0"
                  >
                    View role
                  </Link>
                </div>
                {job.shortDescription && (
                  <p className="mt-2 text-xs text-slate-600">
                    {job.shortDescription}
                  </p>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
