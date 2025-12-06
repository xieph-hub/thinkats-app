// app/ats/tenants/page.tsx
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import type { Tenant } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getResourcinTenant } from "@/lib/tenant";
import { ensureOtpVerified } from "@/lib/requireOtp";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "ThinkATS | Workspaces",
  description:
    "Manage ATS workspaces (tenants) used by Resourcin and your customers.",
};

type TenantsPageSearchParams = {
  created?: string;
  updated?: string;
  error?: string;
  editTenantId?: string;
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

function normaliseStatus(raw: string | null | undefined): string {
  return (raw || "active").toLowerCase();
}

function getStatusLabel(raw: string | null | undefined): string {
  const status = normaliseStatus(raw);
  switch (status) {
    case "active":
      return "Active";
    case "trial":
      return "Trial";
    case "suspended":
      return "Suspended";
    case "archived":
      return "Archived";
    default:
      return status.charAt(0).toUpperCase() + status.slice(1);
  }
}

function getStatusClasses(raw: string | null | undefined): string {
  const status = normaliseStatus(raw);
  switch (status) {
    case "active":
      return "bg-emerald-50 text-emerald-700 ring-emerald-100";
    case "trial":
      return "bg-amber-50 text-amber-700 ring-amber-100";
    case "suspended":
      return "bg-rose-50 text-rose-700 ring-rose-100";
    case "archived":
      return "bg-slate-50 text-slate-600 ring-slate-100";
    default:
      return "bg-slate-50 text-slate-600 ring-slate-100";
  }
}

export default async function AtsTenantsPage({
  searchParams = {},
}: {
  searchParams?: TenantsPageSearchParams;
}) {
  // 🔐 Every ATS workspace page should be behind OTP
  await ensureOtpVerified("/ats/tenants");

  const tenants: Tenant[] = await prisma.tenant.findMany({
    orderBy: { createdAt: "desc" },
  });

  const defaultTenant = await getResourcinTenant();

  const totalTenants = tenants.length;
  const activeTenants = tenants.filter(
    (t) => normaliseStatus((t as any).status) === "active",
  ).length;
  const trialTenants = tenants.filter(
    (t) => normaliseStatus((t as any).status) === "trial",
  ).length;

  const created = searchParams.created === "1";
  const updated = searchParams.updated === "1";
  const errorCode = searchParams.error;
  const editTenantId = searchParams.editTenantId;

  const editingTenant =
    (editTenantId &&
      tenants.find((t) => String(t.id) === String(editTenantId))) ||
    null;

  const isEditing = Boolean(editingTenant);

  return (
    <div className="flex h-full flex-1 flex-col">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white px-5 py-4">
        <div className="mb-2 flex items-center gap-2 text-xs text-slate-500">
          <Link href="/ats/jobs" className="hover:underline">
            ATS
          </Link>
          <span>/</span>
          <span className="hover:underline">Settings</span>
          <span>/</span>
          <span className="font-medium text-slate-700">
            Workspaces (tenants)
          </span>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-base font-semibold text-slate-900">
              Workspaces (tenants)
            </h1>
            <p className="mt-0.5 max-w-xl text-[11px] text-slate-500">
              Each tenant is a separate ATS workspace. Use this page to create
              and maintain client workspaces, capture basic KYC details and
              jump into their jobs and clients in one click.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-[11px] text-slate-600">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
              Default workspace
            </p>
            <p className="mt-1 text-[11px] font-semibold text-slate-900">
              {defaultTenant.name || defaultTenant.slug}
            </p>
            <p className="mt-1 text-[10px] text-slate-500">
              Controlled by{" "}
              <code className="rounded bg-slate-100 px-1 py-0.5">
                RESOURCIN_TENANT_SLUG
              </code>{" "}
              in your environment.
            </p>
          </div>
        </div>
      </header>

      <main className="flex flex-1 flex-col bg-slate-50 px-5 py-4">
        {/* Alerts */}
        {(created || updated || errorCode) && (
          <div className="mb-3 space-y-2">
            {created && (
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-[11px] text-emerald-800">
                Workspace created successfully. You can now switch to it from
                jobs, clients and dashboard screens.
              </div>
            )}
            {updated && (
              <div className="rounded-lg border border-sky-200 bg-sky-50 px-3 py-2 text-[11px] text-sky-800">
                Workspace details updated. Logo, status and contact information
                are now in sync.
              </div>
            )}
            {errorCode && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[11px] text-red-700">
                {errorCode === "missing_name"
                  ? "Name is required to create or update a workspace."
                  : "Something went wrong while saving the workspace. Please try again."}
              </div>
            )}
          </div>
        )}

        {/* Top row: stats + create/edit form */}
        <div className="mb-4 grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1.3fr)]">
          {/* Stats card */}
          <section className="rounded-2xl border border-slate-200 bg-white p-4 text-[11px] shadow-sm">
            <h2 className="text-sm font-semibold text-slate-900">
              Workspace overview
            </h2>
            <p className="mt-1 text-[11px] text-slate-500">
              High-level picture of tenants configured in this ATS instance.
            </p>

            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl bg-slate-50 px-3 py-2">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                  Total workspaces
                </p>
                <p className="mt-1 text-xl font-semibold text-[#172965]">
                  {totalTenants}
                </p>
                <p className="mt-1 text-[10px] text-slate-500">
                  Includes Resourcin and external clients.
                </p>
              </div>

              <div className="rounded-xl bg-slate-50 px-3 py-2">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                  Active vs trial
                </p>
                <p className="mt-1 text-sm font-semibold text-slate-900">
                  {activeTenants} active
                </p>
                <p className="text-[10px] text-slate-500">
                  {trialTenants} on trial or pilot.
                </p>
              </div>

              <div className="rounded-xl bg-slate-50 px-3 py-2">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                  KYC essentials
                </p>
                <p className="mt-1 text-sm font-semibold text-slate-900">
                  Primary contact + status
                </p>
                <p className="text-[10px] text-slate-500">
                  Enough for basic client KYC &amp; compliance on this screen.
                </p>
              </div>
            </div>
          </section>

          {/* Create / edit workspace form (includes basic KYC fields) */}
          <section className="rounded-2xl border border-slate-200 bg-white p-4 text-[11px] shadow-sm">
            <div className="mb-2 flex items-center justify-between gap-2">
              <div>
                <h2 className="text-sm font-semibold text-slate-900">
                  {isEditing
                    ? "Edit workspace (client record)"
                    : "Create a new workspace"}
                </h2>
                <p className="mt-1 text-[11px] text-slate-500">
                  Treat each workspace as a separate client account. Name, URL
                  slug, logo and primary contact are your basic KYC layer here.
                </p>
              </div>
              {isEditing && editingTenant && (
                <div className="hidden text-[10px] text-slate-400 sm:block">
                  <span className="rounded-full bg-slate-100 px-2 py-0.5">
                    Editing: {editingTenant.name || editingTenant.slug}
                  </span>
                </div>
              )}
            </div>

            <form
              method="POST"
              action="/ats/tenants/new"
              encType="multipart/form-data"
              className="mt-3 space-y-3 text-[13px]"
            >
              {isEditing && editingTenant && (
                <input
                  type="hidden"
                  name="tenantId"
                  value={String(editingTenant.id)}
                />
              )}

              {/* Top row: basic identity + slug */}
              <div className="grid gap-3 sm:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
                <div className="space-y-1">
                  <label
                    htmlFor="tenant-name"
                    className="text-xs font-medium text-slate-700"
                  >
                    Workspace / client name
                  </label>
                  <input
                    id="tenant-name"
                    name="name"
                    required
                    defaultValue={editingTenant?.name ?? ""}
                    placeholder="Acme Talent Partners"
                    className="block w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 outline-none ring-0 placeholder:text-slate-400 focus:border-[#172965] focus:bg-white focus:ring-1 focus:ring-[#172965]"
                  />
                  <p className="mt-1 text-[10px] text-slate-500">
                    Legal or trading name used in your contracts / invoices.
                  </p>
                </div>

                <div className="space-y-1">
                  <label
                    htmlFor="tenant-slug"
                    className="text-xs font-medium text-slate-700"
                  >
                    URL slug
                  </label>
                  <input
                    id="tenant-slug"
                    name="slug"
                    defaultValue={editingTenant?.slug ?? ""}
                    placeholder="acme-talent"
                    className="block w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 outline-none ring-0 placeholder:text-slate-400 focus:border-[#172965] focus:bg-white focus:ring-1 focus:ring-[#172965]"
                  />
                  <p className="mt-1 text-[10px] text-slate-500">
                    Used in internal URLs and careers paths. If left blank
                    we&apos;ll generate one from the name.
                  </p>
                </div>
              </div>

              {/* KYC-ish: status + primary contact email */}
              <div className="grid gap-3 sm:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
                <div className="space-y-1">
                  <label
                    htmlFor="tenant-status"
                    className="text-xs font-medium text-slate-700"
                  >
                    Account status
                  </label>
                  <select
                    id="tenant-status"
                    name="status"
                    defaultValue={
                      (editingTenant?.status as string | null) ?? "active"
                    }
                    className="block w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 outline-none ring-0 focus:border-[#172965] focus:bg-white focus:ring-1 focus:ring-[#172965]"
                  >
                    <option value="active">Active</option>
                    <option value="trial">Trial</option>
                    <option value="suspended">Suspended</option>
                    <option value="archived">Archived</option>
                  </select>
                  <p className="mt-1 text-[10px] text-slate-500">
                    Helps you separate live client workspaces from trials or
                    archived data.
                  </p>
                </div>

                <div className="space-y-1">
                  <label
                    htmlFor="tenant-primary-contact"
                    className="text-xs font-medium text-slate-700"
                  >
                    Primary contact email
                  </label>
                  <input
                    id="tenant-primary-contact"
                    name="primaryContactEmail"
                    type="email"
                    defaultValue={
                      (editingTenant as any)?.primaryContactEmail ?? ""
                    }
                    placeholder="ops@acmepartners.com"
                    className="block w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 outline-none ring-0 placeholder:text-slate-400 focus:border-[#172965] focus:bg-white focus:ring-1 focus:ring-[#172965]"
                  />
                  <p className="mt-1 text-[10px] text-slate-500">
                    Used as the main contact for ATS notices and basic KYC
                    records.
                  </p>
                </div>
              </div>

              {/* Logo upload + preview */}
              <div className="grid gap-3 sm:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
                <div className="space-y-1">
                  <label
                    htmlFor="tenant-logo"
                    className="text-xs font-medium text-slate-700"
                  >
                    Workspace logo
                  </label>
                  <input
                    id="tenant-logo"
                    name="logo"
                    type="file"
                    accept="image/*"
                    className="block w-full cursor-pointer rounded-md border border-dashed border-slate-200 bg-slate-50 px-3 py-2 text-[11px] text-slate-600 file:mr-2 file:rounded-md file:border-0 file:bg-[#172965] file:px-2.5 file:py-1 file:text-[11px] file:font-semibold file:text-white hover:border-slate-300"
                  />
                  <p className="mt-1 text-[10px] text-slate-500">
                    PNG, JPG or SVG. A square logo works best in workspace
                    lists and careers pages.
                  </p>
                </div>

                <div className="space-y-1">
                  <p className="text-xs font-medium text-slate-700">
                    Logo preview
                  </p>
                  <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                    {editingTenant?.logoUrl ? (
                      <div className="relative h-9 w-9 overflow-hidden rounded-md border border-slate-200 bg-white">
                        <Image
                          src={editingTenant.logoUrl as any}
                          alt={`${editingTenant.name || editingTenant.slug || "Tenant"} logo`}
                          width={36}
                          height={36}
                          className="h-full w-full object-contain"
                        />
                      </div>
                    ) : (
                      <div className="flex h-9 w-9 items-center justify-center rounded-md bg-slate-200 text-[11px] font-semibold text-slate-700">
                        {(editingTenant?.name ||
                          editingTenant?.slug ||
                          "T")!
                          .charAt(0)
                          .toUpperCase()}
                      </div>
                    )}
                    <div className="flex flex-col text-[10px] text-slate-500">
                      <span>
                        We&apos;ll always show either the uploaded logo or a
                        clean initial avatar.
                      </span>
                      <span>
                        This keeps the workspace list and careers pages looking
                        consistent.
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-3">
                {isEditing && (
                  <Link
                    href="/ats/tenants"
                    className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-medium text-slate-600 hover:bg-slate-50"
                  >
                    Cancel
                  </Link>
                )}
                <button
                  type="submit"
                  className="inline-flex items-center rounded-full bg-[#172965] px-4 py-1.5 text-[11px] font-semibold text-white shadow-sm hover:bg-[#0f1c48]"
                >
                  {isEditing ? "Save workspace" : "Create workspace"}
                </button>
              </div>
            </form>
          </section>
        </div>

        {/* Tenants list */}
        <section className="rounded-2xl border border-slate-200 bg-white p-4 text-[11px] shadow-sm">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">
                Existing workspaces
              </h2>
              <p className="mt-0.5 text-[11px] text-slate-500">
                This is your internal client / workspace registry. Use the
                actions on the right to jump into jobs, clients and careers
                configuration.
              </p>
            </div>
          </div>

          {tenants.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-6 py-10 text-center text-[11px] text-slate-500">
              <p className="mb-1 text-[12px] font-medium text-slate-700">
                No workspaces yet.
              </p>
              <p>
                Use the form above to create your first tenant for Resourcin or
                a client.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full border-separate border-spacing-y-1 text-left text-[11px] text-slate-700">
                <thead>
                  <tr className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                    <th className="px-3 py-2">Workspace</th>
                    <th className="px-3 py-2">Primary contact</th>
                    <th className="px-3 py-2">Status</th>
                    <th className="px-3 py-2">Slug</th>
                    <th className="px-3 py-2">ID</th>
                    <th className="px-3 py-2">Created</th>
                    <th className="px-3 py-2 text-right">Shortcuts</th>
                  </tr>
                </thead>
                <tbody>
                  {tenants.map((tenant) => {
                    const label =
                      tenant.name || tenant.slug || (tenant.id as any);
                    const initial =
                      (label?.toString?.().charAt(0).toUpperCase() as string) ||
                      "T";

                    const statusLabel = getStatusLabel(
                      (tenant as any).status,
                    );
                    const statusClasses = getStatusClasses(
                      (tenant as any).status,
                    );

                    const isDefault =
                      String(tenant.id) === String(defaultTenant.id);

                    return (
                      <tr key={tenant.id}>
                        {/* Workspace */}
                        <td className="align-top px-3 py-2">
                          <div className="flex items-center gap-2 rounded-xl border border-slate-100 bg-slate-50 px-3 py-2">
                            {tenant.logoUrl ? (
                              <div className="relative h-7 w-7 overflow-hidden rounded-md border border-slate-200 bg-white">
                                <Image
                                  src={tenant.logoUrl as any}
                                  alt={`${label} logo`}
                                  width={28}
                                  height={28}
                                  className="h-full w-full object-contain"
                                />
                              </div>
                            ) : (
                              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-slate-200 text-[11px] font-semibold text-slate-700">
                                {initial}
                              </div>
                            )}
                            <div className="flex flex-col">
                              <span className="text-xs font-medium text-slate-900">
                                {label}
                              </span>
                              <div className="flex flex-wrap items-center gap-1 text-[10px] text-slate-500">
                                {tenant.slug && (
                                  <span>{tenant.slug}</span>
                                )}
                                {isDefault && (
                                  <>
                                    <span className="text-slate-300">•</span>
                                    <span className="rounded-full bg-emerald-50 px-1.5 py-0.5 text-[9px] font-medium text-emerald-700">
                                      Default
                                    </span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Primary contact */}
                        <td className="align-top px-3 py-2">
                          {(tenant as any).primaryContactEmail ? (
                            <span className="text-[11px] text-slate-700">
                              {(tenant as any).primaryContactEmail}
                            </span>
                          ) : (
                            <span className="text-[10px] italic text-slate-400">
                              No primary contact set
                            </span>
                          )}
                        </td>

                        {/* Status */}
                        <td className="align-top px-3 py-2">
                          <span
                            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ring-1 ${statusClasses}`}
                          >
                            <span className="h-1.5 w-1.5 rounded-full bg-current" />
                            {statusLabel}
                          </span>
                        </td>

                        {/* Slug */}
                        <td className="align-top px-3 py-2">
                          <span className="inline-flex rounded-full bg-slate-50 px-2 py-0.5 text-[10px] text-slate-600">
                            {tenant.slug || "—"}
                          </span>
                        </td>

                        {/* ID */}
                        <td className="align-top px-3 py-2">
                          <span className="font-mono text-[10px] text-slate-500">
                            {String(tenant.id).slice(0, 8)}…
                          </span>
                        </td>

                        {/* Created */}
                        <td className="align-top px-3 py-2">
                          <span className="text-[11px] text-slate-600">
                            {formatDate(tenant.createdAt)}
                          </span>
                        </td>

                        {/* Shortcuts */}
                        <td className="align-top px-3 py-2">
                          <div className="flex justify-end gap-1">
                            <Link
                              href={`/ats/tenants?editTenantId=${encodeURIComponent(
                                String(tenant.id),
                              )}`}
                              className="rounded-full bg-slate-50 px-2 py-1 text-[10px] font-medium text-slate-700 hover:bg-slate-100"
                            >
                              Edit
                            </Link>
                            <Link
                              href={`/ats/jobs?tenantId=${encodeURIComponent(
                                String(tenant.id),
                              )}`}
                              className="rounded-full bg-slate-50 px-2 py-1 text-[10px] font-medium text-slate-700 hover:bg-slate-100"
                            >
                              Jobs
                            </Link>
                            <Link
                              href={`/ats/clients?tenantId=${encodeURIComponent(
                                String(tenant.id),
                              )}`}
                              className="rounded-full bg-slate-50 px-2 py-1 text-[10px] font-medium text-slate-700 hover:bg-slate-100"
                            >
                              Clients
                            </Link>
                            <Link
                              href={`/ats/tenants/${encodeURIComponent(
                                String(tenant.id),
                              )}/careersite`}
                              className="rounded-full bg-slate-50 px-2 py-1 text-[10px] font-medium text-slate-700 hover:bg-slate-100"
                            >
                              Careers site
                            </Link>
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
      </main>
    </div>
  );
}
