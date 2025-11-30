// app/company/page.tsx
import type { Metadata } from "next";
import Container from "@/components/Container";

export const metadata: Metadata = {
  title: "Company | ThinkATS",
  description:
    "Learn about the team and thinking behind ThinkATS — a modern ATS built from the realities of recruitment work.",
};

export default function CompanyPage() {
  return (
    <main className="bg-white">
      <section className="border-b bg-slate-50 py-12 md:py-16">
        <Container>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
            Company
          </p>
          <h1 className="mt-3 text-3xl font-bold text-slate-900 md:text-4xl">
            Built from the inside of recruitment, not from the outside.
          </h1>
          <p className="mt-3 max-w-2xl text-sm text-slate-600 md:text-base">
            ThinkATS was born out of the reality of running searches for
            founders and leadership teams in fast-moving markets — where
            spreadsheets, generic ATS tools and email threads weren&apos;t
            enough.
          </p>
        </Container>
      </section>

      <section className="py-12 md:py-16">
        <Container>
          <div className="grid gap-8 md:grid-cols-2">
            <div className="space-y-4 text-sm text-slate-700">
              <p>
                Instead of designing in a vacuum, ThinkATS is being built while
                powering real mandates through{" "}
                <span className="font-semibold">Resourcin Human Capital Advisors</span>{" "}
                — our first live client and implementation partner.
              </p>
              <p>
                That means every feature has to survive contact with actual
                hiring work: niche leadership searches, high-volume roles, BPO
                build-outs and everything in between.
              </p>
              <p>
                Our goal is simple:{" "}
                <span className="font-semibold">
                  an ATS that feels like a natural extension of how strong
                  recruiters already work
                </span>
                , while giving founders and HR leaders the visibility they
                need.
              </p>
            </div>

            <div className="space-y-4 text-sm text-slate-700">
              <h2 className="text-base font-semibold text-slate-900">
                What we care about
              </h2>
              <ul className="space-y-2 text-sm text-slate-700">
                <li>
                  <span className="font-semibold">Clarity over complexity.</span>{" "}
                  Features should make work easier, not heavier.
                </li>
                <li>
                  <span className="font-semibold">Multi-tenant by design.</span>{" "}
                  Agencies, platforms and multi-brand organisations shouldn’t
                  have to hack around single-tenant tools.
                </li>
                <li>
                  <span className="font-semibold">Honest hiring.</span> Tools
                  that encourage structured processes, clear feedback and better
                  candidate experiences.
                </li>
                <li>
                  <span className="font-semibold">African markets first.</span>{" "}
                  Global-grade product with deep respect for how hiring gets
                  done across Nigeria, Africa and other emerging ecosystems.
                </li>
              </ul>
            </div>
          </div>
        </Container>
      </section>
    </main>
  );
}
