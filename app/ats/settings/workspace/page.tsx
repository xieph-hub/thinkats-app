// app/ats/settings/workspace/page.tsx
import type { Metadata } from "next";
import { getResourcinTenant } from "@/lib/tenant";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Workspace settings | ThinkATS",
  description:
    "Manage the name and URL slug for the current ThinkATS workspace.",
};

type WorkspaceSettingsSearchParams = {
  updated?: string;
  error?: string;
};

export default async function WorkspaceSettingsPage({
  searchParams,
}: {
  searchParams?: WorkspaceSettingsSearchParams;
}) {
  const tenant = await getResourcinTenant();

  if (!tenant) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8">
        <h1 className="text-xl font-semibold text-slate-900">
          Workspace not available
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          No default tenant is configured. Check{" "}
          <code className="rounded bg-slate-100 px-1 py-0.5 text-[11px]">
            RESOURCIN_TENANT_ID
          </code>{" "}
          or{" "}
          <code className="rounded bg-slate-100 px-1 py-0.5 text-[11px]">
            RESOURCIN_TENANT_SLUG
          </code>{" "}
          in your environment.
        </p>
      </div>
    );
  }

  const updated = searchParams?.updated === "1";
  const errorMessage = searchParams?.error;

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-6">
      {/* Header */}
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
          Settings
        </p>
        <h1 className="mt-1 text-2xl font-semibold text-slate-900">
          Workspace
        </h1>
        <p className="mt-1 text-xs text-slate-600">
          This controls how the workspace appears inside ThinkATS and in
          career-site links.
        </p>
      </div>

      {/* Alerts */}
      {updated && (
        <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-[11px] text-emerald-800">
          Workspace settings saved.
        </div>
      )}

      {errorMessage && (
        <div className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-[11px] text-rose-800">
          {errorMessage}
        </div>
      )}

      {/* Form */}
      <form
        method="POST"
        action="/api/ats/settings/workspace"
        className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
      >
        <div>
          <label
            htmlFor="name"
            className="block text-[11px] font-medium text-slate-700"
          >
            Workspace name
          </label>
          <input
            id="name"
            name="name"
            required
            defaultValue={tenant.name ?? ""}
            className="mt-1 block w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 outline-none ring-0 placeholder:text-slate-400 focus:border-[#172965] focus:bg-white focus:ring-1 focus:ring-[#172965]"
          />
          <p className="mt-1 text-[11px] text-slate-500">
            Example: &quot;Resourcin internal ATS&quot; or a client workspace
            name.
          </p>
        </div>

        <div>
          <label
            htmlFor="slug"
            className="block text-[11px] font-medium text-slate-700"
          >
            Workspace slug
          </label>
          <div className="mt-1 flex items-center gap-1.5">
            <span className="rounded-md bg-slate-50 px-2 py-1 text-[11px] text-slate-500">
              workspace:
            </span>
            <input
              id="slug"
              name="slug"
              defaultValue={tenant.slug ?? ""}
              placeholder="workspace-slug"
              className="block flex-1 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 outline-none ring-0 placeholder:text-slate-400 focus:border-[#172965] focus:bg-white focus:ring-1 focus:ring-[#172965]"
            />
          </div>
          <p className="mt-1 text-[11px] text-slate-500">
            Short identifier used in URLs and tracking. Only letters, numbers
            and dashes are recommended.
          </p>
        </div>

        <div className="border-t border-slate-100 pt-3">
          <button
            type="submit"
            className="inline-flex items-center rounded-md bg-[#172965] px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-[#12204d]"
          >
            Save workspace
          </button>
        </div>
      </form>
    </div>
  );
}
