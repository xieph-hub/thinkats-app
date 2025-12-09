// app/ats/tenants/page.tsx
import type { Metadata } from "next";
import Link from "next/link";
import type { Tenant } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getResourcinTenant } from "@/lib/tenant";
import TenantLogo from "@/components/ats/tenants/TenantLogo";
import CopyCareersUrlButton from "@/components/ats/tenants/CopyCareersUrlButton";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "ATS | Workspaces | ThinkATS",
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

function getStatusLabel(raw: string | null | undefined): string {
  if (!raw) return "Active";
  const status = raw.toLowerCase();
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
  if (!raw) {
    return "bg-emerald-50 text-emerald-700 ring-emerald-100";
  }
  const status = raw.toLowerCase();
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

/**
 * Used for building tenantSlug.thinkats.com/careers URLs.
 * Strips any "www." and uses the hostname part only.
 */
function getBaseDomainFromEnv(): string {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://thinkats.com";
  try {
    const hostname = new URL(siteUrl).hostname;
    return hostname.replace(/^www\./i, "");
  } catch {
    return "thinkats.com";
  }
}

export default async function AtsTenantsPage({
  searchParams,
}: {
  searchParams?: TenantsPageSearchParams;
}) {
  // OTP + super-admin gating handled by:
  // - app/ats/layout.tsx (auth + OTP)
  // - app/ats/tenants/layout.tsx (SUPER_ADMIN only)

  const tenants: Tenant[] = await prisma.tenant.findMany({
    orderBy: { createdAt: "desc" },
  });

  const totalTenants = tenants.length;
  const activeTenants = tenants.filter(
    (t) => (t.status || "").toLowerCase() === "active" || !t.status,
  ).length;
  const trialTenants = tenants.filter(
    (t) => (t.status || "").toLowerCase() === "trial",
  ).length;

  // Aggregate per-tenant metrics (jobs, clients, candidates)
  const tenantIds = tenants.map((t) => t.id);

  const [jobGroups, clientGroups, candidateGroups] = await Promise.all([
    prisma.job.groupBy({
      by: ["tenantId"],
      _count: { _all: true },
      where: { tenantId: { in: tenantIds } },
    }),
    prisma.clientCompany.groupBy({
      by: ["tenantId"],
      _count: { _all: true },
      where: { tenantId: { in: tenantIds } },
    }),
    prisma.candidate.groupBy({
      by: ["tenantId"],
      _count: { _all: true },
      where: { tenantId: { in: tenantIds } },
    }),
  ]);

  const jobsByTenant = new Map<string, number>();
  const clientsByTenant = new Map<string, number>();
  const candidatesByTenant = new Map<string, number>();

  jobGroups.forEach((g) => jobsByTenant.set(g.tenantId, g._count._all));
  clientGroups.forEach((g) => clientsByTenant.set(g.tenantId, g._count._all));
  candidateGroups.forEach((g) =>
    candidatesByTenant.set(g.tenantId, g._count._all),
  );

  // For messaging banners
  const created = searchParams?.created === "1";
  const updated = searchParams?.updated === "1";
  const errorCode = searchParams?.error;

  // Which tenant (if any) are we editing?
  const rawEditTenantId = searchParams?.editTenantId;
  const editTenantId =
    typeof rawEditTenantId === "string" && rawEditTenantId.length > 0
      ? rawEditTenantId
      : undefined;

  const editingTenant =
    editTenantId && tenants.length
      ? tenants.find((t) => t.id === editTenantId) ?? null
      : null;

  const isEditing = Boolean(editingTenant);

  // Default tenant for copy & examples
  const defaultTenant = await getResourcinTenant();

  const latestTenant = tenants[0] ?? null;

  const formStatusDefault =
    (editingTenant?.status && editingTenant.status.toLowerCase()) || "active";

  const baseDomain = getBaseDomainFromEnv();

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 lg:px-8">
      {/* Header */}
      <header className="mb-6 flex flex-col gap-4 border-b border-slate-200 pb-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">
            ATS · Workspaces
          </p>
          <h1 className="text-2xl font-semibold text-slate-900">
            Workspaces (tenants)
          </h1>
          <p className="max-w-2xl text-xs text-slate-600">
            Each tenant is a separate ATS workspace. Use this page to spin up
            new workspaces for customers, capture basic KYC, and jump into
            their jobs, clients and careers sites in one click.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-[11px] text-slate-600 shadow-sm">
          <p className="font-semibold text-slate-800">Current default</p>
          <p className="mt-1">
            <span className="font-medium text-[#172965]">
              {defaultTenant.name || defaultTenant.slug}
            </span>
          </p>
          <p className="mt-1 text-[10px] text-slate-500">
            Controlled by{" "}
            <code className="rounded bg-slate-100 px-1 py-0.5">
              RESOURCIN_TENANT_SLUG
            </code>{" "}
            in your environment.
          </p>
        </div>
      </header>

      {/* Alerts */}
      {created && (
        <div className="mb-4 rounded-lg border border-[#64C247]/40 bg-[#64C247]/10 px-3 py-2 text-[11px] text-[#225325]">
          Workspace created successfully. You can now switch to it from the
          jobs, clients and dashboard screens.
        </div>
      )}
      {updated && (
        <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-[11px] text-emerald-800">
          Workspace updated successfully.
        </div>
      )}
      {errorCode && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[11px] text-red-700">
          {errorCode === "missing_name"
            ? "Name is required to create a workspace."
            : "Something went wrong while creating the workspace. Please try again."}
        </div>
      )}

      {/* Top row: stats + create/edit form */}
      <div className="mb-8 grid gap-4 md:grid-cols-[minmax(0,1.35fr)_minmax(0,1.15fr)]">
        {/* Stats & health overview */}
        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-900">
            Workspace overview
          </h2>

          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl bg-slate-50 p-3">
              <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
                Total workspaces
              </p>
              <p className="mt-1 text-2xl font-semibold text-[#172965]">
                {totalTenants}
              </p>
              <p className="mt-1 text-[11px] text-slate-500">
                Includes Resourcin and all external clients.
              </p>
            </div>

            <div className="rounded-xl bg-slate-50 p-3">
              <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
                Active vs trial
              </p>
              <p className="mt-1 text-lg font-semibold text-[#306B34]">
                {activeTenants}{" "}
                <span className="text-xs font-medium text-slate-500">
                  active
                </span>
              </p>
              <p className="mt-1 text-[11px] text-slate-500">
                {trialTenants}{" "}
                <span className="font-medium text-amber-700">on trial</span>{" "}
                right now.
              </p>
            </div>

            <div className="rounded-xl bg-slate-50 p-3">
              <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
                Most recent workspace
              </p>
              {latestTenant ? (
                <>
                  <p className="mt-1 text-sm font-semibold text-slate-900">
                    {latestTenant.name || latestTenant.slug}
                  </p>
                  <p className="mt-1 text-[11px] text-slate-500">
                    Created {formatDate(latestTenant.createdAt)}
                  </p>
                </>
              ) : (
                <p className="mt-2 text-[11px] text-slate-500">
                  No workspaces yet. Create your first one on the right.
                </p>
              )}
            </div>
          </div>
        </section>

        {/* Create / Edit tenant form (with KYC) */}
        <section
          id="workspace-form"
          className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
        >
          <div className="flex items-start justify-between gap-2">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">
                {isEditing ? "Edit workspace" : "Create a new workspace"}
              </h2>
              <p className="mt-1 text-[11px] text-slate-600">
                Think of this as a separate ATS account. You can capture basic
                KYC here for compliance, while keeping candidate-facing pages
                clean.
              </p>
            </div>
            {isEditing && editingTenant && (
              <span className="rounded-full bg-slate-50 px-3 py-1 text-[10px] font-medium text-slate-600">
                Editing:{" "}
                <span className="font-semibold text-slate-800">
                  {editingTenant.name || editingTenant.slug}
                </span>
              </span>
            )}
          </div>

          <form
            method="POST"
            action="/ats/tenants/new"
            encType="multipart/form-data"
            className="mt-4 space-y-4 text-[13px]"
          >
            {/* id is what route.tsx uses to decide create vs update */}
            <input
              type="hidden"
              name="tenantId"
              value={editingTenant?.id ?? ""}
            />

            {/* Basic identity */}
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
                defaultValue={editingTenant?.name ?? ""}
                placeholder="Acme Talent Partners"
                className="block w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 outline-none ring-0 placeholder:text-slate-400 focus:border-[#172965] focus:bg-white focus:ring-1 focus:ring-[#172965]"
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
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
                  defaultValue={editingTenant?.slug ?? ""}
                  placeholder="acme-talent"
                  className="block w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 outline-none ring-0 placeholder:text-slate-400 focus:border-[#172965] focus:bg-white focus:ring-1 focus:ring-[#172965]"
                />
                <p className="mt-1 text-[10px] text-slate-500">
                  Used internally and in careers URLs. If left blank we&apos;ll
                  generate one from the name.
                </p>
              </div>

              <div className="space-y-1">
                <label
                  htmlFor="tenant-logo"
                  className="text-xs font-medium text-slate-700"
                >
                  Workspace logo (optional)
                </label>
                <input
                  id="tenant-logo"
                  name="logo"
                  type="file"
                  accept="image/*"
                  className="block w-full cursor-pointer rounded-md border border-dashed border-slate-200 bg-slate-50 px-3 py-2 text-[11px] text-slate-600 file:mr-2 file:rounded-md file:border-0 file:bg-[#172965] file:px-2.5 file:py-1 file:text-[11px] file:font-semibold file:text-white hover:border-slate-300"
                />
                <p className="mt-1 text-[10px] text-slate-500">
                  PNG, JPG or SVG. Square logos look best in the list. If the
                  file upload fails, we fallback to an initial badge.
                </p>
              </div>
            </div>

            {/* KYC lite */}
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <label
                  htmlFor="registrationNumber"
                  className="text-xs font-medium text-slate-700"
                >
                  Registration / RC number (optional)
                </label>
                <input
                  id="registrationNumber"
                  name="registrationNumber"
                  defaultValue={editingTenant?.registrationNumber ?? ""}
                  placeholder="RC 1234567"
                  className="block w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 outline-none ring-0 placeholder:text-slate-400 focus:border-[#172965] focus:bg-white focus:ring-1 focus:ring-[#172965]"
                />
              </div>

              <div className="space-y-1">
                <label
                  htmlFor="taxId"
                  className="text-xs font-medium text-slate-700"
                >
                  Tax ID / TIN (optional)
                </label>
                <input
                  id="taxId"
                  name="taxId"
                  defaultValue={editingTenant?.taxId ?? ""}
                  placeholder="TIN 0123456789"
                  className="block w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 outline-none ring-0 placeholder:text-slate-400 focus:border-[#172965] focus:bg-white focus:ring-1 focus:ring-[#172965]"
                />
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <label
                  htmlFor="country"
                  className="text-xs font-medium text-slate-700"
                >
                  Country (optional)
                </label>
                <input
                  id="country"
                  name="country"
                  defaultValue={editingTenant?.country ?? ""}
                  placeholder="Nigeria"
                  className="block w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 outline-none ring-0 placeholder:text-slate-400 focus:border-[#172965] focus:bg-white focus:ring-1 focus:ring-[#172965]"
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <label
                    htmlFor="state"
                    className="text-xs font-medium text-slate-700"
                  >
                    State / Region (optional)
                  </label>
                  <input
                    id="state"
                    name="state"
                    defaultValue={editingTenant?.state ?? ""}
                    placeholder="Lagos"
                    className="block w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 outline-none ring-0 placeholder:text-slate-400 focus:border-[#172965] focus:bg-white focus:ring-1 focus:ring-[#172965]"
                  />
                </div>

                <div className="space-y-1">
                  <label
                    htmlFor="city"
                    className="text-xs font-medium text-slate-700"
                  >
                    City (optional)
                  </label>
                  <input
                    id="city"
                    name="city"
                    defaultValue={editingTenant?.city ?? ""}
                    placeholder="Victoria Island"
                    className="block w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 outline-none ring-0 placeholder:text-slate-400 focus:border-[#172965] focus:bg-white focus:ring-1 focus:ring-[#172965]"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-1">
              <label
                htmlFor="addressLine1"
                className="text-xs font-medium text-slate-700"
              >
                Address (optional)
              </label>
              <input
                id="addressLine1"
                name="addressLine1"
                defaultValue={editingTenant?.addressLine1 ?? ""}
                placeholder="Plot 123, Admiralty Way"
                className="mb-1 block w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 outline-none ring-0 placeholder:text-slate-400 focus:border-[#172965] focus:bg-white focus:ring-1 focus:ring-[#172965]"
              />
              <input
                id="addressLine2"
                name="addressLine2"
                defaultValue={editingTenant?.addressLine2 ?? ""}
                placeholder="Floor / Suite / Landmark (optional)"
                className="block w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 outline-none ring-0 placeholder:text-slate-400 focus:border-[#172965] focus:bg-white focus:ring-1 focus:ring-[#172965]"
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <label
                  htmlFor="industry"
                  className="text-xs font-medium text-slate-700"
                >
                  Industry (optional)
                </label>
                <input
                  id="industry"
                  name="industry"
                  defaultValue={editingTenant?.industry ?? ""}
                  placeholder="Fintech, Healthcare, Logistics..."
                  className="block w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 outline-none ring-0 placeholder:text-slate-400 focus:border-[#172965] focus:bg-white focus:ring-1 focus:ring-[#172965]"
                />
              </div>

              <div className="space-y-1">
                <label
                  htmlFor="websiteUrl"
                  className="text-xs font-medium text-slate-700"
                >
                  Website (optional)
                </label>
                <input
                  id="websiteUrl"
                  name="websiteUrl"
                  defaultValue={editingTenant?.websiteUrl ?? ""}
                  placeholder="https://acme.com"
                  className="block w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 outline-none ring-0 placeholder:text-slate-400 focus:border-[#172965] focus:bg-white focus:ring-1 focus:ring-[#172965]"
                />
              </div>
            </div>

            {/* Email + status */}
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <label
                  htmlFor="primaryContactEmail"
                  className="text-xs font-medium text-slate-700"
                >
                  Primary contact email (optional)
                </label>
                <input
                  id="primaryContactEmail"
                  name="primaryContactEmail"
                  type="email"
                  defaultValue={editingTenant?.primaryContactEmail ?? ""}
                  placeholder="founder@acme.com"
                  className="block w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 outline-none ring-0 placeholder:text-slate-400 focus:border-[#172965] focus:bg-white focus:ring-1 focus:ring-[#172965]"
                />
                <p className="mt-1 text-[10px] text-slate-500">
                  Used for invoices, system emails and KYC follow-ups.
                </p>
              </div>

              <div className="space-y-1">
                <label
                  htmlFor="status"
                  className="text-xs font-medium text-slate-700"
                >
                  Workspace status
                </label>
                <select
                  id="status"
                  name="status"
                  defaultValue={formStatusDefault}
                  className="block w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 outline-none ring-0 focus:border-[#172965] focus:bg-white focus:ring-1 focus:ring-[#172965]"
                >
                  <option value="active">Active</option>
                  <option value="trial">Trial</option>
                  <option value="suspended">Suspended</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              className="inline-flex w-full items-center justify-center rounded-full bg-[#172965] px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-[#0f1c48]"
            >
              {isEditing ? "Save workspace changes" : "Create workspace"}
            </button>
          </form>
        </section>
      </div>

      {/* Existing workspaces – upgraded UI */}
      <section className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">
              Existing workspaces
            </h2>
            <p className="text-[11px] text-slate-500">
              High-level view of every client workspace, including pipeline
              volume and quick shortcuts into jobs, clients and careers sites.
            </p>
          </div>
          <span className="inline-flex items-center rounded-full bg-slate-50 px-3 py-1 text-[10px] font-medium text-slate-600">
            {totalTenants} workspaces • {activeTenants} active •{" "}
            {trialTenants} on trial
          </span>
        </div>

        {tenants.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50 px-6 py-10 text-center text-[11px] text-slate-500">
            <p className="mb-1 font-medium text-slate-700">
              No workspaces yet.
            </p>
            <p>
              Use the form above to create your first client or internal
              workspace.
            </p>
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {tenants.map((tenant) => {
              const label =
                tenant.name || tenant.slug || (tenant.id as string);
              const statusLabel = getStatusLabel(tenant.status);
              const statusClasses = getStatusClasses(tenant.status);

              const jobCount = jobsByTenant.get(tenant.id) ?? 0;
              const clientCount = clientsByTenant.get(tenant.id) ?? 0;
              const candidateCount =
                candidatesByTenant.get(tenant.id) ?? 0;

              const isDefault =
                defaultTenant && defaultTenant.id === tenant.id;

              const locationParts: string[] = [];
              if (tenant.city) locationParts.push(tenant.city);
              if (tenant.state) locationParts.push(tenant.state);
              if (tenant.country) locationParts.push(tenant.country);
              const prettyLocation = locationParts.join(", ");

              const careersUrl =
                tenant.slug && baseDomain
                  ? `https://${tenant.slug}.${baseDomain}/careers`
                  : null;

              return (
                <article
                  key={tenant.id}
                  className="flex flex-col justify-between rounded-xl border border-slate-200 bg-gradient-to-br from-white via-slate-50 to-slate-100/60 p-3 text-[11px] text-slate-700 shadow-sm"
                >
                  <div className="flex items-start gap-3">
                    <TenantLogo src={tenant.logoUrl || null} label={label} />

                    <div className="flex-1 space-y-0.5">
                      <div className="flex flex-wrap items-center gap-1">
                        <span className="text-xs font-semibold text-slate-900">
                          {label}
                        </span>
                        {tenant.slug && (
                          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] text-slate-600">
                            {tenant.slug}
                          </span>
                        )}
                        {isDefault && (
                          <span className="rounded-full bg-[#172965] px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-white">
                            Default
                          </span>
                        )}
                      </div>

                      <div className="mt-0.5 flex flex-wrap items-center gap-2">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ring-1 ${statusClasses}`}
                        >
                          <span className="h-1.5 w-1.5 rounded-full bg-current" />
                          {statusLabel}
                        </span>
                        <span className="text-[10px] text-slate-500">
                          Created {formatDate(tenant.createdAt)}
                        </span>
                      </div>

                      <div className="mt-1 flex flex-wrap items-center gap-3 text-[10px] text-slate-600">
                        {tenant.primaryContactEmail ? (
                          <span>
                            Primary contact:{" "}
                            <span className="font-medium text-slate-800">
                              {tenant.primaryContactEmail}
                            </span>
                          </span>
                        ) : (
                          <span className="italic text-slate-400">
                            No primary contact set
                          </span>
                        )}

                        {tenant.registrationNumber && (
                          <span className="text-slate-500">
                            RC:{" "}
                            <span className="font-medium text-slate-800">
                              {tenant.registrationNumber}
                            </span>
                          </span>
                        )}

                        {tenant.taxId && (
                          <span className="text-slate-500">
                            TIN:{" "}
                            <span className="font-medium text-slate-800">
                              {tenant.taxId}
                            </span>
                          </span>
                        )}

                        {prettyLocation && (
                          <span className="text-slate-500">
                            {prettyLocation}
                          </span>
                        )}

                        {tenant.websiteUrl && (
                          <a
                            href={tenant.websiteUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[#172965] underline-offset-2 hover:underline"
                          >
                            Website
                          </a>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Micro stats + shortcuts */}
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-2">
                    <div className="flex flex-wrap gap-3 text-[10px]">
                      <span className="inline-flex items-center gap-1 rounded-full bg-white px-2 py-0.5 text-slate-700 ring-1 ring-slate-200">
                        <span className="h-1.5 w-1.5 rounded-full bg-[#172965]" />
                        {jobCount} jobs
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-full bg-white px-2 py-0.5 text-slate-700 ring-1 ring-slate-200">
                        <span className="h-1.5 w-1.5 rounded-full bg-[#FFC000]" />
                        {clientCount} clients
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-full bg-white px-2 py-0.5 text-slate-700 ring-1 ring-slate-200">
                        <span className="h-1.5 w-1.5 rounded-full bg-[#306B34]" />
                        {candidateCount} candidates
                      </span>
                    </div>

                    <div className="flex flex-wrap justify-end gap-2">
                      <Link
                        href={`/ats/tenants?editTenantId=${encodeURIComponent(
                          tenant.id,
                        )}#workspace-form`}
                        className="rounded-full bg-slate-50 px-3 py-1 text-[10px] font-medium text-slate-700 hover:bg-slate-100"
                      >
                        Edit workspace
                      </Link>
                      <Link
                        href={`/ats/tenants/${encodeURIComponent(
                          tenant.id,
                        )}/invite-admin`}
                        className="rounded-full bg-slate-50 px-3 py-1 text-[10px] font-medium text-slate-700 hover:bg-slate-100"
                      >
                        Invite admin
                      </Link>
                      <Link
                        href={`/ats/jobs?tenantId=${encodeURIComponent(
                          tenant.id,
                        )}`}
                        className="rounded-full bg-slate-900 px-3 py-1 text-[10px] font-semibold text-white hover:bg-slate-800"
                      >
                        View jobs
                      </Link>
                      <Link
                        href={`/ats/clients?tenantId=${encodeURIComponent(
                          tenant.id,
                        )}`}
                        className="rounded-full bg-slate-50 px-3 py-1 text-[10px] font-medium text-slate-700 hover:bg-slate-100"
                      >
                        View clients
                      </Link>
                      <Link
                        href={`/ats/tenants/${encodeURIComponent(
                          tenant.id,
                        )}/careersite`}
                        className="rounded-full bg-slate-50 px-3 py-1 text-[10px] font-medium text-slate-700 hover:bg-slate-100"
                      >
                        Careers site
                      </Link>
                      {careersUrl && (
                        <CopyCareersUrlButton
                          url={careersUrl}
                          className="rounded-full bg-slate-50 px-3 py-1 text-[10px] font-medium text-slate-700 hover:bg-slate-100"
                        />
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
