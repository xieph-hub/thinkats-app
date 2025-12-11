import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Automation & emails | ThinkATS",
  description:
    "Send consistent messages to candidates and internal stakeholders without losing the human tone.",
};

export default function AutomationFeaturesPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-50">
      {/* HERO */}
      <section className="border-b border-slate-900 bg-gradient-to-br from-slate-950 via-slate-950 to-sky-900/20">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-sky-300">
            Product · Automation &amp; emails
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-50 sm:text-4xl">
            Keep candidates warm without losing your voice.
          </h1>
          <p className="mt-3 max-w-2xl text-sm text-slate-300">
            ThinkATS is designed to support simple, honest communication — from
            application acknowledgements to shortlisting and final decisions —
            without turning your ATS into a noisy marketing machine.
          </p>
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <Link
              href="/contact"
              className="inline-flex items-center rounded-full bg-sky-500 px-5 py-2 text-xs font-semibold text-slate-950 shadow-sm hover:bg-sky-400"
            >
              Discuss your email flows
            </Link>
          </div>
        </div>
      </section>

      {/* CORE AUTOMATION BLOCKS */}
      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-6 md:grid-cols-3">
          {/* Application acknowledgements */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 text-xs text-slate-200 shadow-sm">
            <h2 className="text-sm font-semibold text-slate-50">
              Application acknowledgements
            </h2>
            <p className="mt-2 text-[12px] text-slate-300">
              Automatically confirm applications with a short, clear message
              that sets expectations on next steps and timelines — per tenant,
              with optional role-specific tweaks.
            </p>
            <ul className="mt-3 space-y-1.5 text-[11px] text-slate-300">
              <li>• Per-tenant default templates</li>
              <li>• Role-level overrides where needed</li>
              <li>• Simple personalisation (name, role, organisation)</li>
            </ul>
          </div>

          {/* Stage-based notifications */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 text-xs text-slate-200 shadow-sm">
            <h2 className="text-sm font-semibold text-slate-50">
              Stage-based notifications
            </h2>
            <p className="mt-2 text-[12px] text-slate-300">
              When you move a candidate between stages, ThinkATS can suggest or
              trigger the right email — interview invite, next steps or closure
              — while still letting humans edit the final wording.
            </p>
            <ul className="mt-3 space-y-1.5 text-[11px] text-slate-300">
              <li>• Interview invites &amp; confirmations</li>
              <li>• Reminder nudges for overdue feedback</li>
              <li>• Clear “no” emails when needed</li>
            </ul>
          </div>

          {/* Internal alerts */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 text-xs text-slate-200 shadow-sm">
            <h2 className="text-sm font-semibold text-slate-50">
              Internal alerts &amp; alignment
            </h2>
            <p className="mt-2 text-[12px] text-slate-300">
              Make sure hiring managers and stakeholders know when there&apos;s
              something to review — without spamming everyone on every move.
            </p>
            <ul className="mt-3 space-y-1.5 text-[11px] text-slate-300">
              <li>• Digest-style notifications by role or tenant</li>
              <li>• Per-tenant preferences for who gets what</li>
              <li>• Audit trail of what was sent and when</li>
            </ul>
          </div>
        </div>

        {/* HOW AUTOMATION SITS ON TOP */}
        <div className="mt-10 rounded-2xl border border-slate-800 bg-slate-900/70 p-5 text-xs text-slate-100">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
            How automation fits into ThinkATS
          </p>
          <p className="mt-2 text-[12px] text-slate-200">
            Automation in ThinkATS is driven by the same pipelines and scoring
            signals your team sees: when a candidate applies, reaches a
            shortlist, moves stage or gets a final decision, the right
            communication can follow — with humans still in control of tone.
          </p>
          <p className="mt-2 text-[12px] text-slate-200">
            That means candidates get timely updates, hiring managers get clear
            prompts and HR doesn&apos;t have to juggle dozens of templates in
            separate tools.
          </p>

          <div className="mt-3 flex flex-wrap items-center gap-3 text-[11px]">
            <Link
              href="/product/features/analytics"
              className="font-medium text-sky-300 hover:underline"
            >
              See how this shows up in reporting →
            </Link>
            <Link
              href="/product/features/integrations"
              className="font-medium text-sky-300 hover:underline"
            >
              See how it works with your email &amp; calendar stack →
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
