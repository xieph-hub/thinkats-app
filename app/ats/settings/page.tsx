// app/ats/settings/page.tsx
import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getResourcinTenant } from "@/lib/tenant";
import { getServerUser } from "@/lib/auth/getServerUser";
import ScoringSettingsCard from "@/components/ats/settings/ScoringSettingsCard";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "ThinkATS | Settings",
  description: "Configure your ATS workspace, notifications, security and data.",
};

const PLAN_LABELS: Record<string, string> = {
  STARTER: "Starter",
  GROWTH: "Growth",
  AGENCY: "Agency (multi-tenant)",
  ENTERPRISE: "Enterprise",
};

const PLAN_FEATURE_BLURB: Record<string, string> = {
  STARTER:
    "Core ATS: jobs, candidates, applications and basic pipelines for a single workspace.",
  GROWTH:
    "Adds multi-tenant readiness, richer careers sites and scoring controls for growing teams.",
  AGENCY:
    "Designed for agencies: multiple client workspaces, shared pipelines and marketplace-ready jobs.",
  ENTERPRISE:
    "Everything in Agency, plus SSO, higher seat limits and custom controls for larger organisations.",
};

type SettingsSearchParams = {
  updated?: string;
  error?: string;
};

export default async function AtsSettingsPage({
  searchParams,
}: {
  searchParams?: SettingsSearchParams;
}) {
  const updatedSection = searchParams?.updated;
  const errorMessage = searchParams?.error;

  const { isSuperAdmin } = await getServerUser();
  const tenant = await getResourcinTenant();

  if (!tenant) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8">
        <h1 className="text-xl font-semibold text-slate-900">
          Settings unavailable
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          No default workspace tenant is configured. Check{" "}
          <code className="rounded bg-slate-100 px-1 py-0.5 text-[11px]">
            RESOURCIN_TENANT_ID
          </code>{" "}
          or{" "}
          <code className="rounded bg-slate-100 px-1 py-0.5 text-[11px]">
            RESOURCIN_TENANT_SLUG
          </code>{" "}
          in your environment before using ATS settings.
        </p>
      </div>
    );
  }

  // 🔓 Membership check removed – any logged-in user that can hit this page
  // will be able to see settings (with super-admin specific controls gated
  // by `isSuperAdmin` only).

  const anyTenant = tenant as any;

  const [careerSettings, totalWorkspaces, allTenantsForBilling] =
    await Promise.all([
      prisma.careerSiteSettings.findFirst({
        where: { tenantId: tenant.id },
      }),
      prisma.tenant.count(),
      isSuperAdmin
        ? prisma.tenant.findMany({
            orderBy: { name: "asc" },
          })
        : Promise.resolve([]),
    ]);

  const defaultTimezone: string = anyTenant.defaultTimezone || "Africa/Lagos";
  const defaultCurrency: string = anyTenant.defaultCurrency || "USD";

  const planTier: string = (anyTenant.planTier as string) || "GROWTH";
  const planLabel =
    PLAN_LABELS[planTier] ||
    anyTenant.planName ||
    anyTenant.plan ||
    "Growth";

  const planBlurb =
    PLAN_FEATURE_BLURB[planTier] ||
    "Core ATS with multi-tenant agency features as you grow.";

  const seats: number | null =
    typeof anyTenant.seats === "number" ? anyTenant.seats : null;
  const maxSeats: number | null =
    typeof anyTenant.maxSeats === "number" ? anyTenant.maxSeats : null;

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "";
  const tenantSlug: string = anyTenant.slug || tenant.id;
  const careersPath = `/careers/${encodeURIComponent(tenantSlug)}`;
  const careersUrl = baseUrl ? `${baseUrl}${careersPath}` : careersPath;

  const isCareersPublic = careerSettings?.isPublic ?? true;
  const includeInMarketplace =
    (careerSettings as any)?.includeInMarketplace ?? false;

  const workspaceName = tenant.name || "ATS workspace";

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-6 lg:px-8">
      {/* Page header */}
      <header className="space-y-2">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
          ATS · Settings
        </p>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
          Settings
        </h1>
        <p className="text-sm text-slate-500">
          Configure your ThinkATS workspace, notifications, security and data
          controls. Most changes here apply to your entire ATS workspace.
        </p>
      </header>

      {/* Global alerts */}
      <div className="space-y-2">
        {updatedSection && (
          <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-[11px] text-emerald-800">
            {updatedSection === "defaults" &&
              "Workspace defaults updated successfully."}
            {updatedSection === "billing" &&
              "Billing & plan settings updated successfully."}
            {updatedSection !== "defaults" &&
              updatedSection !== "billing" &&
              "Settings updated."}
          </div>
        )}

        {errorMessage && (
          <div className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-[11px] text-rose-800">
            {errorMessage}
          </div>
        )}
      </div>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        {/* LEFT: main settings */}
        <section className="space-y-6">
          {/* Workspace basics + defaults */}
          <section className="space-y-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 className="text-sm font-semibold text-slate-900">
                  Workspace basics
                </h2>
                <p className="mt-1 text-xs text-slate-500">
                  Identity and defaults for this ATS workspace. Branding and
                  careers-site configuration live on their own settings pages.
                </p>
              </div>
              <Link
                href="/ats/settings/workspace"
                className="inline-flex items-center rounded-full bg-slate-900 px-3 py-1.5 text-[11px] font-semibold text-white hover:bg-slate-800"
              >
                Manage workspace
              </Link>
            </div>

            {/* Identity (read-only here) */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-700">
                  Workspace name
                </label>
                <input
                  type="text"
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 shadow-inner-sm"
                  value={workspaceName}
                  disabled
                />
                <p className="text-[11px] text-slate-400">
                  Pulled from your primary ATS tenant. Edit on{" "}
                  <span className="font-medium text-slate-700">
                    Workspace settings
                  </span>
                  .
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-700">
                  Workspace URL
                </label>
                <div className="flex rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">
                  <span className="truncate">
                    {tenantSlug}.thinkats.com /{" "}
                    <span className="font-medium">ats</span>
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Internal ATS URL for your team. Client careers sites use their
                  own URLs.
                </p>
              </div>
            </div>

            {/* Defaults form: timezone + currency */}
            <form
              method="POST"
              action="/api/ats/settings/defaults"
              className="mt-2 grid gap-4 border-t border-slate-100 pt-4 sm:grid-cols-3"
            >
              <input type="hidden" name="tenantId" value={tenant.id} />
              <div className="space-y-1.5">
                <label
                  htmlFor="timezone"
                  className="text-xs font-medium text-slate-700"
                >
                  Default timezone
                </label>
                <input
                  id="timezone"
                  name="timezone"
                  type="text"
                  defaultValue={defaultTimezone}
                  placeholder="Africa/Lagos"
                  className="w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 outline-none ring-0 placeholder:text-slate-400 focus:border-[#172965] focus:bg-white focus:ring-1 focus:ring-[#172965]"
                />
                <p className="text-[11px] text-slate-400">
                  IANA timezone ID, e.g.{" "}
                  <code className="rounded bg-slate-50 px-1 py-0.5 text-[10px]">
                    Africa/Lagos
                  </code>{" "}
                  or{" "}
                  <code className="rounded bg-slate-50 px-1 py-0.5 text-[10px]">
                    Europe/London
                  </code>
                  .
                </p>
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="currency"
                  className="text-xs font-medium text-slate-700"
                >
                  Default currency
                </label>
                <input
                  id="currency"
                  name="currency"
                  type="text"
                  defaultValue={defaultCurrency}
                  placeholder="USD"
                  className="w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 outline-none ring-0 placeholder:text-slate-400 focus:border-[#172965] focus:bg-white focus:ring-1 focus:ring-[#172965]"
                />
                <p className="text-[11px] text-slate-400">
                  Three-letter ISO code, e.g.{" "}
                  <code className="rounded bg-slate-50 px-1 py-0.5 text-[10px]">
                    USD
                  </code>
                  ,{" "}
                  <code className="rounded bg-slate-50 px-1 py-0.5 text-[10px]">
                    NGN
                  </code>{" "}
                  or{" "}
                  <code className="rounded bg-slate-50 px-1 py-0.5 text-[10px]">
                    EUR
                  </code>
                  .
                </p>
              </div>

              <div className="flex items-end">
                <button
                  type="submit"
                  className="w-full rounded-md bg-[#172965] px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-[#12204d]"
                >
                  Save defaults
                </button>
              </div>
            </form>
          </section>

          {/* Scoring & bias settings (live card) */}
          <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-sm font-semibold text-slate-900">
                  Scoring &amp; ranking
                </h2>
                <p className="mt-1 text-xs text-slate-500">
                  Workspace-level controls for tiers, weights, skills and bias
                  reduction. Per-job overrides still apply inside each role.
                </p>
              </div>
              <Link
                href="/ats/settings/scoring"
                className="hidden rounded-full border border-slate-200 px-3 py-1.5 text-[11px] font-medium text-slate-700 hover:bg-slate-50 sm:inline-flex"
              >
                Open scoring settings
              </Link>
            </div>

            <ScoringSettingsCard />
          </section>

          {/* Notifications */}
          <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-sm font-semibold text-slate-900">
                  Email &amp; notifications
                </h2>
                <p className="mt-1 text-xs text-slate-500">
                  Define which ATS events generate emails. Delivery rules can be
                  wired into your email provider later.
                </p>
              </div>
              <span className="inline-flex items-center rounded-full bg-slate-50 px-3 py-1 text-[11px] font-medium text-slate-500">
                UI only
              </span>
            </div>

            <div className="space-y-4">
              <NotificationRow
                title="Daily ATS digest"
                description="Morning email with new applications, new jobs and key activity across all tenants."
              />
              <NotificationRow
                title="Mentions & comments"
                description="Email your team when they are mentioned or assigned inside a candidate timeline."
              />
              <NotificationRow
                title="Client collaboration"
                description="Notify clients when you share a shortlist, request feedback, or update a candidate’s stage."
              />
              <NotificationRow
                title="Security alerts"
                description="Logins from new devices and critical account changes. Recommended on for all admins."
                highlight
              />
            </div>
          </section>

          {/* Data & privacy / Danger zone */}
          <section className="grid gap-4 lg:grid-cols-2">
            <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-sm font-semibold text-slate-900">
                Data &amp; privacy
              </h2>
              <p className="text-xs text-slate-500">
                Manage retention and export tools for candidate data across this
                workspace.
              </p>
              <ul className="mt-2 space-y-2 text-xs text-slate-600">
                <li>• Candidate data export (CSV, XLSX, JSON)</li>
                <li>• Data retention policies per workspace</li>
                <li>• Automatic redaction of PII after a chosen period</li>
              </ul>
            </div>

            <div className="space-y-3 rounded-2xl border border-red-200 bg-red-50/70 p-6 shadow-sm">
              <h2 className="text-sm font-semibold text-red-800">
                Danger zone
              </h2>
              <p className="text-xs text-red-700">
                These controls are intentionally locked down. Wire this to a
                support and approval flow before enabling self-service.
              </p>
              <button
                type="button"
                className="mt-2 inline-flex items-center justify-center rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white shadow-sm hover:bg-red-700"
              >
                Contact support to close workspace
              </button>
              <p className="mt-1 text-[11px] text-red-700/80">
                Closing a workspace archives all jobs, applications and tenant
                records. ThinkATS support should guide this process.
              </p>
            </div>
          </section>
        </section>

        {/* RIGHT: summary / meta */}
        <aside className="space-y-6">
          {/* Workspace overview */}
          <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-sm font-semibold text-slate-900">
              Workspace overview
            </h2>
            <p className="text-xs text-slate-500">
              Snapshot of how this ATS workspace is configured.
            </p>

            <dl className="mt-2 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <dt className="text-slate-500">Default tenant</dt>
                <dd className="ml-4 flex-1 text-right font-medium text-slate-900">
                  {workspaceName}
                </dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-slate-500">Total workspaces</dt>
                <dd className="ml-4 flex-1 text-right font-medium text-slate-900">
                  {totalWorkspaces}
                </dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-slate-500">Default timezone</dt>
                <dd className="ml-4 flex-1 text-right font-medium text-slate-900">
                  {defaultTimezone}
                </dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-slate-500">Default currency</dt>
                <dd className="ml-4 flex-1 text-right font-medium text-slate-900">
                  {defaultCurrency}
                </dd>
              </div>
            </dl>
          </div>

          {/* Billing & plans card */}
          <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-sm font-semibold text-slate-900">
                  Billing &amp; plans
                </h2>
                <p className="mt-1 text-xs text-slate-500">
                  Plan tier and seat limits for this workspace. Super admins can
                  override plans for any tenant.
                </p>
              </div>
              <span className="inline-flex items-center rounded-full bg-slate-900 px-3 py-1 text-[11px] font-semibold text-white">
                {planLabel}
              </span>
            </div>

            <p className="text-[11px] text-slate-600">{planBlurb}</p>

            <dl className="mt-2 space-y-1.5 text-[11px]">
              <div className="flex items-center justify-between">
                <dt className="text-slate-500">Seats (committed)</dt>
                <dd className="ml-4 flex-1 text-right font-medium text-slate-900">
                  {seats ?? "—"}
                </dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-slate-500">Seat limit</dt>
                <dd className="ml-4 flex-1 text-right font-medium text-slate-900">
                  {maxSeats ?? "—"}
                </dd>
              </div>
            </dl>

            <form
              method="POST"
              action="/api/ats/settings/billing"
              className="mt-3 space-y-3 border-t border-slate-100 pt-3 text-[11px]"
            >
              {isSuperAdmin ? (
                <div className="space-y-1.5">
                  <label
                    htmlFor="tenantId"
                    className="block text-[11px] font-medium text-slate-700"
                  >
                    Manage tenant (super admin)
                  </label>
                  <select
                    id="tenantId"
                    name="tenantId"
                    defaultValue={tenant.id}
                    className="block w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-[11px] text-slate-900 outline-none focus:border-[#172965] focus:bg-white focus:ring-1 focus:ring-[#172965]"
                  >
                    {allTenantsForBilling.map((t) => {
                      const tAny = t as any;
                      const label = t.name || tAny.slug || t.id;
                      return (
                        <option key={t.id} value={t.id}>
                          {label}
                        </option>
                      );
                    })}
                  </select>
                  <p className="text-[10px] text-slate-500">
                    As a super admin, you can override plan tier and seat limits
                    for any tenant, regardless of current limits.
                  </p>
                </div>
              ) : (
                <input type="hidden" name="tenantId" value={tenant.id} />
              )}

              <div className="grid gap-3 sm:grid-cols-3">
                <div className="space-y-1.5">
                  <label
                    htmlFor="planTier"
                    className="block text-[11px] font-medium text-slate-700"
                  >
                    Plan tier
                  </label>
                  <select
                    id="planTier"
                    name="planTier"
                    defaultValue={planTier}
                    className="block w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-[11px] text-slate-900 outline-none focus:border-[#172965] focus:bg-white focus:ring-1 focus:ring-[#172965]"
                  >
                    <option value="STARTER">Starter</option>
                    <option value="GROWTH">Growth</option>
                    <option value="AGENCY">Agency</option>
                    <option value="ENTERPRISE">Enterprise</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label
                    htmlFor="seats"
                    className="block text-[11px] font-medium text-slate-700"
                  >
                    Seats (committed)
                  </label>
                  <input
                    id="seats"
                    name="seats"
                    type="number"
                    min={0}
                    defaultValue={seats ?? ""}
                    placeholder="e.g. 5"
                    className="block w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-[11px] text-slate-900 outline-none focus:border-[#172965] focus:bg-white focus:ring-1 focus:ring-[#172965]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label
                    htmlFor="maxSeats"
                    className="block text-[11px] font-medium text-slate-700"
                  >
                    Seat limit
                  </label>
                  <input
                    id="maxSeats"
                    name="maxSeats"
                    type="number"
                    min={0}
                    defaultValue={maxSeats ?? ""}
                    placeholder="e.g. 10"
                    className="block w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-[11px] text-slate-900 outline-none focus:border-[#172965] focus:bg-white focus:ring-1 focus:ring-[#172965]"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <p className="max-w-xs text-[10px] text-slate-500">
                  Feature access can key off{" "}
                  <span className="font-medium">Plan tier</span> in your
                  middleware or UI (e.g. marketplace, advanced scoring, client
                  workspaces).
                </p>
                <button
                  type="submit"
                  className="inline-flex items-center rounded-full bg-[#172965] px-4 py-2 text-[11px] font-semibold text-white shadow-sm hover:bg-[#12204d]"
                >
                  Save billing
                </button>
              </div>
            </form>
          </div>

          {/* Careers-site summary card */}
          <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-900 p-6 text-slate-50 shadow-sm">
            <h2 className="text-sm font-semibold">Careers site</h2>
            <p className="text-xs text-slate-200/90">
              Quick view of how your public careers presence is configured for
              this workspace.
            </p>

            <div className="mt-2 space-y-2 text-[11px]">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium text-slate-50">
                    Careers URL (tenant)
                  </p>
                  <p className="mt-0.5 text-slate-200/80">
                    {isCareersPublic ? (
                      <>
                        Public at{" "}
                        <Link
                          href={careersPath}
                          target="_blank"
                          className="underline underline-offset-2"
                        >
                          {careersUrl}
                        </Link>
                      </>
                    ) : (
                      "Currently not public. Jobs still appear inside ATS."
                    )}
                  </p>
                </div>
                <span
                  className={[
                    "inline-flex h-6 items-center rounded-full px-3 text-[10px] font-semibold",
                    isCareersPublic
                      ? "bg-emerald-100/20 text-emerald-200"
                      : "bg-slate-800 text-slate-300",
                  ].join(" ")}
                >
                  {isCareersPublic ? "Public" : "Internal only"}
                </span>
              </div>

              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium text-slate-50">
                    Global marketplace
                  </p>
                  <p className="mt-0.5 text-slate-200/80">
                    {includeInMarketplace
                      ? "Public, open jobs also appear in the ThinkATS marketplace."
                      : "Jobs are only surfaced on your own careers site, not the marketplace."}
                  </p>
                </div>
                <span
                  className={[
                    "inline-flex h-6 items-center rounded-full px-3 text-[10px] font-semibold",
                    includeInMarketplace
                      ? "bg-indigo-100/20 text-indigo-200"
                      : "bg-slate-800 text-slate-300",
                  ].join(" ")}
                >
                  {includeInMarketplace ? "Enabled" : "Disabled"}
                </span>
              </div>
            </div>

            <div className="pt-2">
              <Link
                href="/ats/settings/careers"
                className="inline-flex items-center rounded-full bg-slate-50 px-4 py-1.5 text-[11px] font-semibold text-slate-900 hover:bg-white"
              >
                Manage careers settings
              </Link>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

/** Presentational helpers */

function NotificationRow({
  title,
  description,
  highlight,
}: {
  title: string;
  description: string;
  highlight?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <p
          className={`text-sm font-medium ${
            highlight ? "text-slate-900" : "text-slate-800"
          }`}
        >
          {title}
        </p>
        <p className="mt-1 text-xs text-slate-500">{description}</p>
      </div>
      <span className="inline-flex cursor-default items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-medium text-slate-500">
        UI only
      </span>
    </div>
  );
}
