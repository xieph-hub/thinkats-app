// app/career-sites/page.tsx
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Career Sites | ThinkATS",
  description:
    "Host beautiful, on-brand career sites for every portfolio company, powered by ThinkATS and Resourcin.",
};

export default function CareerSitesPage() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      {/* Hero */}
      <section className="border-b border-slate-200 bg-gradient-to-br from-white via-white to-[#172965]/5">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-10 lg:py-14">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#172965]/15 bg-[#172965]/5 px-3 py-1 text-[11px] font-medium text-[#172965]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#64C247]" />
            Multi-tenant career sites for founders, studios & PE firms
          </div>

          <div className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,1.7fr),minmax(0,1.1fr)] lg:items-center">
            <div className="space-y-5">
              <h1 className="text-3xl font-semibold tracking-tight text-[#172965] sm:text-4xl lg:text-[2.6rem]">
                Enterprise-grade career sites,<br className="hidden sm:block" />
                on your domain in days — not months.
              </h1>
              <p className="max-w-xl text-sm leading-relaxed text-slate-700">
                ThinkATS powers candidate-facing career pages for Resourcin and
                its clients. Spin up clean, on-brand sites for each company or
                business unit, with jobs, application flows and talent pool
                forms all wired into a single ATS.
              </p>

              <ul className="mt-4 space-y-2 text-sm text-slate-800">
                <li className="flex gap-2">
                  <span className="mt-1 h-1.5 w-1.5 rounded-full bg-[#64C247]" />
                  <span>
                    <strong>Multi-company ready.</strong> Give each portfolio
                    company its own career site, all managed in one workspace.
                  </span>
                </li>
                <li className="flex gap-2">
                  <span className="mt-1 h-1.5 w-1.5 rounded-full bg-[#64C247]" />
                  <span>
                    <strong>On-brand, not generic.</strong> Logos, colours,
                    imagery and copy stay true to each employer brand.
                  </span>
                </li>
                <li className="flex gap-2">
                  <span className="mt-1 h-1.5 w-1.5 rounded-full bg-[#64C247]" />
                  <span>
                    <strong>ATS-native.</strong> Jobs, pipelines, tags and
                    sourcing channels are synced with ThinkATS — no copy-paste.
                  </span>
                </li>
              </ul>

              <div className="flex flex-wrap gap-3 pt-3">
                <Link
                  href="/product"
                  className="inline-flex items-center justify-center rounded-full bg-[#172965] px-5 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-[#0f1c48]"
                >
                  Explore the full product
                </Link>
                <Link
                  href="/jobs"
                  className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-4 py-2.5 text-xs font-semibold text-slate-800 hover:border-[#172965]/40 hover:text-[#172965]"
                >
                  See a live career site
                </Link>
              </div>
            </div>

            {/* Simple “mock” layout illustration using divs */}
            <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="rounded-2xl bg-slate-50 p-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-xl bg-[#172965]" />
                    <div>
                      <div className="h-2.5 w-24 rounded-full bg-slate-300" />
                      <div className="mt-1 h-2 w-16 rounded-full bg-slate-200" />
                    </div>
                  </div>
                  <div className="hidden gap-2 sm:flex">
                    <div className="h-2.5 w-10 rounded-full bg-slate-200" />
                    <div className="h-2.5 w-10 rounded-full bg-slate-200" />
                    <div className="h-2.5 w-10 rounded-full bg-slate-200" />
                  </div>
                </div>

                <div className="mt-4 h-24 rounded-xl bg-gradient-to-r from-[#172965]/15 via-[#64C247]/10 to-[#FFC000]/15" />

                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="rounded-xl border border-slate-200 bg-white p-3"
                    >
                      <div className="h-2.5 w-24 rounded-full bg-slate-200" />
                      <div className="mt-2 h-2 w-20 rounded-full bg-slate-100" />
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        <span className="inline-flex items-center rounded-full bg-[#172965]/5 px-2 py-0.5 text-[10px] font-medium text-[#172965]">
                          Location
                        </span>
                        <span className="inline-flex items-center rounded-full bg-[#64C247]/10 px-2 py-0.5 text-[10px] font-medium text-[#306B34]">
                          Remote / Hybrid
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
                  <div className="h-2 w-24 rounded-full bg-slate-200" />
                  <div className="h-7 rounded-full bg-[#172965]/10 px-4 py-1 text-[11px] font-semibold text-[#172965]">
                    Powered by ThinkATS
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature grid */}
      <section className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-[#172965]">
              Built for studios, holding companies and busy HR teams.
            </h2>
            <p className="mt-1 max-w-2xl text-sm text-slate-700">
              Whether you&apos;re running one company or a portfolio of 10,
              ThinkATS gives you clean, candidate-friendly sites without
              juggling multiple tools.
            </p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <FeatureCard
            title="One ATS, many sites"
            body="Spin up a dedicated career site for each brand or business unit while keeping all applications, talent pools and pipelines inside a single ThinkATS workspace."
          />
          <FeatureCard
            title="On your domain or ours"
            body="Start quickly with subdomains like jobs.clientname.com or careers.clientname.resourcin.com, then move to full white-label as your stack matures."
          />
          <FeatureCard
            title="Source tracking & analytics"
            body="Track every click and application back to the site, client and campaign. See which pages actually convert and double down on what works."
          />
          <FeatureCard
            title="SEO & performance by default"
            body="Fast, mobile-first pages with sensible metadata, clean URLs and structured role content so candidates can actually find your jobs."
          />
        </div>
      </section>
    </main>
  );
}

function FeatureCard({ title, body }: { title: string; body: string }) {
  return (
    <article className="flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <h3 className="text-sm font-semibold text-[#172965]">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-slate-700">{body}</p>
    </article>
  );
}
