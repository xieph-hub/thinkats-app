// app/solutions/page.tsx
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Solutions | ThinkATS",
  description:
    "See how ThinkATS supports in-house HR teams, recruitment agencies and founders running lean hiring.",
};

export default function SolutionsPage() {
  return (
    <main className="bg-slate-50">
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#172965]">
            Solutions
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
            Thoughtful workflows for different hiring teams.
          </h1>
          <p className="mt-3 max-w-2xl text-sm text-slate-700">
            Whether you&apos;re an in-house HR lead, a recruitment agency or a
            founder wearing multiple hats, ThinkATS gives you just enough
            structure without getting in your way.
          </p>
        </div>
      </section>

      <section
        id="in-house"
        className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8"
      >
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-900">
            In-house HR &amp; People teams
          </h2>
          <p className="mt-2 text-xs text-slate-600">
            Centralise hiring across departments, keep managers aligned on
            priorities and remove the friction from getting feedback.
          </p>
          <ul className="mt-3 grid gap-2 text-[11px] text-slate-600 sm:grid-cols-2">
            <li>• Clear pipelines for leadership and specialist roles</li>
            <li>• Visibility on where candidates are stuck</li>
            <li>• Simple dashboards for HR leadership</li>
            <li>• Candidate communication that feels human</li>
          </ul>
        </div>
      </section>

      <section
        id="agencies"
        className="mx-auto max-w-6xl px-4 pb-8 sm:px-6 lg:px-8"
      >
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-900">
            Recruitment &amp; search agencies
          </h2>
          <p className="mt-2 text-xs text-slate-600">
            Run multiple client mandates from a single place, keep shortlists
            clean and prepare client-ready reports without extra spreadsheets.
          </p>
          <ul className="mt-3 grid gap-2 text-[11px] text-slate-600 sm:grid-cols-2">
            <li>• Multi-tenant structure by client</li>
            <li>• Per-role pipelines with rich notes</li>
            <li>• Clear view of who&apos;s in which process</li>
            <li>• Easy export or screenshots for client updates</li>
          </ul>
        </div>
      </section>

      <section
        id="founders"
        className="mx-auto max-w-6xl px-4 pb-10 sm:px-6 lg:px-8"
      >
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-900">
            Founders &amp; lean leadership teams
          </h2>
          <p className="mt-2 text-xs text-slate-600">
            When you&apos;re still under 50 people, you don&apos;t need a huge
            HR stack. You just need a clean place to put roles, candidates and
            decisions.
          </p>
          <ul className="mt-3 grid gap-2 text-[11px] text-slate-600 sm:grid-cols-2">
            <li>• Simple job creation flow</li>
            <li>• No-login, CV-first applications</li>
            <li>• Clear decisions per candidate</li>
            <li>• Ready to grow into multi-tenant as you scale</li>
          </ul>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <Link
              href="/signup"
              className="inline-flex items-center rounded-full bg-[#172965] px-5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-[#0f1c48]"
            >
              Try ThinkATS
            </Link>
            <Link
              href="/product"
              className="text-xs font-medium text-[#172965] hover:underline"
            >
              Explore the product →
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
