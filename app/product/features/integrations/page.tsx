// app/product/features/integrations/page.tsx
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Integrations | ThinkATS",
  description:
    "Connect ThinkATS with the tools you already use for email, files and collaboration.",
};

export default function IntegrationsFeaturesPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-50">
      <section className="border-b border-slate-900 bg-slate-950">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-sky-300">
            Product · Integrations
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-50 sm:text-4xl">
            Built to plug into a realistic HR stack.
          </h1>
          <p className="mt-3 max-w-2xl text-sm text-slate-300">
            Out of the box, ThinkATS focuses on doing a few things very well.
            Over time, it connects to your email, file storage and people
            systems so hiring data isn&apos;t trapped in a silo or copied across
            five tools.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-6 md:grid-cols-3">
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
              <li>• Send emails from your own domain (planned)</li>
              <li>• Calendar-friendly interview invitations</li>
              <li>• Templates that match your tone, not ours</li>
            </ul>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 text-xs text-slate-200 shadow-sm">
            <h2 className="text-sm font-semibold text-slate-50">
              Files &amp; document storage
            </h2>
            <p className="mt-2 text-[12px] text-slate-300">
              CVs, scorecards and hiring docs should be stored securely with
              clear links from candidates and jobs — not buried in email threads.
            </p>
            <ul className="mt-3 space-y-1.5 text-[11px] text-slate-300">
              <li>• CV storage with secure links (Supabase-backed)</li>
              <li>• Attachment history per candidate and job</li>
              <li>• Export options when you need local copies</li>
            </ul>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 text-xs text-slate-200 shadow-sm">
            <h2 className="text-sm font-semibold text-slate-50">
              HRIS &amp; internal systems
            </h2>
            <p className="mt-2 text-[12px] text-slate-300">
              Long term, ThinkATS should sit neatly between your sourcing and
              your people systems — not try to replace payroll, HRIS or finance.
            </p>
            <ul className="mt-3 space-y-1.5 text-[11px] text-slate-300">
              <li>• Basic exports for HR hand-off</li>
              <li>• API-first mindset for deeper connections</li>
              <li>• Room for group-wide data flows and leadership views</li>
            </ul>
          </div>
        </div>

        <div className="mt-10 rounded-2xl border border-slate-800 bg-slate-900/70 p-5 text-xs text-slate-100">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
            Where we start
          </p>
          <p className="mt-2 text-[12px] text-slate-200">
            For now this page is narrative-only, so it won&apos;t break your
            app. As you lock in the first integrations to ship, this can evolve
            into real examples with logos, diagrams and concrete “this is how it
            works” flows for your stack.
          </p>
        </div>
      </section>
    </main>
  );
}
