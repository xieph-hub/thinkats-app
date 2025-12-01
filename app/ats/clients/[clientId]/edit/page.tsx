// app/ats/clients/[clientId]/edit/page.tsx
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getResourcinTenant } from "@/lib/tenant";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Edit client | ThinkATS",
  description: "Edit a recruitment client's details.",
};

type EditClientPageProps = {
  params: { clientId: string };
  searchParams?: { updated?: string; error?: string };
};

export default async function EditClientPage({
  params,
  searchParams,
}: EditClientPageProps) {
  const tenant = await getResourcinTenant();
  if (!tenant) {
    notFound();
  }

  const client = await prisma.clientCompany.findFirst({
    where: {
      id: params.clientId,
      tenantId: tenant.id,
    },
  });

  if (!client) {
    notFound();
  }

  const updated = searchParams?.updated === "1";
  const errorMessage = searchParams?.error;

  const website = client.website || "";
  const industry = client.industry || "";
  const logoUrl = client.logoUrl || "";
  const careersiteSlug = client.careersiteSlug || "";
  const careersiteCustomDomain = client.careersiteCustomDomain || "";
  const careersiteEnabled = client.careersiteEnabled ?? false;
  const notes = client.notes || "";

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
            Edit client
          </h1>
          <p className="mt-1 text-xs text-slate-600">
            Update the client company&apos;s details under this workspace.
          </p>
        </div>
      </div>

      {updated && (
        <div className="rounded-md border border-slate-200 bg-slate-100 px-3 py-2 text-[11px] text-slate-800">
          Client updated.
        </div>
      )}

      {errorMessage && (
        <div className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-[11px] text-rose-800">
          {errorMessage}
        </div>
      )}

      <form
        method="POST"
        action={`/api/ats/clients/${client.id}`}
        className="space-y-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
      >
        {/* Company details */}
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
              defaultValue={client.name}
              className="mt-1 block w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 outline-none ring-0 placeholder:text-slate-400 focus:border-[#172965] focus:bg-white focus:ring-1 focus:ring-[#172965]"
            />
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
                defaultValue={website}
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
                defaultValue={industry}
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
              defaultValue={logoUrl}
              placeholder="https://..."
              className="mt-1 block w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 outline-none ring-0 placeholder:text-slate-400 focus:border-[#172965] focus:bg-white focus:ring-1 focus:ring-[#172965]"
            />
          </div>
        </section>

        {/* Careersite */}
        <section className="space-y-4 border-t border-slate-100 pt-4">
          <h2 className="text-sm font-semibold text-slate-900">
            Careersite
          </h2>

          <div className="flex items-center gap-2">
            <input
              id="careersiteEnabled"
              name="careersiteEnabled"
              type="checkbox"
              defaultChecked={careersiteEnabled}
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
                defaultValue={careersiteSlug}
                placeholder="acme"
                className="mt-1 block w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 outline-none ring-0 placeholder:text-slate-400 focus:border-[#172965] focus:bg-white focus:ring-1 focus:ring-[#172965]"
              />
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
                defaultValue={careersiteCustomDomain}
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
            defaultValue={notes || ""}
            className="mt-1 block w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 outline-none ring-0 placeholder:text-slate-400 focus:border-[#172965] focus:bg-white focus:ring-1 focus:ring-[#172965]"
          />
        </section>

        <div className="border-t border-slate-100 pt-3">
          <button
            type="submit"
            className="inline-flex items-center rounded-md bg-[#172965] px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-[#12204d]"
          >
            Save changes
          </button>
        </div>
      </form>
    </div>
  );
}
