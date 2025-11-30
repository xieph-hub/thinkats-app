// app/product/page.tsx
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Product | ThinkATS",
  description:
    "ThinkATS is a recruitment operating system built for founders, HR teams and talent partners.",
};

export default function ProductPage() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      {/* Hero */}
      <section className="border-b border-slate-200 bg-gradient-to-br from-white via-white to-[#172965]/7">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-10 lg:py-14">
          <div className="space-y-4">
            <h1 className="text-3xl font-semibold tracking-tight text-[#172965] sm:text-4xl lg:text-[2.6rem]">
              A recruiting OS for operators,
              <br className="hidden sm:block" /> not just another job board.
            </h1>
            <p className="max-w-2xl text-sm leading-relaxed text-slate-700">
              ThinkATS helps founders, People teams and embedded talent
              partners run structured hiring: from intake to offer, across
              multiple companies and seniority bands. Designed to be SaaS-ready
              from day one, but battle-tested in real searches via Resourcin.
            </p>

            <div className="flex flex-wrap gap-3 pt-2">
              <Link
                href="/jobs"
                className="inline-flex items-center justify-center rounded-full bg-[#172965] px-5 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-[#0f1c48]"
              >
                View live roles
              </Link>
              <Link
                href="/career-sites"
                className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-4 py-2.5 text-xs font-semibold text-slate-800 hover:border-[#172965]/40 hover:text-[#172965]"
              >
                See career sites
              </Link>
            </div>
          </div>

          {/* 3-column product pillars */}
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <Pillar
              label="ATS & pipelines"
              body="Scorecards, stages and structured interview notes so you can actually compare candidates and defend decisions."
            />
            <Pillar
              label="Career sites"
              body="Beautiful, branded sites for Resourcin and client mandates, all wired into one pipeline engine."
            />
            <Pillar
              label="Talent network"
              body="Always-on talent pools, evergreen roles and a simple way for great people to raise their hand once and be considered often."
            />
          </div>
        </div>
      </section>

      {/* Deeper feature sections */}
      <section className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-10 space-y-10">
        <FeatureBlock
          eyebrow="For founders & hiring managers"
          title="Stop running senior searches out of spreadsheets and email threads."
          bullets={[
            "Intake templates that capture scope, outcomes and non-negotiables clearly.",
            "Scorecards and competencies mapped to each role, not generic wishlists.",
            "Clear visibility into who is in process, who is stuck and where the bottlenecks are.",
          ]}
        />

        <FeatureBlock
          eyebrow="For embedded talent partners"
          title="One workspace for multiple clients, companies and mandates."
          bullets={[
            "Separate pipelines and reporting per client or business unit, with shared talent pools where it makes sense.",
            "Client-specific career pages that still feed one underlying ATS, so you keep the system of record.",
            "Sourcing tags and channel attribution that survive across rehiring and re-opened roles.",
          ]}
        />

        <FeatureBlock
          eyebrow="For People & HR teams"
          title="A system that respects both candidate experience and internal governance."
          bullets={[
            "Structured notes and feedback nudges, so decisions are recorded—not lost in chat.",
            "Permissions and visibility that can flex from early-stage startup to group-level governance.",
            "Simple exports for board reporting, audit trails and diversity monitoring when you need it.",
          ]}
        />
      </section>
    </main>
  );
}

function Pillar({ label, body }: { label: string; body: string }) {
  return (
    <div className="flex flex-col rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#306B34]">
        {label}
      </div>
      <p className="mt-2 text-sm leading-relaxed text-slate-700">{body}</p>
    </div>
  );
}

function FeatureBlock({
  eyebrow,
  title,
  bullets,
}: {
  eyebrow: string;
  title: string;
  bullets: string[];
}) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#306B34]">
        {eyebrow}
      </div>
      <h2 className="mt-2 text-lg font-semibold text-[#172965]">{title}</h2>
      <ul className="mt-3 space-y-2 text-sm leading-relaxed text-slate-700">
        {bullets.map((b) => (
          <li key={b} className="flex gap-2">
            <span className="mt-1 h-1.5 w-1.5 rounded-full bg-[#64C247]" />
            <span>{b}</span>
          </li>
        ))}
      </ul>
    </article>
  );
}
