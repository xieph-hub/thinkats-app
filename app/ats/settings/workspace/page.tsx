// app/ats/settings/workspace/page.tsx
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { getResourcinTenant } from "@/lib/tenant";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Workspace settings | ThinkATS",
  description:
    "Manage branding and careersite configuration for this ATS workspace.",
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
          No default tenant configured. Check{" "}
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

  const existingSettings = await prisma.careerSiteSettings.findFirst({
    where: { tenantId: tenant.id },
    orderBy: { createdAt: "asc" },
  });

  const updated = searchParams?.updated === "1";
  const errorMessage = searchParams?.error;

  const heroTitle = existingSettings?.heroTitle || "";
  const heroSubtitle = existingSettings?.heroSubtitle || "";
  const primaryColor = existingSettings?.primaryColor || "#172965";
  const accentColor = existingSettings?.accentColor || "#FFC000";
  const careersiteLogoUrl =
    existingSettings?.logoUrl || tenant.logoUrl || "";
  const isPublic = existingSettings?.isPublic ?? true;

  const primaryContactEmail = tenant.primaryContactEmail || "";
  const internalNotes = tenant.internalNotes || "";
  const workspaceLogoUrl = tenant.logoUrl || "";

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-6">
      {/* Header */}
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
          Settings
        </p>
        <h1 className="mt-1 text-2xl font-semibold text-slate-900">
          Workspace
        </h1>
        <p className="mt-1 text-xs text-slate-600">
          Control how this workspace is labelled, branded and how its
          careersite appears to candidates.
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

      <form
        method="POST"
        action="/api/ats/settings/workspace"
        className="space-y-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
      >
        {/* Workspace identity */}
        <section className="space-y-4">
          <h2 className="text-sm font-semibold text-slate-900">
            Workspace identity
          </h2>

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
              defaultValue={tenant.name}
              className="mt-1 block w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 outline-none ring-0 placeholder:text-slate-400 focus:border-[#172965] focus:bg-white focus:ring-1 focus:ring-[#172965]"
            />
            <p className="mt-1 text-[11px] text-slate-500">
              Example: &quot;Resourcin internal ATS&quot; or a named client
              workspace.
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
                defaultValue={tenant.slug}
                placeholder="workspace-slug"
                className="block flex-1 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 outline-none ring-0 placeholder:text-slate-400 focus:border-[#172965] focus:bg-white focus:ring-1 focus:ring-[#172965]"
              />
            </div>
            <p className="mt-1 text-[11px] text-slate-500">
              Short identifier you can reuse in tracking and subdomains. Letters,
              numbers and dashes only.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="primaryContactEmail"
                className="block text-[11px] font-medium text-slate-700"
              >
                Primary contact email
              </label>
              <input
                id="primaryContactEmail"
                name="primaryContactEmail"
                type="email"
                defaultValue={primaryContactEmail}
                placeholder="talent@resourcin.com"
                className="mt-1 block w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 outline-none ring-0 placeholder:text-slate-400 focus:border-[#172965] focus:bg-white focus:ring-1 focus:ring-[#172965]"
              />
            </div>

            <div>
              <label
                htmlFor="workspaceLogoUrl"
                className="block text-[11px] font-medium text-slate-700"
              >
                ATS / internal logo URL
              </label>
              <input
                id="workspaceLogoUrl"
                name="workspaceLogoUrl"
                defaultValue={workspaceLogoUrl}
                placeholder="https://..."
                className="mt-1 block w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 outline-none ring-0 placeholder:text-slate-400 focus:border-[#172965] focus:bg-white focus:ring-1 focus:ring-[#172965]"
              />
              <p className="mt-1 text-[11px] text-slate-500">
                Used in the ATS sidebar/header. You can reuse the same logo on
                the careersite if you like.
              </p>
            </div>
          </div>

          <div>
            <label
              htmlFor="internalNotes"
              className="block text-[11px] font-medium text-slate-700"
            >
              Internal notes
            </label>
            <textarea
              id="internalNotes"
              name="internalNotes"
              rows={3}
              defaultValue={internalNotes}
              placeholder="Internal notes about this workspace: commercial terms, contacts, etc."
              className="mt-1 block w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 outline-none ring-0 placeholder:text-slate-400 focus:border-[#172965] focus:bg-white focus:ring-1 focus:ring-[#172965]"
            />
          </div>
        </section>

        {/* Careersite branding */}
        <section className="space-y-4 border-t border-slate-100 pt-4">
          <h2 className="text-sm font-semibold text-slate-900">
            Careersite branding & visibility
          </h2>

          <div className="flex items-center gap-2">
            <input
              id="isPublic"
              name="isPublic"
              type="checkbox"
              defaultChecked={isPublic}
              className="h-3.5 w-3.5 rounded border-slate-300 text-[#172965] focus:ring-[#172965]"
            />
            <label
              htmlFor="isPublic"
              className="text-[11px] font-medium text-slate-700"
            >
              Careersite publicly visible to candidates
            </label>
          </div>

          <div className="grid gap-4 sm:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
            <div>
              <label
                htmlFor="careersiteLogoUrl"
                className="block text-[11px] font-medium text-slate-700"
              >
                Careersite logo URL
              </label>
              <input
                id="careersiteLogoUrl"
                name="careersiteLogoUrl"
                defaultValue={careersiteLogoUrl}
                placeholder="https://..."
                className="mt-1 block w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 outline-none ring-0 placeholder:text-slate-400 focus:border-[#172965] focus:bg-white focus:ring-1 focus:ring-[#172965]"
              />
              <p className="mt-1 text-[11px] text-slate-500">
                Used on public job pages and careersite hero. Falls back to the
                ATS logo if left empty.
              </p>
            </div>

            <div>
              <label
                htmlFor="primaryColor"
                className="block text-[11px] font-medium text-slate-700"
              >
                Primary colour
              </label>
              <div className="mt-1 flex items-center gap-2">
                <input
                  id="primaryColor"
                  name="primaryColor"
                  defaultValue={primaryColor}
                  placeholder="#172965"
                  className="block w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 outline-none ring-0 placeholder:text-slate-400 focus:border-[#172965] focus:bg-white focus:ring-1 focus:ring-[#172965]"
                />
                <div
                  className="h-8 w-8 rounded-md border border-slate-200"
                  style={{ backgroundColor: primaryColor }}
                />
              </div>
              <p className="mt-1 text-[11px] text-slate-500">
                Used for buttons and highlights on the careersite.
              </p>
            </div>
          </div>

          <div>
            <label
              htmlFor="accentColor"
              className="block text-[11px] font-medium text-slate-700"
            >
              Accent colour
            </label>
            <input
              id="accentColor"
              name="accentColor"
              defaultValue={accentColor}
              placeholder="#FFC000"
              className="mt-1 block w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 outline-none ring-0 placeholder:text-slate-400 focus:border-[#172965] focus:bg-white focus:ring-1 focus:ring-[#172965]"
            />
            <p className="mt-1 text-[11px] text-slate-500">
              Secondary highlight colour (chips, subtle backgrounds).
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="heroTitle"
                className="block text-[11px] font-medium text-slate-700"
              >
                Careersite hero title
              </label>
              <input
                id="heroTitle"
                name="heroTitle"
                defaultValue={heroTitle}
                placeholder="Careers at Resourcin & our clients"
                className="mt-1 block w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 outline-none ring-0 placeholder:text-slate-400 focus:border-[#172965] focus:bg-white focus:ring-1 focus:ring-[#172965]"
              />
            </div>

            <div>
              <label
                htmlFor="heroSubtitle"
                className="block text-[11px] font-medium text-slate-700"
              >
                Careersite hero subtitle
              </label>
              <input
                id="heroSubtitle"
                name="heroSubtitle"
                defaultValue={heroSubtitle}
                placeholder="Live roles with clear expectations and honest feedback."
                className="mt-1 block w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 outline-none ring-0 placeholder:text-slate-400 focus:border-[#172965] focus:bg-white focus:ring-1 focus:ring-[#172965]"
              />
            </div>
          </div>
        </section>

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
