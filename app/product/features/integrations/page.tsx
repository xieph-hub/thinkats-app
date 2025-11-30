// app/product/features/integrations/page.tsx
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Integrations | ThinkATS",
  description:
    "Connect ThinkATS with the tools you already use for email, files and collaboration.",
};

export default function IntegrationsFeaturesPage() {
  return (
    <main className="bg-slate-50">
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#172965]">
            Product · Integrations
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
            Built to plug into a realistic HR stack.
          </h1>
          <p className="mt-3 max-w-2xl text-sm text-slate-700">
            Out of the box, ThinkATS focuses on doing a few things very well.
            Over time, it&apos;ll connect to your email, file storage and
            internal systems so your hiring data isn&apos;t trapped in a silo.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid gap-6 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-slate-900">
              Email &amp; calendars
            </h2>
            <p className="mt-2 text-xs text-slate-600">
              Keep candidate communication in sync with the tools your team
              already lives in, like Gmail or Outlook.
            </p>
            <ul className="mt-3 space-y-1.5 text-[11px] text-slate-600">
              <li>• Send emails from your own domain (planned)</li>
              <li>• Calendar-friendly interview invitations</li>
              <li>• Templates that work with your tone</li>
            </ul>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-slate-900">
              Files &amp; document storage
            </h2>
            <p className="mt-2 text-xs text-slate-600">
              CVs, scorecards and hiring documents should be stored securely,
              with clear links from candidates and jobs.
            </p>
            <ul className="mt-3 space-y-1.5 text-[11px] text-slate-600">
              <li>• CV storage with secure links</li>
              <li>• Clear attachment history per candidate</li>
              <li>• Export options when needed</li>
            </ul>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-slate-900">
              HRIS &amp; internal systems
            </h2>
            <p className="mt-2 text-xs text-slate-600">
              Long term, ThinkATS should sit neatly between your sourcing and
              your people systems — not try to replace everything.
            </p>
            <ul className="mt-3 space-y-1.5 text-[11px] text-slate-600">
              <li>• Basic exports for HR hand-off</li>
              <li>• API-first mindset for future connections</li>
              <li>• Room for group-wide data flows</li>
            </ul>
          </div>
        </div>

        <div className="mt-10 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5 text-xs text-slate-700">
          <p>
            For now this page is narrative-only, so it won&apos;t break your
            app. When you lock in which integrations you want to ship first, we
            can tighten the copy and add logos, diagrams and real examples.
          </p>
        </div>
      </section>
    </main>
  );
}
