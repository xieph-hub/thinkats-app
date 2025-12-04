// app/ats/tenants/[tenantId]/careersite/page.tsx
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Tenant career site | ThinkATS",
  description:
    "Configure how this tenant's public careers page looks and whether its jobs appear in the ThinkATS marketplace.",
};

type PageProps = {
  params: { tenantId: string };
};

function normaliseStatus(status: string | null | undefined): string {
  return (status || "").toLowerCase();
}

export default async function TenantCareerSitePage({ params }: PageProps) {
  const tenantId = params.tenantId;

  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: {
      id: true,
      name: true,
      slug: true,
      status: true,
    },
  });

  if (!tenant) {
    notFound();
  }

  const settings = await prisma.careerSiteSettings.findFirst({
    where: { tenantId },
    orderBy: { createdAt: "asc" },
  });

  const careersPath = tenant.slug ? `/careers/${tenant.slug}` : null;
  const tenantStatus = normaliseStatus(tenant.status);
  const isActive = tenantStatus === "active";
  const isPublic = settings?.isPublic ?? true;
  const includeInMarketplace = settings?.includeInMarketplace ?? false;

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-8 lg:px-0">
      {/* Page header */}
      <header className="space-y-1">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
          ATS · Tenant settings
        </p>
        <h1 className="text-2xl font-semibold text-slate-900">
          Career site for {tenant.name || "Tenant"}
        </h1>
        <p className="text-xs text-slate-600">
          Control how this tenant&apos;s public careers page looks and whether
          its jobs appear in the global marketplace.
        </p>
      </header>

      {/* Public URLs & visibility */}
      <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
              Public URLs & visibility
            </p>
            <p className="mt-1 text-xs text-slate-600">
              This tenant&apos;s jobs appear on:
            </p>
          </div>
        </div>

        <div className="space-y-3 text-xs text-slate-600">
          {/* Careers site row */}
          <div className="flex flex-col items-start justify-between gap-2 sm:flex-row sm:items-center">
            <div className="space-y-0.5">
              <p className="text-[11px] font-medium text-slate-700">
                Branded careers site
              </p>
              <p className="text-[11px] text-slate-500">
                Public page with this tenant&apos;s logo, copy and job listing.
              </p>
            </div>
            <div className="flex items-center gap-2">
              {careersPath ? (
                <Link
                  href={careersPath}
                  target="_blank"
                  className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-[11px] font-medium text-[#172965] hover:bg-slate-100"
                >
                  {careersPath}
                  <span className="ml-1 text-[10px] opacity-70">↗</span>
                </Link>
              ) : (
                <span className="rounded-full bg-slate-50 px-3 py-1.5 text-[11px] text-slate-500">
                  No slug configured yet
                </span>
              )}
            </div>
          </div>

          {/* Marketplace explanation (no /jobs?tenant=… link) */}
          <div className="flex flex-col items-start justify-between gap-2 border-t border-slate-100 pt-3 text-[11px] sm:flex-row sm:items-center">
            <div className="space-y-0.5">
              <p className="text-[11px] font-medium text-slate-700">
                ThinkATS marketplace
              </p>
              <p className="text-[11px] text-slate-500">
                When{" "}
                <span className="font-medium">
                  &quot;Show this tenant&apos;s jobs in the marketplace&quot;
                </span>{" "}
                is on, eligible roles are surfaced in the global listing at{" "}
                <code className="rounded bg-slate-50 px-1.5 py-0.5">
                  /jobs
                </code>
                .
              </p>
            </div>
            <span
              className={`inline-flex items-center rounded-full px-3 py-1.5 text-[11px] font-medium ${
                includeInMarketplace
                  ? "bg-[#E9F7EE] text-[#306B34] border border-[#C5E7CF]"
                  : "bg-slate-50 text-slate-500 border border-slate-200"
              }`}
            >
              Marketplace status:{" "}
              <span className="ml-1 font-semibold">
                {includeInMarketplace ? "Included" : "Hidden"}
              </span>
            </span>
          </div>

          {/* Tenant status chip */}
          <div className="flex items-center gap-2 border-t border-slate-100 pt-3">
            <span className="text-[11px] text-slate-500">Tenant status:</span>
            <span
              className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-medium ${
                isActive
                  ? "bg-[#E9F7EE] text-[#306B34] border border-[#C5E7CF]"
                  : "bg-slate-50 text-slate-500 border border-slate-200"
              }`}
            >
              {isActive ? "Active" : "Inactive"}
            </span>
          </div>
        </div>
      </section>

      {/* Branding & content form */}
      <form
        method="POST"
        action={`/ats/tenants/${tenantId}/careersite`}
        className="space-y-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
      >
        <div className="space-y-1">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
            Branding & content
          </p>
          <p className="text-xs text-slate-600">
            Update the headline and about section that candidates see on the
            public careers page.
          </p>
        </div>

        {/* Hero title + subtitle */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label
              htmlFor="heroTitle"
              className="block text-[11px] font-medium text-slate-700"
            >
              Hero title
            </label>
            <input
              id="heroTitle"
              name="heroTitle"
              type="text"
              defaultValue={settings?.heroTitle ?? ""}
              placeholder="e.g. Join our team"
              className="block w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 outline-none ring-0 placeholder:text-slate-400 focus:border-[#172965] focus:bg-white focus:ring-1 focus:ring-[#172965]"
            />
            <p className="text-[11px] text-slate-500">
              Main heading at the top of the careers page.
            </p>
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="heroSubtitle"
              className="block text-[11px] font-medium text-slate-700"
            >
              Hero subtitle
            </label>
            <input
              id="heroSubtitle"
              name="heroSubtitle"
              type="text"
              defaultValue={settings?.heroSubtitle ?? ""}
              placeholder="e.g. We hire people who care about shipping great work."
              className="block w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 outline-none ring-0 placeholder:text-slate-400 focus:border-[#172965] focus:bg-white focus:ring-1 focus:ring-[#172965]"
            />
            <p className="text-[11px] text-slate-500">
              Short supporting line under the title.
            </p>
          </div>
        </div>

        {/* About section */}
        <div className="space-y-1.5">
          <label
            htmlFor="aboutHtml"
            className="block text-[11px] font-medium text-slate-700"
          >
            About section
          </label>
          <textarea
            id="aboutHtml"
            name="aboutHtml"
            rows={6}
            defaultValue={settings?.aboutHtml ?? ""}
            placeholder="Describe your company, culture and what candidates can expect."
            className="block w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 outline-none ring-0 placeholder:text-slate-400 focus:border-[#172965] focus:bg-white focus:ring-1 focus:ring-[#172965]"
          />
          <p className="text-[11px] text-slate-500">
            Basic HTML (paragraphs, links, lists) is supported.
          </p>
        </div>

        {/* Toggles */}
        <div className="grid gap-4 border-t border-slate-100 pt-4 sm:grid-cols-2">
          <label className="flex items-start gap-3">
            <input
              type="checkbox"
              name="isPublic"
              defaultChecked={isPublic}
              className="mt-1 h-4 w-4 rounded border-slate-300 text-[#172965] focus:ring-[#172965]"
            />
            <div className="space-y-0.5">
              <span className="block text-[11px] font-medium text-slate-800">
                Careers page is public
              </span>
              <span className="block text-[11px] text-slate-500">
                When off, the /careers/[slug] page will not be visible to
                candidates.
              </span>
            </div>
          </label>

          <label className="flex items-start gap-3">
            <input
              type="checkbox"
              name="includeInMarketplace"
              defaultChecked={includeInMarketplace}
              className="mt-1 h-4 w-4 rounded border-slate-300 text-[#172965] focus:ring-[#172965]"
            />
            <div className="space-y-0.5">
              <span className="block text-[11px] font-medium text-slate-800">
                Show this tenant&apos;s jobs in the marketplace
              </span>
              <span className="block text-[11px] text-slate-500">
                When on, open public roles for this tenant are eligible to show
                on the global jobs page at{" "}
                <code className="rounded bg-slate-50 px-1.5 py-0.5">
                  /jobs
                </code>
                .
              </span>
            </div>
          </label>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-4">
          <button
            type="submit"
            className="inline-flex items-center rounded-full bg-[#172965] px-4 py-1.5 text-[11px] font-semibold text-white hover:bg-[#12204d]"
          >
            Save changes
          </button>
        </div>
      </form>
    </div>
  );
}
