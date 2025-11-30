// app/resources/page.tsx
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Resources | ThinkATS",
  description:
    "Guides, checklists and frameworks to help you design better hiring processes.",
};

export default function ResourcesPage() {
  return (
    <main className="bg-slate-50">
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#172965]">
            Resources
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
            Hiring frameworks you can actually use.
          </h1>
          <p className="mt-3 max-w-2xl text-sm text-slate-700">
            This is where you can later plug in your playbooks, templates and
            examples — for now we&apos;ll keep it simple with a few placeholder
            cards.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid gap-6 md:grid-cols-3">
          <article
            id="workflows"
            className="flex flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
              Playbook
            </p>
            <h2 className="mt-2 text-sm font-semibold text-slate-900">
              Designing a realistic interview process
            </h2>
            <p className="mt-2 flex-1 text-xs text-slate-600">
              How to move from “CV screen + 3 interviews” to a tighter, more
              honest process that respects candidate time.
            </p>
            <span className="mt-3 text-[11px] text-slate-500">
              PDF / article coming soon
            </span>
          </article>

          <article
            id="candidate-experience"
            className="flex flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
              Checklist
            </p>
            <h2 className="mt-2 text-sm font-semibold text-slate-900">
              Candidate experience audit
            </h2>
            <p className="mt-2 flex-1 text-xs text-slate-600">
              A simple checklist you can run on any role from application to
              offer to see where candidates are getting stuck.
            </p>
            <span className="mt-3 text-[11px] text-slate-500">
              Template coming soon
            </span>
          </article>

          <article className="flex flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
              Framework
            </p>
            <h2 className="mt-2 text-sm font-semibold text-slate-900">
              Scorecards &amp; hiring signals
            </h2>
            <p className="mt-2 flex-1 text-xs text-slate-600">
              Turn vague “culture fit” into clear, observable signals that
              everyone on the hiring panel understands.
            </p>
            <span className="mt-3 text-[11px] text-slate-500">
              Framework coming soon
            </span>
          </article>
        </div>

        <div className="mt-8 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5 text-xs text-slate-700">
          <p>
            When you&apos;re ready, this section can be wired into a CMS (or
            your own ThinkATS-powered content model) so you can publish
            articles, checklists and templates without touching code.
          </p>
          <p className="mt-2">
            For now, it&apos;s intentionally light — just enough for visitors to
            see that resources are part of the roadmap.
          </p>
        </div>
      </section>
    </main>
  );
}
