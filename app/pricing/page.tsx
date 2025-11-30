// app/pricing/page.tsx
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Pricing | ThinkATS",
  description:
    "Simple, transparent pricing as you grow from a single tenant to multiple client accounts.",
};

export default function PricingPage() {
  return (
    <main className="bg-slate-50">
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#172965]">
            Pricing
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
            Start small, scale as you add tenants.
          </h1>
          <p className="mt-3 max-w-2xl text-sm text-slate-700">
            ThinkATS is being shaped around real agencies and in-house teams.
            These pricing tiers are placeholders until you&apos;re ready to
            publish final numbers.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid gap-6 md:grid-cols-3">
          {/* Tier 1 */}
          <div className="flex flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
              Starter
            </p>
            <h2 className="mt-2 text-xl font-semibold text-slate-900">
              For single teams
            </h2>
            <p className="mt-2 text-xs text-slate-600">
              One tenant, one careers site and all the core ATS features to run
              your first serious hires.
            </p>
            <p className="mt-4 text-2xl font-semibold text-[#172965]">
              TBD<span className="text-sm font-normal text-slate-500">/month</span>
            </p>
            <ul className="mt-4 flex-1 space-y-1.5 text-[11px] text-slate-600">
              <li>• 1 tenant</li>
              <li>• 1 career site</li>
              <li>• Unlimited jobs &amp; candidates</li>
              <li>• Core email notifications</li>
            </ul>
            <Link
              href="/signup"
              className="mt-4 inline-flex items-center justify-center rounded-full bg-[#172965] px-4 py-2 text-xs font-semibold text-white hover:bg-[#0f1c48]"
            >
              Get started
            </Link>
          </div>

          {/* Tier 2 */}
          <div className="flex flex-col rounded-2xl border-2 border-[#172965] bg-white p-5 shadow-sm">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-[#172965]">
              Most likely
            </p>
            <h2 className="mt-2 text-xl font-semibold text-slate-900">
              Agencies &amp; studios
            </h2>
            <p className="mt-2 text-xs text-slate-600">
              Multiple client tenants, per-client pipelines and stronger
              reporting for partners and leadership.
            </p>
            <p className="mt-4 text-2xl font-semibold text-[#172965]">
              TBD<span className="text-sm font-normal text-slate-500">/month</span>
            </p>
            <ul className="mt-4 flex-1 space-y-1.5 text-[11px] text-slate-600">
              <li>• Up to X tenants</li>
              <li>• Per-tenant career sites</li>
              <li>• Advanced ATS views &amp; filters</li>
              <li>• Email templates &amp; branding</li>
            </ul>
            <Link
              href="/signup"
              className="mt-4 inline-flex items-center justify-center rounded-full bg-[#172965] px-4 py-2 text-xs font-semibold text-white hover:bg-[#0f1c48]"
            >
              Talk to us
            </Link>
          </div>

          {/* Tier 3 */}
          <div className="flex flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
              Enterprise
            </p>
            <h2 className="mt-2 text-xl font-semibold text-slate-900">
              Custom deployments
            </h2>
            <p className="mt-2 text-xs text-slate-600">
              You need custom data flows, SSO or tighter integration with your
              existing tools.
            </p>
            <p className="mt-4 text-xl font-semibold text-[#172965]">
              Let&apos;s scope it
            </p>
            <ul className="mt-4 flex-1 space-y-1.5 text-[11px] text-slate-600">
              <li>• Higher tenant and user limits</li>
              <li>• Dedicated support &amp; onboarding</li>
              <li>• Advanced security &amp; compliance</li>
              <li>• Roadmap input for your use case</li>
            </ul>
            <Link
              href="/signup"
              className="mt-4 inline-flex items-center justify-center rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800"
            >
              Contact sales
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
