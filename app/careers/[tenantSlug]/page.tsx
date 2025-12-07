// app/careers/[tenantSlug]/page.tsx
import type { Metadata } from "next";
import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getHostContext } from "@/lib/host";

export const dynamic = "force-dynamic";

type PageProps = {
  params: { tenantSlug: string };
};

export const metadata: Metadata = {
  title: "Careers | ThinkATS",
  description: "Explore roles powered by ThinkATS.",
};

export default async function TenantCareersPage({ params }: PageProps) {
  const slug = params.tenantSlug;

  if (!slug) {
    notFound();
  }

  const { isPrimaryHost } = getHostContext();

  // Edge case: if someone hits thinkats.com/careers/[slug],
  // send them to the proper tenant subdomain.
  if (isPrimaryHost) {
    const siteUrl =
      process.env.NEXT_PUBLIC_SITE_URL ?? "https://thinkats.com";
    const baseDomain = new URL(siteUrl).hostname; // e.g. "thinkats.com"
    const targetUrl = `https://${slug}.${baseDomain}/careers`;
    redirect(targetUrl);
  }

  // Normal path: we are on a tenant host (e.g. resourcin.thinkats.com)
  // and middleware has rewritten /careers → /careers/[slug].
  const tenant = await prisma.tenant.findUnique({
    where: { slug },
  });

  if (!tenant) {
    // Lightweight “please contact ThinkATS” message when tenant is missing
    return (
      <main className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
        <div className="max-w-md rounded-xl border bg-white p-6 shadow-sm">
          <h1 className="text-xl font-semibold mb-2">
            Workspace not available
          </h1>
          <p className="text-sm text-slate-600 mb-4">
            This careers site is not correctly configured. Please contact{" "}
            <a
              href="mailto:support@thinkats.com"
              className="font-medium underline"
            >
              ThinkATS support
            </a>{" "}
            for assistance.
          </p>
          <p className="text-xs text-slate-500">
            Tenant slug: <span className="font-mono">{slug}</span>
          </p>
        </div>
      </main>
    );
  }

  // Pull tenant-specific careers configuration
  const settings = await prisma.careerSiteSettings.findFirst({
    where: { tenantId: tenant.id },
    orderBy: { createdAt: "asc" },
  });

  const isPublic = settings?.isPublic ?? true;
  const heroTitle =
    settings?.heroTitle || (tenant.name ? `Careers at ${tenant.name}` : "Careers");
  const heroSubtitle =
    settings?.heroSubtitle ||
    "Browse open roles and apply in a few clicks.";

  const primaryColor = settings?.primaryColorHex || "#172965"; // deep blue
  const heroBackground = settings?.heroBackgroundHex || "#F5F6FA"; // soft neutral
  const aboutHtml = settings?.aboutHtml || "";

  // If page is marked private, don't show jobs – just a simple notice
  if (!isPublic) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
        <div className="max-w-md rounded-xl border bg-white p-6 shadow-sm">
          <h1 className="text-xl font-semibold mb-2">
            Careers page not public
          </h1>
          <p className="text-sm text-slate-600">
            This careers site is currently not visible to candidates.
            Please check back later or contact the hiring team.
          </p>
        </div>
      </main>
    );
  }

  const jobs = await prisma.job.findMany({
    where: {
      tenantId: tenant.id,
      status: "open",
      visibility: "public",
      NOT: {
        internalOnly: true,
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <main className="min-h-screen bg-slate-50">
      <section className="mx-auto max-w-5xl px-4 py-10">
        {/* Hero / brand panel */}
        <header
          className="mb-8 rounded-2xl border border-slate-200 px-5 py-6"
          style={{ backgroundColor: heroBackground }}
        >
          <p className="text-xs uppercase tracking-wide text-slate-500 mb-1">
            Careers at
          </p>
          <h1
            className="text-2xl font-semibold"
            style={{ color: primaryColor }}
          >
            {heroTitle}
          </h1>
          {heroSubtitle && (
            <p className="mt-2 text-sm text-slate-600">
              {heroSubtitle}
            </p>
          )}
        </header>

        {/* About section (optional) */}
        {aboutHtml && (
          <section className="mb-8 rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-700 leading-relaxed space-y-2">
            <div
              // You already control this from the ATS; keep it simple and safe.
              dangerouslySetInnerHTML={{ __html: aboutHtml }}
            />
          </section>
        )}

        {/* Jobs list */}
        {jobs.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-6 text-sm text-slate-600">
            No open roles are currently published for this workspace.
          </div>
        ) : (
          <div className="space-y-3">
            {jobs.map((job) => {
              const jobSlugOrId = job.slug || job.id;
              return (
                <Link
                  key={job.id}
                  href={`/jobs/${encodeURIComponent(jobSlugOrId)}`}
                  className="block rounded-2xl border border-slate-200 bg-white p-4 hover:border-slate-400 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h2 className="text-base font-semibold text-slate-900">
                        {job.title}
                      </h2>
                      <p className="mt-1 text-xs text-slate-600">
                        {job.location || "Location flexible"}
                        {job.locationType
                          ? ` • ${job.locationType.toUpperCase()}`
                          : null}
                        {job.employmentType
                          ? ` • ${job.employmentType}`
                          : null}
                      </p>
                      {job.shortDescription && (
                        <p className="mt-2 text-sm text-slate-700 line-clamp-2">
                          {job.shortDescription}
                        </p>
                      )}
                    </div>
                    <span
                      className="text-xs font-medium"
                      style={{ color: primaryColor }}
                    >
                      View role →
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}
