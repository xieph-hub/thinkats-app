// app/career-sites/page.tsx
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Career sites engine | ThinkATS",
  description:
    "Launch modern, branded career sites on your own domain or subdomain, powered directly by ThinkATS.",
};

export default function CareerSitesPage() {
  return (
    <main className="bg-slate-50">
      <section className="border-b border-slate-200 bg-gradient-to-br from-white via-white to-[#172965]/5">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#172965]">
            Career sites
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
            Turn your ATS into a world-class career site.
          </h1>
          <p className="mt-3 max-w-2xl text-sm text-slate-700">
            Public jobs, beautiful role pages and a clean application flow —
            all powered by the same data you see in your ATS. No duplicate
            forms, no broken embeds.
          </p>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <Link
              href="/signup"
              className="inline-flex items-center rounded-full bg-[#172965] px-5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-[#0f1c48]"
            >
              Get started with ThinkATS
            </Link>
            <Link
              href="/jobs"
              className="text-xs font-medium text-[#172965] hover:underline"
            >
              View a live careers example →
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid gap-6 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-slate-900">
              Enterprise-grade listing
            </h2>
            <p className="mt-2 text-xs text-slate-600">
              Candidates can browse roles, filter by location or function and
              quickly understand what you&apos;re hiring for.
            </p>
            <ul className="mt-3 space-y-1.5 text-[11px] text-slate-600">
              <li>• Search and filters for live roles</li>
              <li>• Clear status &quot;open / closed&quot; indicators</li>
              <li>• Consistent metadata across all jobs</li>
            </ul>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-slate-900">
              Rich job detail pages
            </h2>
            <p className="mt-2 text-xs text-slate-600">
              Role overview, responsibilities, requirements and benefits — all
              presented in a structured, easy-to-read layout.
            </p>
            <ul className="mt-3 space-y-1.5 text-[11px] text-slate-600">
              <li>• Clean typography and layout</li>
              <li>• Role snapshot with key facts</li>
              <li>• Built-in sharing links for candidates</li>
            </ul>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-slate-900">
              Frictionless applications
            </h2>
            <p className="mt-2 text-xs text-slate-600">
              Short forms, CV upload and optional extra questions. Every
              application lands directly in your job pipeline.
            </p>
            <ul className="mt-3 space-y-1.5 text-[11px] text-slate-600">
              <li>• CV upload with secure storage</li>
              <li>• Custom screening questions per role</li>
              <li>• Automatic creation of candidates &amp; applications</li>
            </ul>
          </div>
        </div>

        <div className="mt-10 rounded-2xl border border-dashed border-[#64C247]/40 bg-[#64C247]/5 p-5 text-xs text-slate-700">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-[#306B34]">
            Roadmap
          </p>
          <p className="mt-2">
            Coming next: per-tenant theming, subdomain career sites
            (e.g. <span className="font-mono">resourcin.thinkats.com</span>),
            and whitelabel options for clients who want the career experience on
            their own domain.
          </p>
        </div>
      </section>
    </main>
  );
}
