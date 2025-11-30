import type { Metadata } from "next";
import { SITE_URL } from "@/lib/site";
import Container from "@/components/Container";
import Link from "next/link";

export const metadata: Metadata = {
  title: "ThinkATS | The modern ATS built for scale",
  description:
    "ThinkATS is a modern, multi-tenant applicant tracking system for recruitment agencies, HR teams and staffing firms. Launch branded career sites, manage pipelines and automate hiring from day one.",
  alternates: { canonical: SITE_URL + "/" },
};

export default function Page() {
  return (
    <main>
      {/* Hero */}
      <section className="bg-white py-14 md:py-20">
        <Container>
          <div className="grid gap-10 md:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] md:items-center">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                Applicant Tracking • Career Sites • Automation
              </p>

              <h1 className="mt-3 text-3xl font-bold leading-tight text-slate-900 md:text-5xl">
                The modern ATS{" "}
                <span className="text-[#1E40AF]">built for scale</span>.
              </h1>

              <p className="mt-4 max-w-xl text-sm text-slate-600 md:text-base">
                ThinkATS gives recruitment agencies and in-house HR teams a
                multi-tenant platform to run every search: branded career sites,
                structured pipelines, candidate CRM and automated workflows that
                actually reflect how you hire.
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  href="/signup"
                  className="rounded-xl bg-[#1E40AF] px-5 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#1D4ED8]"
                >
                  Start free trial
                </Link>
                <Link
                  href="/contact"
                  className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-800 hover:bg-slate-50"
                >
                  Book a demo
                </Link>
              </div>

              <p className="mt-3 text-xs text-slate-500">
                No credit card required · Multi-tenant from day one · Built to
                power firms like Resourcin and beyond
              </p>

              <div className="mt-6 inline-flex items-center gap-2 rounded-full bg-slate-50 px-3 py-2 text-[11px] text-slate-600">
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-[10px] font-semibold text-emerald-700">
                  ●
                </span>
                <span>
                  Already using ThinkATS as a client?{" "}
                  <Link
                    href="/ats/dashboard"
                    className="font-semibold text-[#1E40AF] hover:underline"
                  >
                    Go to your ATS →
                  </Link>
                </span>
              </div>
            </div>

            {/* Right: quick product preview cards */}
            <div className="space-y-4">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Careers & Job Board
                </p>
                <p className="mt-2 text-sm font-semibold text-slate-900">
                  Branded career sites for every client
                </p>
                <p className="mt-1 text-xs text-slate-600">
                  Launch white-label career portals on{" "}
                  <span className="font-medium text-[#1E40AF]">
                    clientname.thinkats.com
                  </span>{" "}
                  or your clients&apos; domains, with filters, search and SEO-
                  ready job pages.
                </p>
                <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500">
                  <span>Resourcin &amp; other firms already run searches here.</span>
                  <Link
                    href="/jobs"
                    className="font-semibold text-[#1E40AF] hover:underline"
                  >
                    View live job board →
                  </Link>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Pipelines
                  </p>
                  <p className="mt-1 text-sm font-semibold text-slate-900">
                    Drag-and-drop hiring stages
                  </p>
                  <p className="mt-1 text-xs text-slate-600">
                    Move candidates from Applied → Shortlist → Interview →
                    Offer and keep a clean audit trail across every mandate.
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Automation
                  </p>
                  <p className="mt-1 text-sm font-semibold text-slate-900">
                    Smart emails & notifications
                  </p>
                  <p className="mt-1 text-xs text-slate-600">
                    Acknowledge applications, nudge interview feedback and keep
                    clients in the loop without copy-pasting templates all day.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* Who ThinkATS is for */}
      <section className="border-t bg-slate-50 py-12 md:py-16">
        <Container>
          <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                Built for modern hiring teams
              </p>
              <h2 className="mt-2 text-xl font-semibold text-slate-900 md:text-2xl">
                One ATS, multiple ways to run your search business.
              </h2>
            </div>
            <p className="mt-2 max-w-md text-xs text-slate-600 md:text-sm">
              Whether you&apos;re an agency, in-house HR team or staffing firm,
              ThinkATS gives you the structure to scale: multi-tenant accounts,
              reusable templates and clean reporting.
            </p>
          </div>

          <div className="mt-8 grid gap-6 md:grid-cols-3">
            <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200/80">
              <p className="text-xs font-semibold uppercase tracking-wide text-[#1E40AF]">
                Recruitment Agencies
              </p>
              <p className="mt-2 text-sm font-semibold text-slate-900">
                Run multiple clients from one ATS
              </p>
              <p className="mt-2 text-xs text-slate-600">
                Keep each client&apos;s jobs, pipelines and reporting separated
                while your team works from a single, powerful back-office.
              </p>
            </div>

            <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200/80">
              <p className="text-xs font-semibold uppercase tracking-wide text-[#1E40AF]">
                Corporate HR & People teams
              </p>
              <p className="mt-2 text-sm font-semibold text-slate-900">
                Centralize hiring across locations
              </p>
              <p className="mt-2 text-xs text-slate-600">
                Standardize hiring stages, keep stakeholders aligned and see
                time-to-hire, source effectiveness and funnel health in one
                place.
              </p>
            </div>

            <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200/80">
              <p className="text-xs font-semibold uppercase tracking-wide text-[#1E40AF]">
                Staffing & BPO firms
              </p>
              <p className="mt-2 text-sm font-semibold text-slate-900">
                Volume hiring without chaos
              </p>
              <p className="mt-2 text-xs text-slate-600">
                Handle hundreds of applicants, recurring roles and multiple
                contracts with structured pipelines and reusable job templates.
              </p>
            </div>
          </div>
        </Container>
      </section>

      {/* Simple CTA strip */}
      <section className="border-t bg-white py-10">
        <Container>
          <div className="flex flex-col items-start justify-between gap-4 rounded-2xl bg-slate-900 px-6 py-8 text-white md:flex-row md:items-center md:px-8">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-300">
                Get started
              </p>
              <h3 className="mt-2 text-lg font-semibold md:text-xl">
                Ready to power your recruitment with ThinkATS?
              </h3>
              <p className="mt-2 max-w-xl text-xs text-slate-300 md:text-sm">
                Spin up your first tenant, invite your team and publish your
                first role in under an hour. Resourcin is client #1 — your firm
                can be next.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/signup"
                className="rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-slate-900 shadow-sm hover:bg-slate-100"
              >
                Start free trial
              </Link>
              <Link
                href="/pricing"
                className="rounded-full border border-slate-500 px-5 py-2.5 text-sm font-semibold text-slate-100 hover:bg-slate-800"
              >
                View pricing
              </Link>
            </div>
          </div>
        </Container>
      </section>
    </main>
  );
}
