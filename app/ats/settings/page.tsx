// app/ats/settings/page.tsx
import type { Metadata } from "next";
import ScoringSettingsCard from "@/components/ats/settings/ScoringSettingsCard";

export const metadata: Metadata = {
  title: "ThinkATS | Settings",
  description: "Configure your ATS workspace, accounts and security.",
};

export default function AtsSettingsPage() {
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
          controls. Changes here apply to your entire ATS workspace.
        </p>
      </header>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        {/* LEFT: main settings */}
        <section className="space-y-6">
          {/* Workspace basics */}
          <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">
                Workspace basics
              </h2>
              <p className="mt-1 text-xs text-slate-500">
                Update the name and defaults for this ATS workspace. You&apos;ll
                wire these fields to real data later.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-700">
                  Workspace name
                </label>
                <input
                  type="text"
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 shadow-inner-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  defaultValue="Resourcin Human Capital Advisors Limited"
                  disabled
                />
                <p className="text-[11px] text-slate-400">
                  Pulled from your primary ATS tenant. Make this editable once
                  you&apos;re ready to persist changes.
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-700">
                  Workspace URL
                </label>
                <div className="flex rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500">
                  <span className="truncate">
                    resourcin.thinkats.com /{" "}
                    <span className="font-medium">ats</span>
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">
                  This is what your internal team uses. Client career sites use
                  their own URLs.
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

          {/* Scoring & bias settings (NLP / semantic matching lives here) */}
          <ScoringSettingsCard />

          {/* Notifications */}
          <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">
                Email & notifications
              </h2>
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
            <div>
              <h2 className="text-sm font-semibold text-slate-900">
                Security & access
              </h2>
              <p className="mt-1 text-xs text-slate-500">
                High-level controls for who can access your ATS and how they
                sign in. You&apos;ll connect this to real policies later.
              </p>
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
                Data & privacy
              </h2>
              <p className="text-xs text-slate-500">
                This is where you&apos;ll manage GDPR tools, retention policies
                and export options for candidate data.
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
                These controls are intentionally locked down. Use this section
                only when you&apos;re ready to wire support workflows and
                confirmations.
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
          <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-sm font-semibold text-slate-900">
              Workspace overview
            </h2>
            <p className="text-xs text-slate-500">
              A quick snapshot of how this ATS workspace is configured.
            </p>

            <dl className="mt-2 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <dt className="text-slate-500">Default tenant</dt>
                <dd className="font-medium text-slate-900">
                  Resourcin Human Capital Advisors
                </dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-slate-500">Total workspaces</dt>
                <dd className="font-medium text-slate-900">3</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-slate-500">Total seats</dt>
                <dd className="font-medium text-slate-900">10</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-slate-500">Plan</dt>
                <dd className="font-medium text-slate-900">
                  Growth (agency multi-tenant)
                </dd>
              </div>
            </dl>
          </div>

          <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-900 p-6 text-slate-50 shadow-sm">
            <h2 className="text-sm font-semibold">Need to wire real data?</h2>
            <p className="text-xs text-slate-200/90">
              When you&apos;re ready, you can:
            </p>
            <ul className="mt-1 space-y-1.5 text-xs text-slate-200/90">
              <li>• Map these fields to your Supabase workspace tables.</li>
              <li>• Add server actions for updating settings.</li>
              <li>• Lock down destructive actions behind approvals.</li>
            </ul>
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
