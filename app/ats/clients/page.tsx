// app/ats/clients/page.tsx
import type { Metadata } from "next";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { getResourcinTenant } from "@/lib/tenant";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "ATS | Clients | ThinkATS",
  description: "Manage client companies under each workspace in ThinkATS.",
};

interface ClientsPageSearchParams {
  tenantId?: string | string[];
  q?: string | string[];
  created?: string;
  error?: string;
}

function normalizeFirst(value?: string | string[]): string {
  if (Array.isArray(value)) return value[0] ?? "";
  if (typeof value === "string") return value;
  return "";
}

export default async function AtsClientsPage({
  searchParams,
}: {
  searchParams?: ClientsPageSearchParams;
}) {
  const tenantParam = normalizeFirst(searchParams?.tenantId);
  const q = normalizeFirst(searchParams?.q);
  const created = searchParams?.created === "1";
  const errorCode = searchParams?.error;

  const tenants = await prisma.tenant.findMany({
    orderBy: { name: "asc" },
  });

  let selectedTenant: any =
    (tenantParam &&
      tenants.find(
        (t: any) => t.id === tenantParam || t.slug === tenantParam,
      )) || (await getResourcinTenant());

  if (!selectedTenant) {
    throw new Error("No tenant found.");
  }

  const selectedTenantId = selectedTenant.id;

  const clients = await prisma.clientCompany.findMany({
    where: { tenantId: selectedTenantId },
    orderBy: { name: "asc" },
  });

  const filteredClients = clients.filter((client: any) => {
    if (!q) return true;
    const haystack = `${client.name || ""}`.toLowerCase();
    return haystack.includes(q.toLowerCase());
  });

  const totalClients = clients.length;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 lg:px-8">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">
            Client companies
          </h1>
          <p className="mt-1 max-w-2xl text-xs text-slate-600">
            These are the organisations you recruit for under each workspace.
            Use this page to onboard new clients without touching the database.
          </p>
        </div>

        {/* Tenant selector */}
        <form method="GET" className="flex flex-col items-end gap-2 text-[11px]">
          {/* keep search query when switching tenant */}
          {q && <input type="hidden" name="q" value={q} />}

          <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5">
            <span className="text-[10px] uppercase tracking-wide text-slate-500">
              Workspace
            </span>
            <select
              name="tenantId"
              defaultValue={selectedTenantId}
              className="border-none bg-transparent text-[11px] text-slate-900 outline-none focus:ring-0"
            >
              {tenants.map((tenant: any) => (
                <option key={tenant.id} value={tenant.id}>
                  {tenant.name || tenant.slug || tenant.id}
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
          <p className="text-[10px] text-slate-500">
            Currently viewing clients under{" "}
            <span className="font-medium text-slate-800">
              {selectedTenant.name || selectedTenant.slug}
            </span>
            .
          </p>
        </form>
      </div>

      {/* Alerts */}
      {created && (
        <div className="mb-4 rounded-lg border border-[#64C247]/40 bg-[#64C247]/10 px-3 py-2 text-[11px] text-[#225325]">
          Client company created successfully.
        </div>
      )}
      {errorCode && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[11px] text-red-700">
          {errorCode === "missing_name"
            ? "Client name is required."
            : errorCode === "missing_tenant"
            ? "A workspace (tenant) is required to create a client."
            : "Something went wrong while creating the client. Please try again."}
        </div>
      )}

      {/* Top row: stats + create form */}
      <div className="mb-6 grid gap-4 md:grid-cols-[minmax(0,1.3fr)_minmax(0,1.2fr)]">
        {/* Stats card */}
        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-900">
            Client overview
          </h2>
          <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3">
            <div>
              <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
                Total clients
              </p>
              <p className="mt-1 text-2xl font-semibold text-[#172965]">
                {totalClients}
              </p>
              <p className="mt-1 text-[11px] text-slate-500">
                Under this workspace.
              </p>
            </div>
            <div>
              <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
                Workspace
              </p>
              <p className="mt-1 text-sm font-semibold text-slate-900">
                {selectedTenant.name || selectedTenant.slug}
              </p>
              <p className="mt-1 text-[11px] text-slate-500">
                Matches{" "}
                <code className="rounded bg-slate-100 px-1 py-0.5">
                  tenantId
                </code>{" "}
                on jobs/applications.
              </p>
            </div>
            <div>
              <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
                Usage
              </p>
              <p className="mt-1 text-sm font-semibold text-[#306B34]">
                ATS-ready
              </p>
              <p className="mt-1 text-[11px] text-slate-500">
                New jobs can be linked to these clients from /ats/jobs/new.
              </p>
            </div>
          </div>
        </section>

        {/* Create client form */}
        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-900">
            Add a new client company
          </h2>
          <p className="mt-1 text-[11px] text-slate-600">
            This will live under the currently selected workspace.
          </p>

          <form
            method="POST"
            action="/ats/clients/new"
            encType="multipart/form-data"
            className="mt-4 space-y-3 text-[13px]"
          >
            {/* Keep tenant context */}
            <input type="hidden" name="tenantId" value={selectedTenantId} />

            <div className="space-y-1">
              <label
                htmlFor="client-name"
                className="text-xs font-medium text-slate-700"
              >
                Client name
              </label>
              <input
                id="client-name"
                name="name"
                required
                placeholder="Avitech Nigeria"
                className="block w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 outline-none ring-0 placeholder:text-slate-400 focus:border-[#172965] focus:bg-white focus:ring-1 focus:ring-[#172965]"
              />
            </div>

            <div className="space-y-1">
              <label
                htmlFor="client-logo"
                className="text-xs font-medium text-slate-700"
              >
                Client logo (optional)
              </label>
              <input
                id="client-logo"
                name="logo"
                type="file"
                accept="image/*"
                className="block w-full cursor-pointer rounded-md border border-dashed border-slate-200 bg-slate-50 px-3 py-2 text-[11px] text-slate-600 file:mr-2 file:rounded-md file:border-0 file:bg-[#172965] file:px-2.5 file:py-1 file:text-[11px] file:font-semibold file:text-white hover:border-slate-300"
              />
              <p className="mt-1 text-[10px] text-slate-500">
                Square PNG, JPG or SVG recommended for best display in the
                pipeline and job pages.
              </p>
            </div>

            <button
              type="submit"
              className="inline-flex w-full items-center justify-center rounded-full bg-[#172965] px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-[#0f1c48]"
            >
              Create client
            </button>
            <p className="mt-1 text-[10px] text-slate-500">
              Once created, you&apos;ll be able to assign jobs to this client
              from the ATS jobs screen.
            </p>
          </form>
        </section>
      </div>

      {/* Search + list */}
      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <form
          method="GET"
          className="mb-3 flex flex-col gap-2 border-b border-slate-100 pb-3 text-[11px] sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="flex-1">
            {/* preserve tenant when searching */}
            <input type="hidden" name="tenantId" value={selectedTenantId} />
            <div className="relative">
              <input
                type="text"
                name="q"
                defaultValue={q}
                placeholder="Search clients by name…"
                className="block w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 outline-none ring-0 placeholder:text-slate-400 focus:border-[#172965] focus:bg-white focus:ring-1 focus:ring-[#172965]"
              />
              <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-[13px] text-slate-400">
                ⌕
              </span>
            </div>
          </div>
        </form>

        {filteredClients.length === 0 ? (
          <p className="text-[11px] text-slate-500">
            No client companies yet for this workspace. Use the form above to
            add the first one.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-[11px] text-slate-700">
              <thead className="border-b border-slate-200 bg-slate-50 text-[10px] uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-3 py-2">Client</th>
                  <th className="px-3 py-2">Workspace</th>
                  <th className="px-3 py-2 text-right">Shortcuts</th>
                </tr>
              </thead>
              <tbody>
                {filteredClients.map((client: any) => {
                  const label = client.name as string;
                  const initial =
                    (label?.charAt?.(0)?.toUpperCase?.() as string) || "C";

                  return (
                    <tr
                      key={client.id}
                      className="border-b border-slate-100 last:border-0"
                    >
                      <td className="px-3 py-2 align-top">
                        <div className="flex items-center gap-2">
                          {client.logoUrl ? (
                            <div className="relative h-7 w-7 overflow-hidden rounded-md border border-slate-200 bg-white">
                              <Image
                                src={client.logoUrl}
                                alt={`${label} logo`}
                                width={28}
                                height={28}
                                className="h-full w-full object-contain"
                              />
                            </div>
                          ) : (
                            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-slate-100 text-[11px] font-semibold text-slate-600">
                              {initial}
                            </div>
                          )}
                          <div className="flex flex-col">
                            <span className="text-xs font-medium text-slate-900">
                              {label}
                            </span>
                            <span className="text-[10px] text-slate-500">
                              ID:{" "}
                              <span className="font-mono">
                                {String(client.id).slice(0, 8)}…
                              </span>
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-2 align-top">
                        <span className="inline-flex rounded-full bg-slate-50 px-2 py-0.5 text-[10px] text-slate-600">
                          {selectedTenant.name || selectedTenant.slug}
                        </span>
                      </td>
                      <td className="px-3 py-2 align-top">
                        <div className="flex justify-end gap-2">
                          <a
                            href={`/ats/jobs?tenantId=${encodeURIComponent(
                              selectedTenantId,
                            )}&clientId=${encodeURIComponent(client.id)}`}
                            className="rounded-full bg-slate-50 px-2 py-1 text-[10px] font-medium text-slate-700 hover:bg-slate-100"
                          >
                            View jobs
                          </a>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
