// app/ats/settings/page.tsx
import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getResourcinTenant, requireTenantMembership } from "@/lib/tenant";
import { getServerUser } from "@/lib/auth/getServerUser";
import ScoringSettingsCard from "@/components/ats/settings/ScoringSettingsCard";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "ThinkATS | Settings",
  description: "Configure your ATS workspace, notifications, security and data.",
};

export default async function AtsSettingsPage() {
  const tenant = await getResourcinTenant();

  // If there is no default tenant configured, show a clear message
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

  // 🔐 Gate: only OWNER / ADMIN or super admin can see workspace settings
  const { isSuperAdmin } = await getServerUser();
  if (!isSuperAdmin) {
    await requireTenantMembership(tenant.id, {
      allowedRoles: ["OWNER", "ADMIN"],
    });
  }

  // Load some workspace meta + careersite config
  const [careerSettings, totalWorkspaces] = await Promise.all([
    prisma.careerSiteSettings.findFirst({
      where: { tenantId: tenant.id },
    }),
    prisma.tenant.count(),
  ]);

  const anyTenant = tenant as any;

  const seats: number | null =
    typeof anyTenant.seats === "number"
      ? anyTenant.seats
      : typeof anyTenant.maxSeats === "number"
      ? anyTenant.maxSeats
      : null;

  const planLabel: string =
    typeof anyTenant.planName === "string"
      ? anyTenant.planName
      : typeof anyTenant.plan === "string"
      ? anyTenant.plan
      : "Growth (agency multi-tenant)";

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "";
  const tenantSlug: string = anyTenant.slug || tenant.id;
  const careersPath = `/careers/${encodeURIComponent(tenantSlug)}`;
  const careersUrl = baseUrl ? `${baseUrl}${careersPath}` : careersPath;

  const isCareersPublic = careerSettings?.isPublic ?? true;
  const includeInMarketplace =
    (careerSettings as any)?.includeInMarketplace ?? false;

  const workspaceName = tenant.name || "ATS workspace";

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-6 lg:px-8">
      {/* Page header */}
      <header>
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
          ATS · Settings
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">
          Settings
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Configure your ThinkATS workspace, notifications, security and data
          controls. Most changes here apply to your entire ATS workspace.
        </p>
      </header>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        {/* LEFT: main settings */}
        <section className="space-y-6">
          {/* Workspace basics */}
          <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-sm font-semibold text-slate-900">
                  Workspace basics
                </h2>
                <p className="mt-1 text-xs text-slate-500">
                  High-level identity and defaults for this ATS workspace. You
                  can update fine-grained branding on the workspace and
                  careers-site settings pages.
                </p>
              </div>
              <Link
                href="/ats/settings/workspace"
                className="inline-flex items-center rounded-full bg-slate-900 px-3 py-1.5 text-[11px] font-semibold text-white hover:bg-slate-800"
              >
                Manage workspace
              </Link>
            </div>

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
                  Pulled from your primary ATS tenant. Edit directly on the{" "}
                  <span className="font-medium text-slate-700">
                    Workspace settings
                  </span>{" "}
                  page.
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
                  Internal ATS URL for your team. Client-facing careers sites
                  use their own URLs.
                </p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-700">
                  Default timezone
                </label>
                <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
                  Africa/Lagos (UTC+1)
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-700">
                  Default currency
                </label>
                <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
                  USD (US Dollar)
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-700">
                  Environment
                </label>
                <div className="inline-flex items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  Live workspace
                </div>
              </div>
            </div>
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
                Open full scoring settings
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

          {/* Security & access */}
          <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-sm font-semibold text-slate-900">
                  Security &amp; access
                </h2>
                <p className="mt-1 text-xs text-slate-500">
                  Guardrails for who can access your ATS and how they sign in.
                  Connect these to real policies once SSO and 2FA are ready.
                </p>
              </div>
              <span className="inline-flex items-center rounded-full bg-slate-50 px-3 py-1 text-[11px] font-medium text-slate-500">
                Policy surface
              </span>
            </div>

            <div className="space-y-4">
              <SimpleSettingRow
                title="Workspace roles"
                description="Use roles like Admin, Recruiter, Hiring manager and Viewer to control access."
                badge="Coming soon"
              />
              <SimpleSettingRow
                title="Two-factor authentication"
                description="Require 2FA for admins and optionally for all workspace members."
                badge="Recommended"
              />
              <SimpleSettingRow
                title="Single sign-on (SSO)"
                description="Connect Okta, Azure AD, Google Workspace or other identity providers."
                badge="Enterprise"
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
          {/* Workspace overview card, now backed by real data */}
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
                <dt className="text-slate-500">Total seats</dt>
                <dd className="ml-4 flex-1 text-right font-medium text-slate-900">
                  {seats ?? "—"}
                </dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-slate-500">Plan</dt>
                <dd className="ml-4 flex-1 text-right font-medium text-slate-900">
                  {planLabel}
                </dd>
              </div>
            </dl>
          </div>

          {/* Careers-site summary card, wired to real settings */}
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

function SimpleSettingRow({
  title,
  description,
  badge,
}: {
  title: string;
  description: string;
  badge?: string;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <p className="text-sm font-medium text-slate-800">{title}</p>
        <p className="mt-1 text-xs text-slate-500">{description}</p>
      </div>
      {badge && (
        <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-medium text-slate-600">
          {badge}
        </span>
      )}
    </div>
  );
}
