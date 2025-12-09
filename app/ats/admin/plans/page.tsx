// app/ats/admin/plans/page.tsx
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { getServerUser } from "@/lib/auth/getServerUser";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "ThinkATS | Admin · Client plans",
  description:
    "Manually upgrade or downgrade client workspaces between plan tiers.",
};

const PLAN_LABELS: Record<string, string> = {
  STARTER: "Starter",
  GROWTH: "Growth",
  AGENCY: "Agency",
  ENTERPRISE: "Enterprise",
};

export default async function AdminPlansPage() {
  const { isSuperAdmin } = await getServerUser();

  if (!isSuperAdmin) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
          ATS · Admin
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
          Client plans &amp; tiers
        </h1>
        <p className="mt-3 text-sm text-slate-600">
          This area is only available to ThinkATS super admins. Ask your admin
          to grant you access if you need to manage client plans.
        </p>
      </div>
    );
  }

  const tenants = await prisma.tenant.findMany({
    orderBy: { name: "asc" },
  });

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 lg:px-8">
      {/* Header */}
      <header className="space-y-2">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
          ATS · Admin
        </p>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
          Client plans &amp; tiers
        </h1>
        <p className="text-sm text-slate-500">
          Manually upgrade or downgrade client workspaces between Free, Pro and
          Enterprise. This controls access to NLP scoring and other premium
          features.
        </p>
      </header>

      <section className="mt-6 space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-[11px] text-slate-500">
          Changes apply immediately and flow through to feature gating and seat
          limits in each workspace. All updates are routed via{" "}
          <code className="rounded bg-slate-50 px-1 py-0.5 text-[10px]">
            /api/ats/settings/billing
          </code>
          .
        </p>

        <div className="mt-4 divide-y divide-slate-100">
          {tenants.map((tenant) => {
            const tAny = tenant as any;
            const planTier: string = (tAny.planTier as string) || "GROWTH";
            const planLabel =
              PLAN_LABELS[planTier] ||
              tAny.planName ||
              tAny.plan ||
              "Growth";

            const seats: number | "" =
              typeof tAny.seats === "number" ? tAny.seats : "";
            const maxSeats: number | "" =
              typeof tAny.maxSeats === "number" ? tAny.maxSeats : "";

            const displayName =
              tenant.name || tAny.slug || tenant.id.slice(0, 8);

            return (
              <form
                key={tenant.id}
                method="POST"
                action="/api/ats/settings/billing"
                className="grid gap-3 py-4 text-[11px] md:grid-cols-[minmax(0,2.3fr)_minmax(0,1.2fr)_minmax(0,1.2fr)_auto] md:items-center"
              >
                <input type="hidden" name="tenantId" value={tenant.id} />

                {/* Tenant identity */}
                <div className="space-y-1">
                  <p className="text-[12px] font-semibold text-slate-900">
                    {displayName}
                  </p>
                  <p className="text-[10px] text-slate-500">
                    ID:{" "}
                    <span className="font-mono text-[10px] text-slate-600">
                      {tenant.id}
                    </span>
                  </p>
                </div>

                {/* Plan tier */}
                <div className="space-y-1">
                  <label
                    htmlFor={`planTier-${tenant.id}`}
                    className="block text-[10px] font-medium text-slate-600"
                  >
                    Plan tier
                  </label>
                  <select
                    id={`planTier-${tenant.id}`}
                    name="planTier"
                    defaultValue={planTier}
                    className="block w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-[11px] text-slate-900 outline-none focus:border-[#172965] focus:bg-white focus:ring-1 focus:ring-[#172965]"
                  >
                    <option value="STARTER">Starter</option>
                    <option value="GROWTH">Growth</option>
                    <option value="AGENCY">Agency</option>
                    <option value="ENTERPRISE">Enterprise</option>
                  </select>
                  <p className="text-[10px] text-slate-400">
                    Currently: <span className="font-medium">{planLabel}</span>
                  </p>
                </div>

                {/* Seats */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label
                      htmlFor={`seats-${tenant.id}`}
                      className="block text-[10px] font-medium text-slate-600"
                    >
                      Seats (committed)
                    </label>
                    <input
                      id={`seats-${tenant.id}`}
                      name="seats"
                      type="number"
                      min={0}
                      defaultValue={seats}
                      placeholder="e.g. 5"
                      className="block w-full rounded-md border border-slate-200 bg-slate-50 px-2 py-1.5 text-[11px] text-slate-900 outline-none focus:border-[#172965] focus:bg-white focus:ring-1 focus:ring-[#172965]"
                    />
                  </div>
                  <div className="space-y-1">
                    <label
                      htmlFor={`maxSeats-${tenant.id}`}
                      className="block text-[10px] font-medium text-slate-600"
                    >
                      Seat limit
                    </label>
                    <input
                      id={`maxSeats-${tenant.id}`}
                      name="maxSeats"
                      type="number"
                      min={0}
                      defaultValue={maxSeats}
                      placeholder="e.g. 10"
                      className="block w-full rounded-md border border-slate-200 bg-slate-50 px-2 py-1.5 text-[11px] text-slate-900 outline-none focus:border-[#172965] focus:bg-white focus:ring-1 focus:ring-[#172965]"
                    />
                  </div>
                </div>

                {/* Save */}
                <div className="flex items-center justify-end">
                  <button
                    type="submit"
                    className="inline-flex items-center rounded-full bg-[#172965] px-4 py-2 text-[11px] font-semibold text-white shadow-sm hover:bg-[#12204d]"
                  >
                    Save
                  </button>
                </div>
              </form>
            );
          })}
        </div>
      </section>
    </div>
  );
}
