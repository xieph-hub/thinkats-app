// app/product/features/automation/page.tsx
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Automation & emails | ThinkATS",
  description:
    "Send consistent messages to candidates and internal stakeholders without losing the human tone.",
};

export default function AutomationFeaturesPage() {
  return (
    <main className="bg-slate-50">
      <section className="border-b border-slate-200 bg-gradient-to-br from-white via-white to-[#172965]/5">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#172965]">
            Product · Automation &amp; emails
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
            Keep candidates warm without losing your voice.
          </h1>
          <p className="mt-3 max-w-2xl text-sm text-slate-700">
            ThinkATS is designed to support simple, honest communication — from
            application acknowledgements to shortlisting and final decisions.
          </p>
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <Link
              href="/signup"
              className="inline-flex items-center rounded-full bg-[#172965] px-5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-[#0f1c48]"
            >
              Join the early access list
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid gap-6 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-slate-900">
              Application acknowledgements
            </h2>
            <p className="mt-2 text-xs text-slate-600">
              Automatically confirm applications with a short, clear message
              that sets expectations on next steps and timelines.
            </p>
            <ul className="mt-3 space-y-1.5 text-[11px] text-slate-600">
              <li>• Per-tenant default templates</li>
              <li>• Role-specific overrides where needed</li>
              <li>• Simple personalisation (name, role, company)</li>
            </ul>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-slate-900">
              Stage-based notifications
            </h2>
            <p className="mt-2 text-xs text-slate-600">
              When you move a candidate between stages, ThinkATS can trigger
              pre-defined messages or reminders — while still letting you edit
              the final wording.
            </p>
            <ul className="mt-3 space-y-1.5 text-[11px] text-slate-600">
              <li>• Interview invites &amp; confirmations</li>
              <li>• Reminder nudges for overdue feedback</li>
              <li>• Clear &quot;no&quot; emails when needed</li>
            </ul>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-slate-900">
              Internal alerts &amp; alignment
            </h2>
            <p className="mt-2 text-xs text-slate-600">
              Make sure hiring managers and stakeholders know when there&apos;s
              something to review — without spamming everyone on every move.
            </p>
            <ul className="mt-3 space-y-1.5 text-[11px] text-slate-600">
              <li>• Digest-style notifications by role</li>
              <li>• Per-tenant preferences for who gets what</li>
              <li>• Audit trail of what was sent and when</li>
            </ul>
          </div>
        </div>

        <div className="mt-10 rounded-2xl border border-dashed border-[#64C247]/40 bg-[#64C247]/5 p-5 text-xs text-slate-700">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-[#306B34]">
            Roadmap
          </p>
          <p className="mt-2">
            The automation layer is intentionally lightweight at first, with
            room to grow into more advanced sequences, dynamic templates and
            integrations with your existing comms tools.
          </p>
        </div>
      </section>
    </main>
  );
}
