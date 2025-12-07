// app/ats/onboarding/page.tsx
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: {
    tenantId?: string | string[];
  };
};

export const metadata: Metadata = {
  title: "ThinkATS | Workspace onboarding",
  description:
    "Get your ThinkATS workspace ready before inviting your hiring team.",
};

function toSingleParam(value: string | string[] | undefined): string | null {
  if (!value) return null;
  return Array.isArray(value) ? value[0] : value;
}

function getBaseDomainFromEnv(): string {
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://thinkats.com";
  try {
    return new URL(siteUrl).hostname;
  } catch {
    return "thinkats.com";
  }
}

export default async function AtsOnboardingPage({ searchParams }: PageProps) {
  const tenantId = toSingleParam(searchParams.tenantId);

  if (!tenantId) {
    // No tenant specified – send back to tenants list
    redirect("/ats/tenants");
  }

  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    include: {
      careerSiteSettings: true,
    },
  });

  if (!tenant) {
    redirect("/ats/tenants");
  }

  const [jobCount, candidateCount] = await Promise.all([
    prisma.job.count({ where: { tenantId: tenant.id } }),
    prisma.candidate.count({ where: { tenantId: tenant.id } }),
  ]);

  const careerSettings = tenant.careerSiteSettings[0] ?? null;

  const baseDomain = getBaseDomainFromEnv();
  const careersUrl = tenant.slug
    ? `https://${tenant.slug}.${baseDomain}/careers`
    : null;

  const workspaceConfigured =
    Boolean(tenant.slug) &&
    Boolean(tenant.name) &&
    Boolean(tenant.logoUrl);

  const careersConfigured =
    careersUrl &&
    careerSettings &&
    careerSettings.isPublic &&
    careerSettings.includeInMarketplace !== null;

  const hasJobs = jobCount > 0;
  const hasCandidates = candidateCount > 0;

  return (
    <main className="min-h-screen bg-slate-50">
      <section className="mx-auto max-w-5xl px-4 py-8">
        <header className="mb-8">
          <p className="text-xs uppercase tracking-wide text-slate-500 mb-1">
            Workspace onboarding
          </p>
          <h1 className="text-2xl font-semibold text-slate-900">
            {tenant.name || "Unnamed workspace"}
          </h1>
          <p className="mt-2 text-sm text-slate-600 max-w-2xl">
            A quick checklist to make sure your ThinkATS workspace is ready
            before you share your careers site or invite hiring managers.
          </p>
        </header>

        <div className="grid gap-4 md:grid-cols-2 mb-8">
          <div className="rounded-xl border bg-white p-4">
            <p className="text-xs font-medium text-slate-500 mb-1">
              Workspace
            </p>
            <p className="text-lg font-semibold text-slate-900">
              {tenant.slug ? tenant.slug : "No slug set"}
            </p>
            {careersUrl && (
              <p className="mt-1 text-xs text-slate-500 break-all">
                Careers URL:{" "}
                <a
                  href={careersUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="underline"
                >
                  {careersUrl}
                </a>
              </p>
            )}
          </div>

          <div className="rounded-xl border bg-white p-4">
            <p className="text-xs font-medium text-slate-500 mb-1">
              Current activity
            </p>
            <p className="text-sm text-slate-700">
              <span className="font-semibold">{jobCount}</span> job
              {jobCount === 1 ? "" : "s"} ·{" "}
              <span className="font-semibold">{candidateCount}</span>{" "}
              candidate{candidateCount === 1 ? "" : "s"} in pipeline
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {/* Step 1: Workspace basics */}
          <div className="rounded-xl border bg-white p-4 flex gap-3">
            <div
              className={`mt-1 h-4 w-4 flex-shrink-0 rounded-full border ${
                workspaceConfigured
                  ? "bg-emerald-500 border-emerald-500"
                  : "bg-white border-slate-300"
              }`}
            />
            <div className="flex-1">
              <h2 className="text-sm font-semibold text-slate-900">
                1. Confirm workspace basics
              </h2>
              <p className="mt-1 text-xs text-slate-600">
                Make sure your workspace name, slug, logo and contact
                emails are set correctly. This powers both your ATS and
                hosted careers site.
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                <Link
                  href="/ats/tenants"
                  className="inline-flex items-center rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-800 hover:bg-slate-50"
                >
                  Go to workspace settings
                </Link>
              </div>
            </div>
          </div>

          {/* Step 2: Careers site branding */}
          <div className="rounded-xl border bg-white p-4 flex gap-3">
            <div
              className={`mt-1 h-4 w-4 flex-shrink-0 rounded-full border ${
                careersConfigured
                  ? "bg-emerald-500 border-emerald-500"
                  : "bg-white border-slate-300"
              }`}
            />
            <div className="flex-1">
              <h2 className="text-sm font-semibold text-slate-900">
                2. Configure careers site branding
              </h2>
              <p className="mt-1 text-xs text-slate-600">
                Set logo, brand colours and hero copy for your hosted
                careers site. You can also decide whether to include this
                workspace in the public marketplace.
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {/* Adjust this link to your actual career-site settings route if different */}
                <Link
                  href="/ats/tenants"
                  className="inline-flex items-center rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-800 hover:bg-slate-50"
                >
                  Edit careers branding
                </Link>
                {careersUrl && (
                  <a
                    href={careersUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-800 hover:bg-slate-50"
                  >
                    Preview careers site
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Step 3: Create your first job */}
          <div className="rounded-xl border bg-white p-4 flex gap-3">
            <div
              className={`mt-1 h-4 w-4 flex-shrink-0 rounded-full border ${
                hasJobs
                  ? "bg-emerald-500 border-emerald-500"
                  : "bg-white border-slate-300"
              }`}
            />
            <div className="flex-1">
              <h2 className="text-sm font-semibold text-slate-900">
                3. Create your first job
              </h2>
              <p className="mt-1 text-xs text-slate-600">
                Publish at least one live role so your careers site isn’t
                empty. Drafts stay inside the ATS until you&apos;re ready
                to go public.
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                <Link
                  href="/ats/jobs/new"
                  className="inline-flex items-center rounded-md bg-slate-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-800"
                >
                  Create job
                </Link>
                <Link
                  href="/ats/jobs"
                  className="inline-flex items-center rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-800 hover:bg-slate-50"
                >
                  View all jobs
                </Link>
              </div>
            </div>
          </div>

          {/* Step 4: Share careers link */}
          <div className="rounded-xl border bg-white p-4 flex gap-3">
            <div
              className={`mt-1 h-4 w-4 flex-shrink-0 rounded-full border ${
                careersUrl && hasJobs
                  ? "bg-emerald-500 border-emerald-500"
                  : "bg-white border-slate-300"
              }`}
            />
            <div className="flex-1">
              <h2 className="text-sm font-semibold text-slate-900">
                4. Share your careers site
              </h2>
              <p className="mt-1 text-xs text-slate-600">
                Once you&apos;re happy with branding and you have at least
                one open role, share your careers link with candidates and
                clients.
              </p>
              {careersUrl ? (
                <div className="mt-2 flex flex-col gap-1">
                  <p className="text-xs font-mono text-slate-800 break-all">
                    {careersUrl}
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Add this link to your website, LinkedIn page and
                    outgoing job campaigns.
                  </p>
                </div>
              ) : (
                <p className="mt-2 text-xs text-slate-500">
                  Set a workspace slug first to generate a careers URL.
                </p>
              )}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
