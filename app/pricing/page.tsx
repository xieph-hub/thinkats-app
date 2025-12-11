// app/pricing/page.tsx
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Pricing | ThinkATS",
  description:
    "Simple pricing for teams, agencies and platforms that need a modern ATS and career sites engine.",
};

export default function PricingPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-50">
      {/* HERO */}
      <section className="border-b border-slate-900 bg-gradient-to-br from-slate-950 via-slate-950 to-[#172965]/40">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-sky-300">
            Pricing
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-50 sm:text-4xl">
            Pricing that matches how teams actually hire.
          </h1>
          <p className="mt-3 max-w-2xl text-sm text-slate-300">
            ThinkATS combines ATS pipelines, multi-tenant workspaces and
            branded career sites in one platform. Choose a plan that fits your
            current hiring volume and grow without rebuilding your stack.
          </p>

          <div className="mt-5 flex flex-wrap items-center gap-3 text-[11px] text-slate-300">
            <span className="inline-flex items-center rounded-full border border-slate-800 bg-slate-950/70 px-3 py-1">
              Pricing in USD · billed annually
            </span>
            <span className="inline-flex items-center rounded-full border border-slate-800 bg-slate-950/70 px-3 py-1">
              Regional pricing for Africa &amp; Asia available
            </span>
          </div>
        </div>
      </section>

      {/* PLAN CARDS */}
      <section className="border-b border-slate-900 bg-slate-950/90">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-sky-300">
                Plans
              </p>
              <h2 className="mt-1 text-xl font-semibold tracking-tight text-slate-50 sm:text-2xl">
                Start lean, then add tenants and jobs as you grow.
              </h2>
            </div>
            <p className="max-w-md text-[12px] text-slate-400">
              All plans include ATS pipelines, a branded career experience and
              secure application handling. The main differences are recruiter
              seats, active jobs and how many tenants or brands you can run.
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-3">
            {/* Launch */}
            <div className="flex flex-col rounded-2xl border border-slate-800 bg-slate-900/80 p-6 text-xs text-slate-200">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                Launch
              </p>
              <h3 className="mt-2 text-sm font-semibold text-slate-50">
                For a single team or brand
              </h3>
              <p className="mt-3 flex items-baseline gap-1">
                <span className="text-2xl font-semibold text-slate-50">
                  $59
                </span>
                <span className="text-[11px] text-slate-400">
                  / month <span className="text-slate-500">(billed yearly)</span>
                </span>
              </p>
              <p className="mt-2 text-[12px] text-slate-300">
                A focused setup for one hiring team that wants to move off
                spreadsheets and job boards without taking on a huge HR stack.
              </p>
              <ul className="mt-4 space-y-1.5 text-[11px] text-slate-200">
                <li>• Up to 2 recruiters</li>
                <li>• Up to 10 active jobs</li>
                <li>• 1 tenant / brand</li>
                <li>• Branded jobs hub &amp; job pages</li>
                <li>• CV-first application flow</li>
                <li>• Email support</li>
              </ul>
              <div className="mt-5">
                <Link
                  href="/contact?plan=launch"
                  className="inline-flex w-full items-center justify-center rounded-full border border-sky-500 bg-sky-500 px-4 py-2 text-[11px] font-semibold text-slate-950 shadow-md shadow-sky-500/30 hover:bg-sky-400"
                >
                  Talk to us about Launch
                </Link>
              </div>
            </div>

            {/* Studio (highlighted) */}
            <div className="relative flex flex-col rounded-2xl border border-sky-500 bg-slate-900 px-6 py-7 text-xs text-slate-200 shadow-[0_0_0_1px_rgba(56,189,248,0.4)]">
              <div className="absolute -top-3 right-4 rounded-full bg-sky-500 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-950 shadow-md shadow-sky-500/40">
                Most used
              </div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-sky-300">
                Studio
              </p>
              <h3 className="mt-2 text-sm font-semibold text-slate-50">
                For agencies &amp; busy in-house teams
              </h3>
              <p className="mt-3 flex items-baseline gap-1">
                <span className="text-2xl font-semibold text-slate-50">
                  $129
                </span>
                <span className="text-[11px] text-slate-400">
                  / month <span className="text-slate-500">(billed yearly)</span>
                </span>
              </p>
              <p className="mt-2 text-[12px] text-slate-300">
                Run multiple roles and brands from one engine. Enough structure
                for serious recruiting, without drowning in admin.
              </p>
              <ul className="mt-4 space-y-1.5 text-[11px] text-slate-200">
                <li>• Up to 5 recruiters</li>
                <li>• Up to 30 active jobs</li>
                <li>• Up to 3 tenants / brands</li>
                <li>• Branded hubs for each tenant</li>
                <li>• Shared candidate pool across roles</li>
                <li>• Basic reporting by tenant</li>
                <li>• Priority email support</li>
              </ul>
              <div className="mt-5">
                <Link
                  href="/contact?plan=studio"
                  className="inline-flex w-full items-center justify-center rounded-full bg-sky-500 px-4 py-2 text-[11px] font-semibold text-slate-950 shadow-md shadow-sky-500/40 hover:bg-sky-400"
                >
                  Explore Studio for your team
                </Link>
              </div>
            </div>

            {/* Network */}
            <div className="flex flex-col rounded-2xl border border-slate-800 bg-slate-900/80 p-6 text-xs text-slate-200">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                Network
              </p>
              <h3 className="mt-2 text-sm font-semibold text-slate-50">
                For multi-client and group setups
              </h3>
              <p className="mt-3 flex items-baseline gap-1">
                <span className="text-2xl font-semibold text-slate-50">
                  $249
                </span>
                <span className="text-[11px] text-slate-400">
                  / month <span className="text-slate-500">(billed yearly)</span>
                </span>
              </p>
              <p className="mt-2 text-[12px] text-slate-300">
                Designed for agencies, group structures and platforms that run
                hiring for multiple clients or entities on one engine.
              </p>
              <ul className="mt-4 space-y-1.5 text-[11px] text-slate-200">
                <li>• Up to 10 recruiters</li>
                <li>• Up to 75 active jobs</li>
                <li>• Up to 8 tenants / brands</li>
                <li>• Tenant &amp; client-level overviews</li>
                <li>• Shared templates and workflows</li>
                <li>• Priority support &amp; guided onboarding</li>
              </ul>
              <div className="mt-5">
                <Link
                  href="/contact?plan=network"
                  className="inline-flex w-full items-center justify-center rounded-full border border-slate-700 px-4 py-2 text-[11px] font-semibold text-slate-50 hover:border-sky-400 hover:text-sky-100"
                >
                  Discuss Network with us
                </Link>
              </div>
            </div>
          </div>

          {/* Enterprise + regional note */}
          <div className="mt-8 flex flex-col gap-4 text-[11px] text-slate-400 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-1 max-w-xl">
              <p className="font-semibold text-slate-200">
                Enterprise &amp; group-wide deployments
              </p>
              <p>
                For larger groups, B2B platforms or high-volume agencies that
                need more tenants, deeper integrations or custom SLAs, ThinkATS
                can be deployed as a dedicated environment with tailored
                limits, onboarding and support.
              </p>
            </div>
            <div className="space-y-2">
              <p>
                <span className="rounded-full border border-slate-800 bg-slate-900/70 px-3 py-1">
                  Local currency invoicing for Africa &amp; Asia available on
                  request
                </span>
              </p>
              <p className="text-right lg:text-left">
                <Link
                  href="/contact?plan=enterprise"
                  className="font-semibold text-sky-300 hover:text-sky-200 hover:underline"
                >
                  Talk to us about enterprise →
                </Link>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURE HIGHLIGHTS / COMPARISON */}
      <section className="bg-slate-950">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="mb-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-sky-300">
              What&apos;s included
            </p>
            <h2 className="mt-1 text-lg font-semibold tracking-tight text-slate-50">
              Every plan includes the core ThinkATS engine.
            </h2>
            <p className="mt-2 max-w-2xl text-[12px] text-slate-400">
              Plans differ by scale, not by core capabilities. From the first
              role you publish, you get a proper ATS, job pages and a career
              experience that feels modern.
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-3 text-[11px]">
            <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4">
              <h3 className="text-xs font-semibold text-slate-50">
                ATS &amp; pipelines
              </h3>
              <ul className="mt-3 space-y-1.5 text-slate-300">
                <li>• Per-job pipelines from applied to hired</li>
                <li>• Custom stages per role</li>
                <li>• Single candidate view across jobs</li>
                <li>• Notes, status and basic activity history</li>
              </ul>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4">
              <h3 className="text-xs font-semibold text-slate-50">
                Career sites &amp; applications
              </h3>
              <ul className="mt-3 space-y-1.5 text-slate-300">
                <li>• Tenant-branded jobs hub and job pages</li>
                <li>• Public listing with filters</li>
                <li>• CV-first application flow with secure storage</li>
                <li>• Clean application experience on desktop &amp; mobile</li>
              </ul>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4">
              <h3 className="text-xs font-semibold text-slate-50">
                Multi-tenant &amp; insight
              </h3>
              <ul className="mt-3 space-y-1.5 text-slate-300">
                <li>• Tenant-aware jobs and candidates</li>
                <li>• Support for agencies &amp; group structures</li>
                <li>• Basic overviews by tenant / client</li>
                <li>• Export-friendly views for leadership updates</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="border-t border-slate-900 bg-slate-950/95">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="mb-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-sky-300">
              FAQ
            </p>
            <h2 className="mt-1 text-lg font-semibold tracking-tight text-slate-50">
              Common questions about pricing.
            </h2>
          </div>

          <div className="grid gap-5 md:grid-cols-2 text-[12px] text-slate-300">
            <div className="space-y-2">
              <h3 className="text-[12px] font-semibold text-slate-50">
                How does regional pricing work?
              </h3>
              <p>
                Pricing is set in USD, but teams in Africa, India and other
                parts of Asia can request local-currency invoicing and adjusted
                rates that reflect their market. The underlying product and
                support levels stay the same.
              </p>
            </div>

            <div className="space-y-2">
              <h3 className="text-[12px] font-semibold text-slate-50">
                What happens if we outgrow our plan?
              </h3>
              <p>
                If you cross the limits on recruiter seats, active jobs or
                tenants, you can move up to the next plan with a simple
                adjustment. Existing data, career sites and pipelines stay
                intact.
              </p>
            </div>

            <div className="space-y-2">
              <h3 className="text-[12px] font-semibold text-slate-50">
                Do you charge per candidate?
              </h3>
              <p>
                No. Plans are based on the number of recruiters, active jobs
                and tenants or brands you run — not how many candidates apply.
                The goal is to help you bring more good candidates in, not to
                penalise you for volume.
              </p>
            </div>

            <div className="space-y-2">
              <h3 className="text-[12px] font-semibold text-slate-50">
                Can we start small with one tenant, then add more?
              </h3>
              <p>
                Yes. Many teams start on Launch or Studio with a single tenant,
                then add extra tenants as they begin to run hiring for new
                brands, clients or business units. The multi-tenant model is
                built in from day one.
              </p>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-between gap-3 text-[11px] text-slate-300">
            <p>
              Still unsure which plan fits best? A short conversation usually
              clears it up.
            </p>
            <Link
              href="/contact"
              className="inline-flex items-center rounded-full bg-sky-500 px-4 py-2 font-semibold text-slate-950 hover:bg-sky-400"
            >
              Talk to the ThinkATS team →
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
