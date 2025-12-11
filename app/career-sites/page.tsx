// app/career-sites/page.tsx
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Career sites engine | ThinkATS",
  description:
    "Launch modern, branded career sites on clean subdomains or client domains – powered directly by ThinkATS.",
};

export default function CareerSitesPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-50">
      {/* HERO */}
      <section className="border-b border-slate-800 bg-gradient-to-br from-slate-950 via-slate-950 to-sky-900/20">
        <div className="mx-auto flex max-w-6xl flex-col gap-10 px-4 py-14 sm:px-6 lg:px-8 lg:flex-row lg:items-center">
          {/* Left copy */}
          <div className="max-w-xl space-y-4">
            <p className="inline-flex items-center gap-2 rounded-full border border-slate-800 bg-slate-900/70 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-300">
              <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-emerald-400/10 text-[10px] text-emerald-300">
                ●
              </span>
              Career sites engine
            </p>
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              Turn every mandate into a{" "}
              <span className="text-sky-300">world-class career site.</span>
            </h1>
            <p className="text-sm text-slate-300">
              ThinkATS publishes your live roles, rich job pages and application
              flows to clean, branded career sites – for each client, business
              unit or partner – without plugins, spreadsheets or copy-paste.
            </p>

            <div className="mt-4 flex flex-wrap items-center gap-3 text-sm">
              <Link
                href="/contact"
                className="inline-flex items-center rounded-full bg-sky-500 px-5 py-2 text-[12px] font-semibold text-slate-950 shadow-sm hover:bg-sky-400"
              >
                Talk to us about career sites
              </Link>
              <Link
                href="/jobs"
                className="text-[12px] font-medium text-sky-300 hover:underline"
              >
                View a live jobs hub example →
              </Link>
            </div>

            <p className="mt-3 text-[11px] text-slate-400">
              Built for recruitment agencies, in-house HR &amp; People teams,
              talent platforms and any team that runs hiring for multiple
              organisations.
            </p>
          </div>

          {/* Right: visual mock of a careers hub */}
          <div className="flex-1">
            <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 text-xs text-slate-200 shadow-xl">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-sky-500/10 text-[11px] font-semibold text-sky-300">
                    AC
                  </div>
                  <div>
                    <p className="text-[11px] font-medium text-slate-50">
                      Acme Collective
                    </p>
                    <p className="text-[10px] text-slate-500">
                      careers.acme.thinkats.com
                    </p>
                  </div>
                </div>
                <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-300">
                  Live career site
                </span>
              </div>

              <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-950/60">
                <div className="border-b border-slate-800/80 bg-slate-950/90 px-4 py-3">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                    Jobs hub
                  </p>
                  <p className="text-sm font-semibold text-slate-50">
                    Join the team that builds meaningful products.
                  </p>
                  <p className="mt-1 text-[11px] text-slate-400">
                    Showing 4 open roles across Product, Operations and
                    Commercial.
                  </p>
                </div>
                <div className="grid gap-3 p-4 md:grid-cols-2">
                  <div className="rounded-lg border border-slate-800 bg-slate-900/80 p-3">
                    <p className="text-[11px] font-semibold text-slate-50">
                      Senior Product Manager
                    </p>
                    <p className="mt-1 text-[11px] text-slate-400">
                      Remote · Full-time
                    </p>
                    <p className="mt-2 line-clamp-2 text-[11px] text-slate-400">
                      Lead discovery, roadmapping and delivery across a portfolio
                      of B2B products.
                    </p>
                  </div>
                  <div className="rounded-lg border border-slate-800 bg-slate-900/80 p-3">
                    <p className="text-[11px] font-semibold text-slate-50">
                      Commercial Lead, Growth Markets
                    </p>
                    <p className="mt-1 text-[11px] text-slate-400">
                      Lagos · Hybrid
                    </p>
                    <p className="mt-2 line-clamp-2 text-[11px] text-slate-400">
                      Own pipeline, partnerships and account strategy for key
                      markets.
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between border-t border-slate-800/80 bg-slate-950/80 px-4 py-2 text-[11px] text-slate-400">
                  <span>Clean, candidate-friendly surface. Data stays in your ATS.</span>
                  <span className="hidden rounded-full bg-slate-900 px-2 py-0.5 text-[10px] text-slate-300 md:inline-flex">
                    Powered by ThinkATS
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CORE BENEFITS */}
      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-6 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 text-xs text-slate-200 shadow-sm">
            <h2 className="text-sm font-semibold text-slate-50">
              Enterprise-grade job listing
            </h2>
            <p className="mt-2 text-[12px] text-slate-300">
              Candidates can browse roles, filter by location or function and
              instantly understand what you&apos;re hiring for across clients or
              business units.
            </p>
            <ul className="mt-3 space-y-1.5 text-[11px] text-slate-300">
              <li>• Search and filters tuned for live roles</li>
              <li>• Clear “open / closed / upcoming” indicators</li>
              <li>• Consistent metadata across every job</li>
            </ul>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 text-xs text-slate-200 shadow-sm">
            <h2 className="text-sm font-semibold text-slate-50">
              Rich, structured job pages
            </h2>
            <p className="mt-2 text-[12px] text-slate-300">
              Role overview, responsibilities, requirements and benefits are
              presented in a structured layout that feels like a modern product
              page, not a dumped JD.
            </p>
            <ul className="mt-3 space-y-1.5 text-[11px] text-slate-300">
              <li>• Role snapshot with location, team and work style</li>
              <li>• Clean typography optimised for scanning</li>
              <li>• Built-in sharing links for candidates and referrers</li>
            </ul>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 text-xs text-slate-200 shadow-sm">
            <h2 className="text-sm font-semibold text-slate-50">
              Frictionless, ATS-native applications
            </h2>
            <p className="mt-2 text-[12px] text-slate-300">
              Short, focused application forms. Every submission becomes a
              candidate and application record in your pipelines – no syncing or
              importing.
            </p>
            <ul className="mt-3 space-y-1.5 text-[11px] text-slate-300">
              <li>• CV upload with secure storage</li>
              <li>• Custom screening questions per role</li>
              <li>• Automatic creation of candidates &amp; applications</li>
            </ul>
          </div>
        </div>
      </section>

      {/* FOR WHOM / DOMAINS */}
      <section className="mx-auto max-w-6xl px-4 pb-12 sm:px-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.3fr),minmax(0,1fr)]">
          {/* Who benefits */}
          <div className="space-y-4 rounded-2xl border border-slate-800 bg-slate-900/70 p-5 text-xs text-slate-200 shadow-sm">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
              Built for multi-client teams
            </p>
            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <p className="text-[11px] font-semibold text-slate-100">
                  Recruitment agencies
                </p>
                <p className="mt-1 text-[12px] text-slate-300">
                  Give every client a credible career surface while you keep
                  control of the ATS and process underneath.
                </p>
              </div>
              <div>
                <p className="text-[11px] font-semibold text-slate-100">
                  In-house HR &amp; People teams
                </p>
                <p className="mt-1 text-[12px] text-slate-300">
                  Offer dedicated hubs for subsidiaries, business units or
                  regions while reporting from one system.
                </p>
              </div>
              <div>
                <p className="text-[11px] font-semibold text-slate-100">
                  Talent platforms &amp; networks
                </p>
                <p className="mt-1 text-[12px] text-slate-300">
                  Power a marketplace of roles for multiple organisations with
                  consistent UX and centralised data.
                </p>
              </div>
              <div>
                <p className="text-[11px] font-semibold text-slate-100">
                  Internal mobility &amp; alumni programs
                </p>
                <p className="mt-1 text-[12px] text-slate-300">
                  Run internal jobs hubs and alumni roles alongside external
                  hiring without extra tools.
                </p>
              </div>
            </div>
          </div>

          {/* Branding & domains */}
          <div className="space-y-3 rounded-2xl border border-slate-800 bg-slate-900/70 p-5 text-xs text-slate-200 shadow-sm">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
              Branding &amp; domains
            </p>
            <p className="text-[12px] text-slate-300">
              Career sites are multi-tenant and brand-aware. Each client or
              business unit can have its own:
            </p>
            <ul className="mt-2 space-y-1.5 text-[11px] text-slate-300">
              <li>• Logo, colours and hero banner image</li>
              <li>• “Working here” copy and values</li>
              <li>• Social links (website, LinkedIn, X / Twitter, Instagram)</li>
            </ul>
            <p className="mt-3 text-[12px] text-slate-300">
              Publish on clean subdomains like{" "}
              <span className="font-mono text-sky-300">
                clientname.thinkats.com
              </span>{" "}
              or bring your own domain when you&apos;re ready for a fully
              white-label experience.
            </p>
          </div>
        </div>
      </section>

      {/* ROADMAP / FUTURE */}
      <section className="mx-auto max-w-6xl px-4 pb-14 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-dashed border-sky-500/40 bg-sky-500/5 p-5 text-xs text-slate-100">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-sky-300">
            Roadmap
          </p>
          <p className="mt-2 text-[12px] text-slate-100">
            The career sites engine is designed to grow with your hiring
            maturity. On the roadmap: deeper per-tenant theming, more control
            over layout blocks, advanced SEO options and full white-label
            deployments on client domains — all powered by the same ThinkATS
            core.
          </p>
          <p className="mt-3 text-[11px] text-slate-300">
            If you&apos;d like to influence the roadmap for agencies, in-house teams
            or talent platforms,{" "}
            <Link
              href="/contact"
              className="font-medium text-sky-300 hover:underline"
            >
              get in touch with the team
            </Link>
            .
          </p>
        </div>
      </section>
    </main>
  );
}
