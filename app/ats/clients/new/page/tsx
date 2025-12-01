// app/ats/clients/new/page.tsx
import type { Metadata } from "next";
import Link from "next/link";
import { getResourcinTenant } from "@/lib/tenant";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "New client | ThinkATS",
  description: "Create a new recruitment client for this workspace.",
};

export default async function NewClientPage() {
  const tenant = await getResourcinTenant();
  if (!tenant) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8">
        <h1 className="text-xl font-semibold text-slate-900">
          Workspace not available
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          No default tenant configured.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-6">
      <div className="flex items-center justify-between gap-2">
        <div>
          <Link
            href="/ats/clients"
            className="inline-flex items-center text-[11px] font-medium text-slate-500 hover:text-slate-800"
          >
            <span className="mr-1.5">←</span>
            Back to clients
          </Link>
          <h1 className="mt-3 text-xl font-semibold text-slate-900">
            New client
          </h1>
          <p className="mt-1 text-xs text-slate-600">
            Create a client company to attach roles, pipelines and careersites
            under this workspace.
          </p>
        </div>
      </div>

      <form
        method="POST"
        action="/api/ats/clients"
        className="space-y-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
      >
        {/* Basic details */}
        <section className="space-y-4">
          <h2 className="text-sm font-semibold text-slate-900">
            Company details
          </h2>

          <div>
            <label
              htmlFor="name"
              className="block text-[11px] font-medium text-slate-700"
            >
              Client name
            </label>
            <input
              id="name"
              name="name"
              required
              placeholder="e.g. Avitech Nigeria"
              className="mt-1 block w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 outline-none ring-0 placeholder:text-slate-400 focus:border-[#172965] focus:bg-white focus:ring-1 focus:ring-[#172965]"
            />
            <p className="mt-1 text-[11px] text-slate-500">
              This will show on job cards and candidate views.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="website"
                className="block text-[11px] font-medium text-slate-700"
              >
                Website
              </label>
              <input
                id="website"
                name="website"
                type="url"
                placeholder="https://example.com"
                className="mt-1 block w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 outline-none ring-0 placeholder:text-slate-400 focus:border-[#172965] focus:bg-white focus:ring-1 focus:ring-[#172965]"
              />
            </div>

            <div>
              <label
                htmlFor="industry"
                className="block text-[11px] font-medium text-slate-700"
              >
                Industry
              </label>
              <input
                id="industry"
                name="industry"
                placeholder="Fintech, Healthcare, BPO..."
                className="mt-1 block w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 outline-none ring-0 placeholder:text-slate-400 focus:border-[#172965] focus:bg-white focus:ring-1 focus:ring-[#172965]"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="logoUrl"
              className="block text-[11px] font-medium text-slate-700"
            >
              Logo URL
            </label>
            <input
              id="logoUrl"
              name="logoUrl"
              placeholder="https://..."
              className="mt-1 block w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 outline-none ring-0 placeholder:text-slate-400 focus:border-[#172965] focus:bg-white focus:ring-1 focus:ring-[#172965]"
            />
            <p className="mt-1 text-[11px] text-slate-500">
              Used on job cards and candidate profiles. (You can wire uploads
              later.)
            </p>
          </div>
        </section>

        {/* Careersite config */}
        <section className="space-y-4 border-t border-slate-100 pt-4">
          <h2 className="text-sm font-semibold text-slate-900">
            Careersite
          </h2>

          <div className="flex items-center gap-2">
            <input
              id="careersiteEnabled"
              name="careersiteEnabled"
              type="checkbox"
              className="h-3.5 w-3.5 rounded border-slate-300 text-[#172965] focus:ring-[#172965]"
            />
            <label
              htmlFor="careersiteEnabled"
              className="text-[11px] font-medium text-slate-700"
            >
              Careersite enabled for this client
            </label>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="careersiteSlug"
                className="block text-[11px] font-medium text-slate-700"
              >
                Careersite slug
              </label>
              <input
                id="careersiteSlug"
                name="careersiteSlug"
                placeholder="acme"
                className="mt-1 block w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 outline-none ring-0 placeholder:text-slate-400 focus:border-[#172965] focus:bg-white focus:ring-1 focus:ring-[#172965]"
              />
              <p className="mt-1 text-[11px] text-slate-500">
                For URLs like <span className="font-mono">acme.resourcin.com</span>.
              </p>
            </div>

            <div>
              <label
                htmlFor="careersiteCustomDomain"
                className="block text-[11px] font-medium text-slate-700"
              >
                Custom domain (optional)
              </label>
              <input
                id="careersiteCustomDomain"
                name="careersiteCustomDomain"
                placeholder="careers.acme.com"
                className="mt-1 block w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 outline-none ring-0 placeholder:text-slate-400 focus:border-[#172965] focus:bg-white focus:ring-1 focus:ring-[#172965]"
              />
            </div>
          </div>
        </section>

        {/* Notes */}
        <section className="space-y-2 border-t border-slate-100 pt-4">
          <h2 className="text-sm font-semibold text-slate-900">
            Internal notes
          </h2>
          <textarea
            id="notes"
            name="notes"
            rows={3}
            placeholder="Internal notes about this client: stakeholders, hiring preferences, comp bands..."
            className="mt-1 block w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 outline-none ring-0 placeholder:text-slate-400 focus:border-[#172965] focus:bg-white focus:ring-1 focus:ring-[#172965]"
          />
        </section>

        <div className="border-t border-slate-100 pt-3">
          <button
            type="submit"
            className="inline-flex items-center rounded-md bg-[#172965] px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-[#12204d]"
          >
            Create client
          </button>
        </div>
      </form>
    </div>
  );
}
