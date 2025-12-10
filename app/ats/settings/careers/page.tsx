// app/ats/settings/careers/page.tsx
import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import CareersLayoutEditor from "@/components/careers/CareersLayoutEditor";
import type { CareerLayout } from "@/lib/careersLayout";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Careers site settings | ThinkATS",
  description:
    "Configure careers site branding, copy, layout and marketplace visibility for this tenant.",
};

type SearchParams = {
  tenantId?: string | string[];
};

function asStringParam(
  value: string | string[] | undefined,
  fallback = "",
): string {
  if (!value) return fallback;
  if (Array.isArray(value)) return value[0] ?? fallback;
  return value;
}

export default async function CareersSettingsPage({
  searchParams,
}: {
  searchParams?: SearchParams;
}) {
  // -----------------------------
  // Load tenants + resolve current tenant
  // -----------------------------
  const tenants = await prisma.tenant.findMany({
    orderBy: { name: "asc" },
  });

  if (tenants.length === 0) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8 lg:px-8">
        <h1 className="text-2xl font-semibold text-slate-900">
          Careers site settings
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          No tenants exist yet. Create a tenant before configuring careers site
          settings.
        </p>
      </div>
    );
  }

  const tenantParam = asStringParam(searchParams?.tenantId);
  const selectedTenant =
    (tenantParam &&
      tenants.find(
        (t) => t.id === tenantParam || (t as any).slug === tenantParam,
      )) ||
    tenants[0];

  const selectedTenantId = selectedTenant.id;

  // -----------------------------
  // Load careers site settings for this tenant
  // -----------------------------
  const settings = await prisma.careerSiteSettings.findFirst({
    where: { tenantId: selectedTenantId },
  });

  const heroTitle =
    settings?.heroTitle ||
    `Careers at ${
      selectedTenant.name || (selectedTenant as any).slug || "our company"
    }`;
  const heroSubtitle =
    settings?.heroSubtitle ||
    "Explore open roles and opportunities to join the team.";
  const aboutHtml =
    settings?.aboutHtml ||
    "<p>Use this section to explain what it feels like to work here, how you make decisions and what you value.</p>";

  const isPublic = settings?.isPublic ?? true;
  const includeInMarketplace = (settings as any)?.includeInMarketplace ?? false;

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "";
  const tenantSlug = (selectedTenant as any).slug || selectedTenantId;
  const careersPath = `/careers/${encodeURIComponent(tenantSlug)}`;
  const marketplacePath = `/jobs`;

  const careersUrl = baseUrl ? `${baseUrl}${careersPath}` : careersPath;
  const marketplaceUrl = baseUrl
    ? `${baseUrl}${marketplacePath}`
    : marketplacePath;

  // -----------------------------
  // Load layout JSON for this tenant
  // -----------------------------
  const careerPage = await prisma.careerPage.findFirst({
    where: { tenantId: selectedTenantId, slug: "careers-home" },
  });

  const initialLayout = (careerPage?.layout ?? null) as CareerLayout | null;

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-8 lg:px-8">
      {/* Header */}
      <header className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
            Settings · Careers
          </p>
          <h1 className="mt-1 text-2xl font-semibold text-slate-900">
            Careers site settings
          </h1>
          <p className="mt-1 text-xs text-slate-600">
            Configure branding, copy, layout and where this tenant&apos;s jobs
            appear across ThinkATS.
          </p>
        </div>

        {/* Tenant selector */}
        <form method="GET" className="flex items-center gap-2">
          <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5">
            <span className="text-[10px] uppercase tracking-[0.18em] text-slate-500">
              Tenant
            </span>
            <select
              name="tenantId"
              defaultValue={selectedTenantId}
              className="border-none bg-transparent text-[11px] text-slate-900 outline-none focus:ring-0"
            >
              {tenants.map((tenant) => (
                <option key={tenant.id} value={tenant.id}>
                  {tenant.name ?? (tenant as any).slug ?? tenant.id}
                </option>
              ))}
            </select>
            <button
              type="submit"
              className="text-[11px] font-medium text-[#172965] hover:underline"
            >
              Switch
            </button>
          </div>
        </form>
      </header>

      {/* Where jobs appear summary */}
      <section className="rounded-2xl border border-slate-200 bg-white p-4 text-[11px] text-slate-600 shadow-sm">
        <h2 className="mb-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
          Where this tenant&apos;s jobs appear
        </h2>
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-slate-100 text-[11px] text-slate-700">
              1
            </span>
            <p>
              <span className="font-medium text-slate-800">
                Tenant careers site:
              </span>{" "}
              <Link
                href={careersPath}
                target="_blank"
                className="font-medium text-[#172965] hover:underline"
              >
                {careersUrl}
              </Link>
              <span className="ml-1 text-slate-500">
                (controlled by{" "}
                <span className="font-medium">
                  “Make this careers site public”
                </span>{" "}
                below)
              </span>
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-slate-100 text-[11px] text-slate-700">
              2
            </span>
            <p>
              <span className="font-medium text-slate-800">
                ThinkATS jobs marketplace:
              </span>{" "}
              <Link
                href={marketplacePath}
                target="_blank"
                className="font-medium text-[#172965] hover:underline"
              >
                {marketplaceUrl}
              </Link>
              <span className="ml-1 text-slate-500">
                (only if{" "}
                <span className="font-medium">
                  “Include this tenant in the global marketplace”
                </span>{" "}
                is turned on)
              </span>
            </p>
          </div>
        </div>

        <div className="mt-3 inline-flex rounded-full bg-slate-50 px-3 py-1 text-[10px] text-slate-500">
          <span className="mr-1 text-[9px]">●</span>
          Public, open jobs from this tenant always appear on their own careers
          site, and optionally on the global marketplace.
        </div>
      </section>

      {/* Careers branding + copy form */}
      <form
        method="POST"
        action="/api/ats/settings/careers-site"
        className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 text-[11px] text-slate-700 shadow-sm"
      >
        <input type="hidden" name="tenantId" value={selectedTenantId} />

        <div className="grid gap-4 md:grid-cols-2">
          {/* Branding */}
          <div className="space-y-3">
            <h3 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
              Branding
            </h3>

            <div className="space-y-1.5">
              <label
                htmlFor="logoUrl"
                className="block text-[11px] font-medium text-slate-700"
              >
                Logo URL
              </label>
              <input
                id="logoUrl"
                name="logoUrl"
                type="url"
                defaultValue={settings?.logoUrl ?? ""}
                placeholder="https://…"
                className="block w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-[11px] text-slate-900 outline-none focus:border-[#172965] focus:bg-white focus:ring-1 focus:ring-[#172965]"
              />
              <p className="text-[10px] text-slate-500">
                Optional. Shown on the tenant careers site header.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label
                  htmlFor="primaryColor"
                  className="block text-[11px] font-medium text-slate-700"
                >
                  Primary color
                </label>
                <input
                  id="primaryColor"
                  name="primaryColor"
                  type="text"
                  defaultValue={settings?.primaryColor ?? ""}
                  placeholder="#172965"
                  className="block w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-[11px] text-slate-900 outline-none focus:border-[#172965] focus:bg-white focus:ring-1 focus:ring-[#172965]"
                />
              </div>
              <div className="space-y-1.5">
                <label
                  htmlFor="accentColor"
                  className="block text-[11px] font-medium text-slate-700"
                >
                  Accent color
                </label>
                <input
                  id="accentColor"
                  name="accentColor"
                  type="text"
                  defaultValue={settings?.accentColor ?? ""}
                  placeholder="#FFC000"
                  className="block w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-[11px] text-slate-900 outline-none focus:border-[#172965] focus:bg-white focus:ring-1 focus:ring-[#172965]"
                />
              </div>
            </div>
          </div>

          {/* Hero copy */}
          <div className="space-y-3">
            <h3 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
              Hero copy
            </h3>

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
                defaultValue={heroTitle}
                className="block w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-[11px] text-slate-900 outline-none focus:border-[#172965] focus:bg-white focus:ring-1 focus:ring-[#172965]"
              />
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="heroSubtitle"
                className="block text-[11px] font-medium text-slate-700"
              >
                Hero subtitle
              </label>
              <textarea
                id="heroSubtitle"
                name="heroSubtitle"
                defaultValue={heroSubtitle}
                rows={3}
                className="block w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-[11px] text-slate-900 outline-none focus:border-[#172965] focus:bg-white focus:ring-1 focus:ring-[#172965]"
              />
            </div>
          </div>
        </div>

        {/* About / working here */}
        <div className="space-y-1.5">
          <label
            htmlFor="aboutHtml"
            className="block text-[11px] font-medium text-slate-700"
          >
            About / working here (HTML)
          </label>
          <textarea
            id="aboutHtml"
            name="aboutHtml"
            defaultValue={aboutHtml}
            rows={6}
            className="block w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-[11px] text-slate-900 outline-none focus:border-[#172965] focus:bg-white focus:ring-1 focus:ring-[#172965]"
          />
          <p className="text-[10px] text-slate-500">
            Supports basic HTML (p, strong, em, ul, ol, li). Rendered on the
            tenant&apos;s public careers site.
          </p>
        </div>

        {/* Toggles */}
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-3">
            <label className="flex items-start gap-2">
              <input
                type="checkbox"
                name="isPublic"
                defaultChecked={isPublic}
                className="mt-0.5 h-3.5 w-3.5 rounded border-slate-300 text-[#172965] focus:ring-[#172965]"
              />
              <span className="text-[11px] text-slate-700">
                <span className="font-medium">
                  Make this careers site public
                </span>
                <br />
                <span className="text-[10px] text-slate-500">
                  When enabled, the tenant&apos;s careers site is reachable at{" "}
                  <code className="rounded bg-white px-1 py-0.5 text-[10px]">
                    {careersPath}
                  </code>{" "}
                  and indexed in your own channels (but not automatically in
                  the global jobs marketplace).
                </span>
              </span>
            </label>
          </div>

          <div className="space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-3">
            <label className="flex items-start gap-2">
              <input
                type="checkbox"
                name="includeInMarketplace"
                defaultChecked={includeInMarketplace}
                className="mt-0.5 h-3.5 w-3.5 rounded border-slate-300 text-[#172965] focus:ring-[#172965]"
              />
              <span className="text-[11px] text-slate-700">
                <span className="font-medium">
                  Include this tenant in the global marketplace
                </span>
                <br />
                <span className="text-[10px] text-slate-500">
                  When turned on,{" "}
                  <span className="font-medium">public, open jobs</span> from
                  this tenant also appear on the ThinkATS marketplace at{" "}
                  <code className="rounded bg-white px-1 py-0.5 text-[10px]">
                    {marketplacePath}
                  </code>
                  . Candidates can still discover roles via the tenant&apos;s
                  own careers site.
                </span>
              </span>
            </label>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-2">
          <div className="flex flex-wrap items-center gap-3 text-[10px] text-slate-500">
            <span>
              This affects only the selected tenant:{" "}
              <span className="font-medium text-slate-700">
                {selectedTenant.name ??
                  (selectedTenant as any).slug ??
                  selectedTenant.id}
              </span>
              .
            </span>
          </div>
          <button
            type="submit"
            className="inline-flex items-center rounded-full bg-[#172965] px-4 py-2 text-[11px] font-semibold text-white shadow-sm hover:bg-[#12204d]"
          >
            Save careers settings
          </button>
        </div>
      </form>

      {/* Layout editor card (JSON layout for careers-home) */}
      <CareersLayoutEditor
        tenantId={selectedTenantId}
        initialLayout={initialLayout}
      />
    </div>
  );
}
