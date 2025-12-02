// app/ats/settings/page.tsx
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "ThinkATS | Settings",
  description: "Configure your ATS workspace, account and security.",
};

export default function AtsSettingsPage() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
          Settings
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Manage workspace configuration, account preferences and security.
        </p>
      </header>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm text-slate-500">
          This is a first version of the Settings area. We’ll hang billing,
          security, integrations and advanced workspace controls here later so
          the navigation stops throwing 404s.
        </p>
      </div>
    </div>
  );
}
