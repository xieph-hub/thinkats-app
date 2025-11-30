// app/ats/tenants/page.tsx
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { getResourcinTenant } from "@/lib/tenant";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "ATS | Workspaces | ThinkATS",
  description:
    "Manage ATS workspaces (tenants) used by Resourcin and your customers.",
};

type TenantsPageSearchParams = {
  created?: string;
  error?: string;
};

function formatDate(value: any): string {
  if (!value) return "";
  const d =
    typeof value === "string" || typeof value === "number"
      ? new Date(value)
      : value;
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default async function AtsTenantsPage({
  searchParams,
}: {
  searchParams?: TenantsPageSearchParams;
}) {
  const tenants = await prisma.tenant.findMany({
    orderBy: { name: "asc" },
  });

  // For messaging banners
  const created = searchParams?.created === "1";
  const errorCode = searchParams?.error;

  // Default tenant for copy & examples
  const defaultTenant = await getResourcinTenant();

  const totalTenants = tenants.length;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 lg:px-8">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">
            Workspaces (tenants)
          </h1>
          <p className="mt-1 max-w-2xl text-xs text-slate-600">
            Each tenant is a separate ATS workspace. Use this page to spin up
            new workspaces for customers, and jump into their jobs & clients in
            one click.
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-[11px] text-slate-600 shadow-sm">
          <p className="font-semibold text-slate-800">Current default</p>
          <p className="mt-1">
            <span className="font-medium text-[#172965]">
              {defaultTenant.name || defaultTenant.slug}
            </span>
          </p>
          <p className="mt-1 text-[10px] text-slate-500">
            Controlled by <code className="rounded bg-slate-100 px-1 py-0.5">
              RESOURCIN_TENANT_SLUG
            </code>{" "}
            in your environment.
          </p>
        </div>
      </div>

      {/* Alerts */}
      {created && (
        <div className="mb-4 rounded-lg border border-[#64C247]/40 bg-[#64C247]/10 px-3 py-2 text-[11px] text-[#225325]">
          Workspace created successfully. You can now switch to it from the
          jobs, clients and dashboard screens.
        </div>
      )}
      {errorCode && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[11px] text-red-700">
          {errorCode === "missing_name"
            ? "Name is required to create a workspace."
            : "Something went wrong while creating the workspace. Please try again."}
        </div>
      )}

      {/* Top row: stats + create form */}
      <div className="mb-6 grid gap-4 md:grid-cols-[minmax(0,1.3fr)_minmax(0,1.2fr)]">
        {/* Stats card */}
        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-900">
            Workspace overview
          </h2>
          <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3">
            <div>
              <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
                Total workspaces
              </p>
              <p className="mt-1 text-2xl font-semibold text-[#172965]">
                {totalTenants}
              </p>
              <p className="mt-1 text-[11px] text-slate-500">
                Including Resourcin and external customers.
              </p>
            </div>
            <div>
              <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
                Default workspace
              </p>
              <p className="mt-1 text-sm font-semibold text-slate-900">
                {defaultTenant.name || defaultTenant.slug}
              </p>
              <p className="mt-1 text-[11px] text-slate-500">
                Used when no tenant is specified in ATS pages.
              </p>
            </div>
            <div>
              <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
                Self-serve ready
              </p>
              <p className="mt-1 text-sm font-semibold text-[#306B34]">
                Manual create UI
              </p>
              <p className="mt-1 text-[11px] text-slate-500">
                Later you can wire /signup to create tenants here.
              </p>
            </div>
          </div>
        </section>

        {/* Create tenant form */}
        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-900">
            Create a new workspace
          </h2>
          <p className="mt-1 text-[11px] text-slate-600">
            Think of this as a separate ATS account. You&apos;ll still control
            access manually for now.
          </p>

          <form
            method="POST"
            action="/ats/tenants/new"
            className="mt-4 space-y-3 text-[13px]"
          >
            <div className="space-y-1">
              <label
                htmlFor="tenant-name"
                className="text-xs font-medium text-slate-700"
              >
                Workspace name
              </label>
              <input
                id="tenant-name"
                name="name"
                required
                placeholder="Acme Talent Partners"
                className="block w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 outline-none ring-0 placeholder:text-slate-400 focus:border-[#172965] focus:bg-white focus:ring-1 focus:ring-[#172965]"
              />
            </div>

            <div className="space-y-1">
              <label
                htmlFor="tenant-slug"
                className="text-xs font-medium text-slate-700"
              >
                URL slug (optional)
              </label>
              <input
                id="tenant-slug"
                name="slug"
                placeholder="acme-talent"
                className="block w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 outline-none ring-0 placeholder:text-slate-400 focus:border-[#172965] focus:bg-white focus:ring-1 focus:ring-[#172965]"
              />
              <p className="mt-1 text-[10px] text-slate-500">
                Used internally for referencing the workspace. If left blank
                we&apos;ll generate one from the name.
              </p>
            </div>

            <button
              type="submit"
              className="inline-flex w-full items-center justify-center rounded-full bg-[#172965] px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-[#0f1c48]"
            >
              Create workspace
            </button>
          </form>
        </section>
      </div>

      {/* Tenants list */}
      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="mb-3 flex items-center justify-between gap-2">
          <h2 className="text-sm font-semibold text-slate-900">
            Existing workspaces
          </h2>
          <p className="text-[11px] text-slate-500">
            Click through to manage jobs and client companies for each
            workspace.
          </p>
        </div>

        {tenants.length === 0 ? (
          <p className="text-[11px] text-slate-500">
            No tenants yet. Use the form above to create your first workspace.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-[11px] text-slate-700">
              <thead className="border-b border-slate-200 bg-slate-50 text-[10px] uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-3 py-2">Name</th>
                  <th className="px-3 py-2">Slug</th>
                  <th className="px-3 py-2">ID</th>
                  <th className="px-3 py-2">Created</th>
                  <th className="px-3 py-2 text-right">Shortcuts</th>
                </tr>
              </thead>
              <tbody>
                {tenants.map((tenant: any) => (
                  <tr
                    key={tenant.id}
                    className="border-b border-slate-100 last:border-0"
                  >
                    <td className="px-3 py-2 align-top">
                      <div className="flex flex-col">
                        <span className="text-xs font-medium text-slate-900">
                          {tenant.name || tenant.slug || tenant.id}
                        </span>
                      </div>
                    </td>
                    <td className="px-3 py-2 align-top">
                      <span className="inline-flex rounded-full bg-slate-50 px-2 py-0.5 text-[10px] text-slate-600">
                        {tenant.slug || "—"}
                      </span>
                    </td>
                    <td className="px-3 py-2 align-top">
                      <span className="font-mono text-[10px] text-slate-500">
                        {String(tenant.id).slice(0, 8)}…
                      </span>
                    </td>
                    <td className="px-3 py-2 align-top">
                      <span className="text-[11px] text-slate-600">
                        {formatDate(tenant.createdAt || tenant.created_at)}
                      </span>
                    </td>
                    <td className="px-3 py-2 align-top">
                      <div className="flex justify-end gap-2">
                        <a
                          href={`/ats/jobs?tenantId=${encodeURIComponent(
                            tenant.id,
                          )}`}
                          className="rounded-full bg-slate-50 px-2 py-1 text-[10px] font-medium text-slate-700 hover:bg-slate-100"
                        >
                          View jobs
                        </a>
                        <a
                          href={`/ats/clients?tenantId=${encodeURIComponent(
                            tenant.id,
                          )}`}
                          className="rounded-full bg-slate-50 px-2 py-1 text-[10px] font-medium text-slate-700 hover:bg-slate-100"
                        >
                          View clients
                        </a>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
