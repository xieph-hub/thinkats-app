// app/ats/admin/tenants/page.tsx
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getServerUser } from "@/lib/auth/getServerUser";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Tenants & workspaces | ThinkATS",
  description:
    "Super admin view of all tenants, with tools to create workspaces and invite owners.",
};

const PLAN_LABELS: Record<string, string> = {
  STARTER: "Starter",
  GROWTH: "Growth",
  AGENCY: "Agency",
  ENTERPRISE: "Enterprise",
};

function formatPlanLabel(planTier: string | null | undefined) {
  if (!planTier) return "Starter";
  const upper = planTier.toUpperCase();
  return PLAN_LABELS[upper] ?? planTier;
}

export default async function AdminTenantsPage() {
  const ctx = await getServerUser();

  // 🔐 Super admin gate – only SUPER_ADMIN sees this
  if (!ctx || !ctx.isSuperAdmin) {
    notFound();
  }

  // Optional: you can still read the underlying user if needed
  const { user } = ctx;

  const tenants = await prisma.tenant.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      slug: true,
      primaryContactEmail: true,
      planTier: true,
      seats: true,
      maxSeats: true,
      maxOpenJobs: true,
      defaultTimezone: true,
      defaultCurrency: true,
      status: true,
      createdAt: true,
    },
  });

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-6 lg:px-8">
      {/* Header */}
      <header className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
            Admin · Tenants
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">
            Tenants & workspaces
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Create new ATS workspaces, assign plans and invite owners. This
            surface is visible only to ThinkATS super admins.
          </p>
        </div>

        {user?.email && (
          <div className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-[11px] text-emerald-800">
            Signed in as <span className="font-medium">{user.email}</span> ·
            Super admin
          </div>
        )}
      </header>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        {/* LEFT: Tenants table */}
        <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">
                Existing workspaces
              </h2>
              <p className="mt-1 text-xs text-slate-500">
                High-level overview of all tenants currently active in your
                ThinkATS environment.
              </p>
            </div>
            <span className="rounded-full bg-slate-50 px-3 py-1 text-[11px] text-slate-600">
              {tenants.length} tenant{tenants.length === 1 ? "" : "s"}
            </span>
          </div>

          <div className="overflow-hidden rounded-xl border border-slate-100">
            <div className="max-h-[420px] overflow-auto">
              <table className="min-w-full border-collapse text-xs">
                <thead className="bg-slate-50 text-[11px] uppercase tracking-[0.14em] text-slate-500">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium">Workspace</th>
                    <th className="px-3 py-2 text-left font-medium">Plan</th>
                    <th className="px-3 py-2 text-left font-medium">Seats</th>
                    <th className="px-3 py-2 text-left font-medium">Open jobs</th>
                    <th className="px-3 py-2 text-left font-medium">
                      Timezone / currency
                    </th>
                    <th className="px-3 py-2 text-left font-medium">Status</th>
                    <th className="px-3 py-2 text-left font-medium">Created</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {tenants.map((t) => (
                    <tr key={t.id} className="hover:bg-slate-50/60">
                      <td className="px-3 py-2 align-top">
                        <div className="max-w-[220px]">
                          <div className="truncate text-[11px] font-semibold text-slate-900">
                            {t.name || "Untitled workspace"}
                          </div>
                          <div className="mt-0.5 truncate text-[10px] text-slate-500">
                            {t.slug
                              ? `${t.slug}.thinkats.com`
                              : `tenant_${t.id.slice(0, 8)}`}
                          </div>
                          {t.primaryContactEmail && (
                            <div className="mt-0.5 truncate text-[10px] text-slate-500">
                              {t.primaryContactEmail}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-2 align-top">
                        <span className="inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-700">
                          {formatPlanLabel(t.planTier)}
                        </span>
                      </td>
                      <td className="px-3 py-2 align-top text-[11px] text-slate-700">
                        {t.seats ?? 0}/{t.maxSeats ?? 0}
                      </td>
                      <td className="px-3 py-2 align-top text-[11px] text-slate-700">
                        {t.maxOpenJobs ?? 0}
                      </td>
                      <td className="px-3 py-2 align-top text-[11px] text-slate-700">
                        <div>
                          {t.defaultTimezone || "Africa/Lagos"}
                          <span className="mx-1 text-slate-400">·</span>
                          {t.defaultCurrency || "USD"}
                        </div>
                      </td>
                      <td className="px-3 py-2 align-top">
                        <span
                          className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium ${
                            t.status === "active"
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {t.status}
                        </span>
                      </td>
                      <td className="px-3 py-2 align-top text-[10px] text-slate-500">
                        {t.createdAt.toISOString().slice(0, 10)}
                      </td>
                    </tr>
                  ))}

                  {tenants.length === 0 && (
                    <tr>
                      <td
                        colSpan={7}
                        className="px-3 py-6 text-center text-[11px] text-slate-500"
                      >
                        No tenants found yet. Use the form on the right to create
                        your first workspace.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <p className="text-[10px] text-slate-500">
            Seats and job limits are enforced at the API layer via{" "}
            <code className="rounded bg-slate-50 px-1 py-0.5">
              planTier / seats / maxOpenJobs
            </code>{" "}
            on <code className="rounded bg-slate-50 px-1 py-0.5">Tenant</code>.
          </p>
        </section>

        {/* RIGHT: Create workspace + Invite owner */}
        <section className="space-y-4">
          {/* Create workspace card */}
          <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="text-sm font-semibold text-slate-900">
              Create workspace
            </h2>
            <p className="text-xs text-slate-500">
              Spin up a new tenant with a default plan, limits and timezone. You
              can always adjust the plan later in billing.
            </p>

            <form
              method="POST"
              action="/api/ats/admin/workspaces"
              className="space-y-3 text-xs"
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
                  placeholder="Acme Talent Partners"
                  className="mt-1 block w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 outline-none ring-0 placeholder:text-slate-400 focus:border-[#172965] focus:bg-white focus:ring-1 focus:ring-[#172965]"
                />
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
                    https://
                  </span>
                  <input
                    id="slug"
                    name="slug"
                    required
                    placeholder="acme-talent"
                    className="block flex-1 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 outline-none ring-0 placeholder:text-slate-400 focus:border-[#172965] focus:bg-white focus:ring-1 focus:ring-[#172965]"
                  />
                  <span className="rounded-md bg-slate-50 px-2 py-1 text-[11px] text-slate-500">
                    .thinkats.com
                  </span>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="planTier"
                    className="block text-[11px] font-medium text-slate-700"
                  >
                    Plan
                  </label>
                  <select
                    id="planTier"
                    name="planTier"
                    defaultValue="STARTER"
                    className="mt-1 block w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 outline-none focus:border-[#172965] focus:bg-white focus:ring-1 focus:ring-[#172965]"
                  >
                    <option value="STARTER">Starter</option>
                    <option value="GROWTH">Growth</option>
                    <option value="AGENCY">Agency</option>
                    <option value="ENTERPRISE">Enterprise</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label
                      htmlFor="seats"
                      className="block text-[11px] font-medium text-slate-700"
                    >
                      Seats
                    </label>
                    <input
                      id="seats"
                      name="seats"
                      type="number"
                      min={1}
                      defaultValue={3}
                      className="mt-1 block w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 outline-none focus:border-[#172965] focus:bg-white focus:ring-1 focus:ring-[#172965]"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="maxOpenJobs"
                      className="block text-[11px] font-medium text-slate-700"
                    >
                      Max open jobs
                    </label>
                    <input
                      id="maxOpenJobs"
                      name="maxOpenJobs"
                      type="number"
                      min={1}
                      defaultValue={10}
                      className="mt-1 block w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 outline-none focus:border-[#172965] focus:bg-white focus:ring-1 focus:ring-[#172965]"
                    />
                  </div>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="defaultTimezone"
                    className="block text-[11px] font-medium text-slate-700"
                  >
                    Default timezone
                  </label>
                  <input
                    id="defaultTimezone"
                    name="defaultTimezone"
                    defaultValue="Africa/Lagos"
                    className="mt-1 block w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 outline-none focus:border-[#172965] focus:bg-white focus:ring-1 focus:ring-[#172965]"
                  />
                </div>
                <div>
                  <label
                    htmlFor="defaultCurrency"
                    className="block text-[11px] font-medium text-slate-700"
                  >
                    Default currency
                  </label>
                  <input
                    id="defaultCurrency"
                    name="defaultCurrency"
                    defaultValue="USD"
                    className="mt-1 block w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 outline-none focus:border-[#172965] focus:bg-white focus:ring-1 focus:ring-[#172965]"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="ownerEmail"
                  className="block text-[11px] font-medium text-slate-700"
                >
                  Primary owner email (optional)
                </label>
                <input
                  id="ownerEmail"
                  name="ownerEmail"
                  type="email"
                  placeholder="founder@acme.com"
                  className="mt-1 block w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 outline-none focus:border-[#172965] focus:bg-white focus:ring-1 focus:ring-[#172965]"
                />
                <p className="mt-1 text-[10px] text-slate-500">
                  If provided, you can immediately send an owner invitation from
                  the panel below.
                </p>
              </div>

              <div className="pt-1">
                <button
                  type="submit"
                  className="inline-flex items-center rounded-md bg-[#172965] px-4 py-2 text-[11px] font-semibold text-white shadow-sm hover:bg-[#12204d]"
                >
                  Create workspace
                </button>
              </div>
            </form>
          </div>

          {/* Invite owner card */}
          <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-900 p-4 text-slate-50 shadow-sm">
            <h2 className="text-sm font-semibold">Invite workspace owner</h2>
            <p className="text-[11px] text-slate-200/90">
              Send an owner-level invite for an existing tenant. This uses the{" "}
              <code className="rounded bg-slate-800 px-1 py-0.5 text-[10px]">
                TenantInvitation
              </code>{" "}
              model under the hood.
            </p>

            <form
              method="POST"
              action="/api/ats/tenants/owner-invite"
              className="space-y-3 text-xs"
            >
              <div>
                <label
                  htmlFor="tenantId"
                  className="block text-[11px] font-medium text-slate-100"
                >
                  Workspace
                </label>
                <select
                  id="tenantId"
                  name="tenantId"
                  className="mt-1 block w-full rounded-md border border-slate-600 bg-slate-950/40 px-3 py-2 text-xs text-slate-50 outline-none focus:border-[#FFC000] focus:ring-1 focus:ring-[#FFC000]"
                >
                  {tenants.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name || "Untitled"}{" "}
                      {t.slug ? `(${t.slug}.thinkats.com)` : ""}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="email"
                  className="block text-[11px] font-medium text-slate-100"
                >
                  Owner email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  placeholder="owner@workspace.com"
                  className="mt-1 block w-full rounded-md border border-slate-600 bg-slate-950/40 px-3 py-2 text-xs text-slate-50 outline-none placeholder:text-slate-500 focus:border-[#FFC000] focus:ring-1 focus:ring-[#FFC000]"
                />
              </div>

              <div>
                <label
                  htmlFor="role"
                  className="block text-[11px] font-medium text-slate-100"
                >
                  Role
                </label>
                <select
                  id="role"
                  name="role"
                  defaultValue="owner"
                  className="mt-1 block w-full rounded-md border border-slate-600 bg-slate-950/40 px-3 py-2 text-xs text-slate-50 outline-none focus:border-[#FFC000] focus:ring-1 focus:ring-[#FFC000]"
                >
                  <option value="owner">Owner</option>
                  <option value="admin">Admin</option>
                  <option value="recruiter">Recruiter</option>
                  <option value="viewer">Viewer</option>
                </select>
              </div>

              <div className="pt-1">
                <button
                  type="submit"
                  className="inline-flex items-center rounded-md bg-[#FFC000] px-4 py-2 text-[11px] font-semibold text-slate-950 shadow-sm hover:bg-[#e6ad00]"
                >
                  Send invite
                </button>
              </div>
            </form>

            <p className="text-[10px] text-slate-300/90">
              Invites create a hashed token in{" "}
              <code className="rounded bg-slate-800 px-1 py-0.5 text-[10px]">
                tenant_invitations
              </code>{" "}
              and send an email via Resend (if configured).
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
