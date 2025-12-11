import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Integrations | ThinkATS",
  description:
    "Connect ThinkATS with the tools you already use for email, files and collaboration.",
};

export default function IntegrationsFeaturesPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-50">
      {/* HERO */}
      <section className="border-b border-slate-900 bg-slate-950">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-sky-300">
            Product · Integrations
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-50 sm:text-4xl">
            Built to plug into a realistic HR stack.
          </h1>
          <p className="mt-3 max-w-2xl text-sm text-slate-300">
            ThinkATS is designed to sit alongside the tools you already trust —
            email, calendars, file storage and HR systems — so hiring data
            doesn&apos;t live in a silo or get copied across five different
            places.
          </p>
        </div>
      </section>

      {/* INTEGRATION PILLARS */}
      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-6 md:grid-cols-3">
          {/* Email & calendars */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 text-xs text-slate-200 shadow-sm">
            <h2 className="text-sm font-semibold text-slate-50">
              Email &amp; calendars
            </h2>
            <p className="mt-2 text-[12px] text-slate-300">
              Keep candidate communication in sync with the tools your team
              already lives in, instead of forcing everyone into a separate
              inbox.
            </p>
            <ul className="mt-3 space-y-1.5 text-[11px] text-slate-300">
              <li>• Send messages from work email, not a no-reply address</li>
              <li>• Calendar-friendly interview invitations and reminders</li>
              <li>• Templates that keep tone consistent across the team</li>
            </ul>
          </div>

          {/* Files & storage */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 text-xs text-slate-200 shadow-sm">
            <h2 className="text-sm font-semibold text-slate-50">
              Files &amp; document storage
            </h2>
            <p className="mt-2 text-[12px] text-slate-300">
              CVs, scorecards, interview notes and hiring docs are stored
              securely, with clear links from candidates and jobs — not buried
              in forwarded threads.
            </p>
            <ul className="mt-3 space-y-1.5 text-[11px] text-slate-300">
              <li>• CV storage with secure, shareable links</li>
              <li>• Attachment history per candidate and per role</li>
              <li>• Exports when you need local copies or backups</li>
            </ul>
          </div>

          {/* HRIS & internal systems */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 text-xs text-slate-200 shadow-sm">
            <h2 className="text-sm font-semibold text-slate-50">
              HRIS &amp; internal systems
            </h2>
            <p className="mt-2 text-[12px] text-slate-300">
              ThinkATS sits neatly between your sourcing channels and your
              people systems — it helps you run hiring, without trying to
              replace payroll, HRIS or finance.
            </p>
            <ul className="mt-3 space-y-1.5 text-[11px] text-slate-300">
              <li>• Clean hand-off once candidates are hired</li>
              <li>• API-first mindset for deeper data connections</li>
              <li>• Room for group-wide views across tenants and clients</li>
            </ul>
          </div>
        </div>

        {/* HOW IT FITS INTO YOUR STACK */}
        <div className="mt-10 rounded-2xl border border-slate-800 bg-slate-900/70 p-5 text-xs text-slate-100">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
            How teams use ThinkATS alongside existing tools
          </p>
          <p className="mt-2 text-[12px] text-slate-200">
            In practice, teams keep email, calendars and HR systems exactly
            where they are. ThinkATS becomes the place where roles, pipelines,
            scores and candidate decisions live — with just enough integration
            to keep everyone aligned.
          </p>
          <p className="mt-2 text-[12px] text-slate-200">
            Hiring managers still work from their inbox, ops teams still trust
            their HR stack, and leadership can see hiring progress without
            asking for a new spreadsheet every week.
          </p>

          <div className="mt-3 flex flex-wrap items-center gap-3">
            <Link
              href="/product"
              className="text-[11px] font-medium text-sky-300 hover:underline"
            >
              See the full product overview →
            </Link>
            <Link
              href="/contact"
              className="text-[11px] font-medium text-slate-200 underline-offset-2 hover:underline"
            >
              Talk to us about your stack →
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
