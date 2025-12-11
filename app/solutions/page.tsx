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
    <main className="min-h-screen bg-slate-950 text-slate-50">
      {/* HERO */}
      <section className="border-b border-slate-800 bg-gradient-to-br from-slate-950 via-slate-950 to-sky-900/20">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:px-8">
          <div className="space-y-4">
            <p className="inline-flex items-center gap-2 rounded-full border border-slate-800 bg-slate-900/70 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-300">
              <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-emerald-400/10 text-[10px] text-emerald-300">
                ●
              </span>
              Solutions
            </p>

            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              Workflows tuned to how{" "}
              <span className="text-sky-300">your team actually hires.</span>
            </h1>

            <p className="max-w-2xl text-sm text-slate-300">
              In-house HR &amp; People teams, recruitment agencies and founders
              running lean hiring all share the same tension: keep hiring
              structured, without drowning in process or tools. ThinkATS adapts
              to each setup with one core platform for jobs, pipelines, scoring
              and career sites.
            </p>

            {/* Anchor pills */}
            <div className="mt-4 flex flex-wrap items-center gap-3 text-[11px]">
              <a
                href="#in-house"
                className="inline-flex items-center rounded-full bg-slate-900 px-4 py-1.5 text-slate-100 shadow-sm hover:bg-slate-800"
              >
                In-house HR &amp; People
              </a>
              <a
                href="#agencies"
                className="inline-flex items-center rounded-full border border-slate-700 px-4 py-1.5 text-slate-100 hover:bg-slate-900/60"
              >
                Recruitment &amp; search agencies
              </a>
              <a
                href="#founders"
                className="inline-flex items-center rounded-full border border-slate-700 px-4 py-1.5 text-slate-100 hover:bg-slate-900/60"
              >
                Founders &amp; lean teams
              </a>
            </div>

            <p className="mt-3 text-[11px] text-slate-400">
              One ATS, three common models – all compatible with multi-tenant,
              client-ready hiring as you grow.
            </p>
          </div>
        </div>
      </section>

      {/* IN-HOUSE HR & PEOPLE TEAMS */}
      <section
        id="in-house"
        className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8"
      >
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 text-xs text-slate-200 shadow-sm">
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div className="max-w-xl space-y-2">
              <h2 className="text-sm font-semibold text-slate-50">
                In-house HR &amp; People teams
              </h2>
              <p className="text-[12px] text-slate-300">
                Centralise hiring across departments and entities, keep managers
                aligned on priorities and get a truthful view of where each role
                sits. ThinkATS gives HR &amp; People teams a single source of
                truth for jobs, candidates, communications and decisions.
              </p>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-950/50 px-3 py-2 text-[11px] text-slate-300 md:min-w-[230px]">
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                Typical configuration
              </p>
              <p className="mt-1">
                1 ThinkATS tenant · multiple departments / subsidiaries · HR /
                People as admins · hiring managers as collaborators · one
                shared careers site or separate hubs per entity.
              </p>
            </div>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                Pain points it tackles
              </p>
              <ul className="mt-2 space-y-1.5 text-[11px] text-slate-300">
                <li>• Roles scattered across email, forms and spreadsheets</li>
                <li>• No shared view of where candidates are stuck</li>
                <li>• HR leadership relying on manual status updates</li>
                <li>• Candidates falling between HR and hiring managers</li>
                <li>• Little visibility into which teams are over- or under-hiring</li>
              </ul>
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                How ThinkATS fits into the stack
              </p>
              <ul className="mt-2 space-y-1.5 text-[11px] text-slate-300">
                <li>
                  • Clear pipelines for leadership and specialist roles, per
                  department or entity
                </li>
                <li>
                  • Screening &amp; scoring that helps managers focus on the
                  most relevant profiles first
                </li>
                <li>
                  • Simple dashboards for HR / People leadership across all
                  roles
                </li>
                <li>
                  • Structured but human candidate communication that lives next
                  to the pipeline
                </li>
                <li>
                  • Career sites that reflect the organisation&apos;s brand,
                  without a separate website project
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* AGENCIES */}
      <section
        id="agencies"
        className="mx-auto max-w-6xl px-4 pb-10 sm:px-6 lg:px-8"
      >
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 text-xs text-slate-200 shadow-sm">
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div className="max-w-xl space-y-2">
              <h2 className="text-sm font-semibold text-slate-50">
                Recruitment &amp; search agencies
              </h2>
              <p className="text-[12px] text-slate-300">
                Run multiple client mandates from one workspace. Keep shortlists
                clean, scored and client-ready, and report on activity without
                building a new spreadsheet or slide deck for every update.
              </p>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-950/50 px-3 py-2 text-[11px] text-slate-300 md:min-w-[230px]">
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                Typical configuration
              </p>
              <p className="mt-1">
                1 ThinkATS tenant · client-aware mandates · each role has its
                own pipeline · consultants share a candidate pool with full
                history and scoring, scoped by client.
              </p>
            </div>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                Pain points it tackles
              </p>
              <ul className="mt-2 space-y-1.5 text-[11px] text-slate-300">
                <li>• Mandates tracked differently by each recruiter</li>
                <li>• No clean view of who&apos;s in which client process</li>
                <li>• Shortlists assembled by copy-pasting into slides</li>
                <li>• Candidates being reused with no central history</li>
                <li>
                  • Difficult to show clients a clear funnel from sourced →
                  shortlisted → offer
                </li>
              </ul>
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                How ThinkATS fits into the stack
              </p>
              <ul className="mt-2 space-y-1.5 text-[11px] text-slate-300">
                <li>
                  • Client-aware roles and pipelines, with a clear separation
                  between mandates
                </li>
                <li>
                  • Screening &amp; ranking so the top candidates for each
                  client rise to the top automatically
                </li>
                <li>
                  • Shared candidate records with notes, timelines and
                  attachments across multiple mandates
                </li>
                <li>
                  • Clean, exportable views you can drop into client reports or
                  live review sessions
                </li>
                <li>
                  • Branded jobs hubs per client, powered by the same ATS
                  underneath
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* FOUNDERS & LEAN TEAMS */}
      <section
        id="founders"
        className="mx-auto max-w-6xl px-4 pb-12 sm:px-6 lg:px-8"
      >
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 text-xs text-slate-200 shadow-sm">
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div className="max-w-xl space-y-2">
              <h2 className="text-sm font-semibold text-slate-50">
                Founders &amp; lean leadership teams
              </h2>
              <p className="text-[12px] text-slate-300">
                When you&apos;re still under 50 people, you don&apos;t need a
                huge HR stack. You need a reliable place to put roles,
                applications and decisions – with just enough structure to avoid
                chaos and a clear path to scale when the team grows.
              </p>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-950/50 px-3 py-2 text-[11px] text-slate-300 md:min-w-[230px]">
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                Typical configuration
              </p>
              <p className="mt-1">
                1 ThinkATS tenant · founders and early leaders in the ATS ·
                simple careers page for your brand · ready to split into
                multiple tenants as you spin up new entities or products.
              </p>
            </div>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                Pain points it tackles
              </p>
              <ul className="mt-2 space-y-1.5 text-[11px] text-slate-300">
                <li>• Roles scattered across Notion, email and chats</li>
                <li>• No single view of who applied to what</li>
                <li>• Decisions lost in threads or calls</li>
                <li>• Founders spending time manually triaging CVs</li>
                <li>• Difficulty graduating to a more structured hiring model</li>
              </ul>
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                How ThinkATS fits into the stack
              </p>
              <ul className="mt-2 space-y-1.5 text-[11px] text-slate-300">
                <li>
                  • Simple job creation flow with clean, shareable role links
                </li>
                <li>
                  • CV-first applications and screening scores so founders see
                  the strongest profiles first
                </li>
                <li>
                  • Clear, auditable decisions per candidate and per role
                </li>
                <li>
                  • A careers page that feels considered, not like a quick form
                </li>
                <li>
                  • A path to multi-tenant if you later start hiring for other
                  entities or portfolio companies
                </li>
              </ul>
            </div>
          </div>

          {/* CTA row */}
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Link
              href="/contact"
              className="inline-flex items-center rounded-full bg-sky-500 px-5 py-2 text-[12px] font-semibold text-slate-950 shadow-sm hover:bg-sky-400"
            >
              Talk to us about your setup
            </Link>
            <Link
              href="/product"
              className="text-[12px] font-medium text-sky-300 hover:underline"
            >
              Explore the product →
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
