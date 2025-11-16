export const metadata = {
  title: "About Resourcin | Human Capital Advisors",
  description:
    "Resourcin is a boutique human capital partner helping companies design lean people systems, hire critical talent, and scale responsibly.",
};

export default function AboutPage() {
  return (
    <main className="bg-slate-50 min-h-screen">
      <section className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
        <header className="mb-8 max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#306B34]">
            About
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
            A people partner for founders, HR leaders, and investors.
          </h1>
          <p className="mt-3 text-sm text-slate-600 sm:text-base">
            Resourcin sits at the intersection of recruiting, HR operations, and
            business strategy. We help you make better people decisions, not
            just run hiring processes.
          </p>
        </header>

        <div className="space-y-8 text-sm text-slate-700 sm:text-[15px]">
          <section className="rounded-2xl border border-slate-200 bg-white/90 p-5 shadow-sm">
            <h2 className="text-base font-semibold text-slate-900">
              What we believe
            </h2>
            <p className="mt-3">
              Most organisations don&apos;t fail because they lack ideas or
              capital — they fail because hiring, incentives, and execution are
              misaligned. We exist to reduce that gap: between what leaders say
              in strategy decks and what actually happens in teams.
            </p>
            <p className="mt-3">
              We bring an operator mindset to HR and recruiting: clear targets,
              tight feedback loops, and a bias for practical solutions over
              heavyweight frameworks.
            </p>
          </section>

          <section className="grid gap-5 md:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-sm">
              <h3 className="text-sm font-semibold text-slate-900">
                Operator DNA
              </h3>
              <p className="mt-2 text-sm text-slate-600">
                We think like operators, not vendors — linking roles and HR
                work directly to revenue, risk, and runway.
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-sm">
              <h3 className="text-sm font-semibold text-slate-900">
                Data-aware, not data-blind
              </h3>
              <p className="mt-2 text-sm text-slate-600">
                We use data where it matters — funnel metrics, people-costs,
                role performance — without losing the nuance of people.
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-sm">
              <h3 className="text-sm font-semibold text-slate-900">
                Long-term relationships
              </h3>
              <p className="mt-2 text-sm text-slate-600">
                Many of our best clients start with a single role or project
                and stay with us as their People partner over multiple cycles.
              </p>
            </div>
          </section>

          <section className="rounded-2xl border border-[#172965]/10 bg-[#172965]/5 p-5">
            <h2 className="text-base font-semibold text-slate-900">
              How we plug into your team
            </h2>
            <ul className="mt-3 space-y-2 text-sm text-slate-700">
              <li className="flex gap-2">
                <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-[#64C247]" />
                <span>
                  As an extended recruiting arm — running searches, managing
                  pipelines, and representing your brand in the market.
                </span>
              </li>
              <li className="flex gap-2">
                <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-[#64C247]" />
                <span>
                  As a People Ops partner — designing or tuning your people
                  systems: performance, compensation, onboarding, and more.
                </span>
              </li>
              <li className="flex gap-2">
                <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-[#64C247]" />
                <span>
                  As a sounding board for leadership — helping you pressure-test
                  hiring plans, org design, and people decisions.
                </span>
              </li>
            </ul>
          </section>
        </div>
      </section>
    </main>
  );
}
