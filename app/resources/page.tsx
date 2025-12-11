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
      {/* HERO */}
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#172965]">
            Resources
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
            Hiring frameworks you can actually use.
          </h1>
          <p className="mt-3 max-w-2xl text-sm text-slate-700">
            A small library of playbooks, checklists and scorecard ideas we use
            with hiring teams. Adapt them to your own process, or use them as a
            starting point for your next role.
          </p>
        </div>
      </section>

      {/* RESOURCE CARDS */}
      <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid gap-6 md:grid-cols-3">
          {/* Playbook */}
          <article
            id="realistic-interviews"
            className="flex flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
              Playbook
            </p>
            <h2 className="mt-2 text-sm font-semibold text-slate-900">
              Designing a realistic interview process
            </h2>
            <p className="mt-2 flex-1 text-xs text-slate-600">
              Move away from generic “3 interviews and a gut feel” toward a
              clearer process that mirrors the real work and respects candidate
              time.
            </p>
            <ul className="mt-3 space-y-1.5 text-[11px] text-slate-600">
              <li>• Map stages to real decisions, not habit</li>
              <li>• Balance depth with time-to-offer</li>
              <li>• Decide who&apos;s in the room and why</li>
              <li>• Capture signals in a way you can defend</li>
            </ul>
          </article>

          {/* Checklist */}
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
              Run this checklist on any role — from application to offer — to
              spot drop-off points, confusing steps and slow feedback loops.
            </p>
            <ul className="mt-3 space-y-1.5 text-[11px] text-slate-600">
              <li>• What candidates see on the jobs page</li>
              <li>• How long each stage really takes</li>
              <li>• Where updates go missing or arrive late</li>
              <li>• Moments that build or damage trust</li>
            </ul>
          </article>

          {/* Framework */}
          <article
            id="scorecards"
            className="flex flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
              Framework
            </p>
            <h2 className="mt-2 text-sm font-semibold text-slate-900">
              Scorecards &amp; hiring signals
            </h2>
            <p className="mt-2 flex-1 text-xs text-slate-600">
              Turn vague “culture fit” into clear, observable signals that
              everyone on the panel understands — and can write down.
            </p>
            <ul className="mt-3 space-y-1.5 text-[11px] text-slate-600">
              <li>• Split role requirements into a few key dimensions</li>
              <li>• Define what “strong”, “good” and “concern” look like</li>
              <li>• Keep comments focused on evidence, not vibes</li>
              <li>• Make final decisions easier to explain later</li>
            </ul>
          </article>
        </div>

        {/* HOW THIS HELPS WITH THINKATS */}
        <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-5 text-xs text-slate-700 shadow-sm">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
            Using these alongside ThinkATS
          </p>
          <p className="mt-2">
            The same ideas behind these resources show up inside ThinkATS:
            structured stages, clear scorecards and better visibility on where
            candidates get stuck.
          </p>
          <p className="mt-2">
            Teams use the playbook thinking to set up their pipelines, adapt
            the checklist when reviewing candidate journeys, and bring the
            scorecard approach into how they log feedback on each role.
          </p>

          <div className="mt-3 flex flex-wrap items-center gap-3">
            <Link
              href="/product"
              className="text-[11px] font-medium text-[#172965] hover:underline"
            >
              See how the product ties it together →
            </Link>
            <Link
              href="/contact"
              className="text-[11px] font-medium text-slate-700 underline-offset-2 hover:underline"
            >
              Talk to us about your own hiring playbook →
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
