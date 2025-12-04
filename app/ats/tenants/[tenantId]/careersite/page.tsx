import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "ThinkATS | Career site settings",
  description:
    "Configure the public careers page and marketplace visibility for this tenant.",
};

type PageProps = {
  params: { tenantId: string };
  searchParams?: { updated?: string };
};

export default async function TenantCareersitePage({
  params,
  searchParams,
}: PageProps) {
  const { tenantId } = params;
  const updated = searchParams?.updated === "1";

  // 1) Load tenant
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

  // 2) Load most recent career-site settings (if any)
  const settings = await prisma.careerSiteSettings.findFirst({
    where: { tenantId: tenant.id },
    orderBy: { createdAt: "desc" },
  });

  const heroTitle = settings?.heroTitle ?? "";
  const heroSubtitle = settings?.heroSubtitle ?? "";
  const aboutHtml = settings?.aboutHtml ?? "";
  const primaryColor = settings?.primaryColor ?? "";
  const accentColor = settings?.accentColor ?? "";
  const isPublic = settings?.isPublic ?? true;
  const includeInMarketplace = settings?.includeInMarketplace ?? false;

  const tenantSlug = tenant.slug ?? undefined;
  const careersUrl = tenantSlug
    ? `/careers/${encodeURIComponent(tenantSlug)}`
    : `/careers?tenant=${encodeURIComponent(tenant.id)}`;

  const publicJobsUrl = tenantSlug
    ? `/jobs?tenant=${encodeURIComponent(tenantSlug)}`
    : `/jobs?tenantId=${encodeURIComponent(tenant.id)}`;

  const formAction = `/api/ats/tenants/${encodeURIComponent(
    tenant.id,
  )}/careersite`;

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-6 lg:px-8">
      {/* Page header */}
      <div className="space-y-2">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
          ATS · Tenant settings
        </p>
        <h1 className="text-2xl font-semibold text-slate-900">
          Career site for {tenant.name ?? tenantSlug ?? "this tenant"}
        </h1>
        <p className="text-xs text-slate-600">
          Control how your public careers page looks and whether this tenant
          appears in the global marketplace.
        </p>
      </div>

      {/* Saved banner */}
      {updated && (
        <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-800">
          Career site settings saved.
        </div>
      )}

      {/* Public URLs + status */}
      <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="text-xs font-semibold text-slate-900">
          Public URLs & visibility
        </h2>
        <dl className="space-y-2 text-[11px] text-slate-600">
          <div className="flex flex-wrap gap-2">
            <dt className="w-32 font-medium text-slate-700">Careers page</dt>
            <dd>
              <Link
                href={careersUrl}
                target="_blank"
                className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1 font-medium text-slate-700 hover:bg-slate-100"
              >
                {careersUrl}
                <span className="ml-1 text-[10px]">↗</span>
              </Link>
            </dd>
          </div>

          <div className="flex flex-wrap gap-2">
            <dt className="w-32 font-medium text-slate-700">Jobs listing</dt>
            <dd>
              <Link
                href={publicJobsUrl}
                target="_blank"
                className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1 font-medium text-slate-700 hover:bg-slate-100"
              >
                {publicJobsUrl}
                <span className="ml-1 text-[10px]">↗</span>
              </Link>
            </dd>
          </div>

          <div className="flex flex-wrap gap-2">
            <dt className="w-32 font-medium text-slate-700">Tenant status</dt>
            <dd>
              <span
                className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ring-1 ${
                  tenant.status === "active"
                    ? "bg-emerald-50 text-emerald-700 ring-emerald-100"
                    : "bg-slate-50 text-slate-600 ring-slate-200"
                }`}
              >
                <span className="h-1.5 w-1.5 rounded-full bg-current" />
                {tenant.status === "active" ? "Active" : tenant.status}
              </span>
            </dd>
          </div>
        </dl>
      </div>

      {/* Settings form */}
      <form
        action={formAction}
        method="POST"
        className="space-y-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
      >
        <h2 className="text-xs font-semibold text-slate-900">
          Branding & content
        </h2>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-1">
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
              defaultValue={heroTitle}
              placeholder="e.g. Join our team"
              className="block w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 outline-none ring-0 placeholder:text-slate-400 focus:border-[#172965] focus:bg-white focus:ring-1 focus:ring-[#172965]"
            />
            <p className="text-[10px] text-slate-500">
              Main heading at the top of the careers page.
            </p>
          </div>

          <div className="space-y-1">
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
              defaultValue={heroSubtitle}
              placeholder="e.g. We hire people who care about shipping great work."
              className="block w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 outline-none ring-0 placeholder:text-slate-400 focus:border-[#172965] focus:bg-white focus:ring-1 focus:ring-[#172965]"
            />
            <p className="text-[10px] text-slate-500">
              Short supporting line under the title.
            </p>
          </div>
        </div>

        <div className="space-y-1">
          <label
            htmlFor="aboutHtml"
            className="block text-[11px] font-medium text-slate-700"
          >
            About section
          </label>
          <textarea
            id="aboutHtml"
            name="aboutHtml"
            defaultValue={aboutHtml}
            rows={5}
            placeholder="Describe your company, culture and what candidates can expect."
            className="block w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 outline-none ring-0 placeholder:text-slate-400 focus:border-[#172965] focus:bg-white focus:ring-1 focus:ring-[#172965]"
          />
          <p className="text-[10px] text-slate-500">
            Basic HTML is supported (paragraphs, links, lists).
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-1">
            <label
              htmlFor="primaryColor"
              className="block text-[11px] font-medium text-slate-700"
            >
              Primary color (optional)
            </label>
            <input
              id="primaryColor"
              name="primaryColor"
              type="text"
              defaultValue={primaryColor}
              placeholder="#172965"
              className="block w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 outline-none ring-0 placeholder:text-slate-400 focus:border-[#172965] focus:bg-white focus:ring-1 focus:ring-[#172965]"
            />
            <p className="text-[10px] text-slate-500">
              Hex code used for buttons and highlights.
            </p>
          </div>

          <div className="space-y-1">
            <label
              htmlFor="accentColor"
              className="block text-[11px] font-medium text-slate-700"
            >
              Accent color (optional)
            </label>
            <input
              id="accentColor"
              name="accentColor"
              type="text"
              defaultValue={accentColor}
              placeholder="#64C247"
              className="block w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 outline-none ring-0 placeholder:text-slate-400 focus:border-[#172965] focus:bg-white focus:ring-1 focus:ring-[#172965]"
            />
            <p className="text-[10px] text-slate-500">
              Used for tags, badges and subtle highlights.
            </p>
          </div>
        </div>

        <div className="h-px w-full bg-slate-100" />

        <h2 className="text-xs font-semibold text-slate-900">
          Visibility & marketplace
        </h2>

        <div className="space-y-3 rounded-xl border border-slate-100 bg-slate-50 px-3 py-3">
          <label className="flex items-start gap-2 text-[11px] text-slate-700">
            <input
              type="checkbox"
              name="isPublic"
              defaultChecked={isPublic}
              className="mt-[2px] h-3 w-3 rounded border-slate-300 text-[#172965] focus:ring-[#172965]"
            />
            <span>
              <span className="font-medium">Make this career site public</span>
              <br />
              <span className="text-[10px] text-slate-500">
                When enabled, anyone with the URL can view the careers page and
                listed roles.
              </span>
            </span>
          </label>

          <label className="flex items-start gap-2 text-[11px] text-slate-700">
            <input
              type="checkbox"
              name="includeInMarketplace"
              defaultChecked={includeInMarketplace}
              className="mt-[2px] h-3 w-3 rounded border-slate-300 text-[#172965] focus:ring-[#172965]"
            />
            <span>
              <span className="font-medium">
                Include this tenant in the global marketplace
              </span>
              <br />
              <span className="text-[10px] text-slate-500">
                When enabled, open public roles from this tenant can appear on{" "}
                <code className="rounded bg-slate-100 px-1 py-[1px]">
                  /careers
                </code>{" "}
                alongside other tenants. Turn this off if this workspace should
                only use its own careers URL.
              </span>
            </span>
          </label>
        </div>

        <div className="flex items-center justify-between pt-2">
          <p className="text-[10px] text-slate-500">
            Changes apply immediately after you save. You can revisit this page
            anytime from the tenant settings.
          </p>

          <button
            type="submit"
            className="inline-flex items-center rounded-full bg-[#172965] px-5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-[#12204d]"
          >
            Save settings
          </button>
        </div>
      </form>
    </div>
  );
}
