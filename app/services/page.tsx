// app/services/page.tsx
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Services | Resourcin",
  description:
    "Resourcin helps founders and people leaders hire top talent across Africa and beyond through Talent Acquisition, RPO pods, Employer of Record, and Executive Search.",
};

const services = [
  {
    id: "talent-acquisition",
    name: "Talent Acquisition Projects",
    tag: "Contingent & retained search",
    summary:
      "Targeted searches for IC and mid–senior roles where quality of shortlist and speed to offer matter most.",
    problems: [
      "You don’t have capacity to run structured sourcing and screening in-house.",
      "You’ve tried “post and pray” job boards and referrals, but the pipeline is thin.",
      "You want clean, interview-ready shortlists, not stacks of unqualified CVs.",
    ],
    outcomes: [
      "Curated shortlists (4–7 candidates per role) aligned on skills, comp and culture.",
      "Structured screening notes you can share internally with Hiring Managers.",
      "Clear funnel visibility: outreach, response, interviews, offers, declines.",
    ],
    bestFor: [
      "Growth roles (Product, Engineering, Sales, Ops, Finance).",
      "Hard-to-fill specialist roles (Payments, Lending, Infrastructure, Data).",
      "Founding or early leadership hires in new markets.",
    ],
  },
  {
    id: "rpo",
    name: "RPO Pods (Embedded Recruiting)",
    tag: "On-demand hiring pods",
    summary:
      "A dedicated Resourcin recruiter or pod embedded into your team to run hiring sprints for 3–12 months.",
    problems: [
      "You have aggressive headcount targets and a lean internal People team.",
      "You’re scaling into new markets and need local talent intelligence quickly.",
      "You want someone to own the entire hiring engine end-to-end for a period.",
    ],
    outcomes: [
      "Predictable weekly pipeline reviews and hiring dashboards.",
      "Standardized interview loops, scorecards and feedback discipline.",
      "Upskilled internal managers on interviewing and closing candidates.",
    ],
    bestFor: [
      "Series A+ companies with quarterly hiring sprints.",
      "Multi-country hiring (e.g. Nigeria, Kenya, Ghana, remote talent).",
      "Teams preparing for funding / board visibility on People metrics.",
    ],
  },
  {
    id: "eor",
    name: "Employer of Record (EOR)",
    tag: "Hire across borders compliantly",
    summary:
      "Hire talent in markets where you don’t yet have an entity — while we handle payroll, compliance and HR admin.",
    problems: [
      "You’ve identified talent in a new market but don’t have a local legal entity.",
      "You want to avoid wrestling with local payroll, tax and compliance nuances.",
      "You need one consolidated invoice and consistent experience for remote staff.",
    ],
    outcomes: [
      "Compliant employment contracts and onboarding in each supported country.",
      "Local payroll, statutory deductions and benefits managed for you.",
      "Single monthly invoice and simple offboarding when things change.",
    ],
    bestFor: [
      "Remote-first or hybrid companies hiring in new African markets.",
      "Testing new markets before committing to a legal entity.",
      "Contract-to-hire or project-based engagements that need structure.",
    ],
  },
  {
    id: "exec-search",
    name: "Executive & Leadership Search",
    tag: "C-level & business-critical roles",
    summary:
      "Deep, partner-led search for executives and senior leaders who can own P&L, teams and strategy.",
    problems: [
      "You need a leader who can operate at board level and in the trenches.",
      "You want a tight slate, not a long list of semi-relevant profiles.",
      "You need structured assessment beyond CVs and charisma.",
    ],
    outcomes: [
      "Mapped landscape of target companies and talent pools.",
      "Multi-stage evaluation: leadership interviews, case studies, references.",
      "Offer design support and transition planning for the first 90 days.",
    ],
    bestFor: [
      "C-suite roles (CEO, COO, CPO, CTO, CFO).",
      "Country Managers and Business Unit Heads.",
      "Heads of People, Sales, Operations, or Engineering.",
    ],
  },
];

const processSteps = [
  {
    title: "1. Brief & calibration",
    text: "We co-define the role, success profile, comp bands, and must-have vs nice-to-have criteria.",
  },
  {
    title: "2. Market mapping & outreach",
    text: "We map target companies, tap our network, and run structured outbound to qualified talent.",
  },
  {
    title: "3. Screening & shortlists",
    text: "We screen for skills, motivations, comp and culture — and send you structured shortlists.",
  },
  {
    title: "4. Interviews & decision support",
    text: "We coordinate interviews, align feedback, and help you compare trade-offs between finalists.",
  },
  {
    title: "5. Offer, close & onboarding",
    text: "We support offer design, closing, and the first days of onboarding so new hires land well.",
  },
];

const valuePoints = [
  {
    title: "Signal over noise",
    text: "You get curated shortlists with context, not 200+ unfiltered CVs. Every profile comes with notes you can react to.",
  },
  {
    title: "Embedded thinking",
    text: "We operate like an extension of your team: your tools, your rituals, your priorities — with our playbooks behind the scenes.",
  },
  {
    title: "Multi-country reach",
    text: "We understand local nuances in Nigeria and across African markets, plus remote talent that works well with your stack.",
  },
  {
    title: "Operator’s lens",
    text: "We’ve been on the People & Ops side of the table. We know what it means to hire for delivery, not just titles.",
  },
];

export default function ServicesPage() {
  return (
    <div className="bg-slate-50 min-h-screen">
      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        {/* Hero */}
        <section className="mb-10">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-1 text-xs font-medium text-slate-600 ring-1 ring-slate-200">
            <span className="h-2 w-2 rounded-full bg-[#64C247]" />
            Built for founders, HR leaders & hiring managers
          </div>

          <div className="mt-4 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <h1 className="text-3xl font-semibold tracking-tight text-[#172965] sm:text-4xl">
                Hiring services that match your ambition – not just your job
                descriptions.
              </h1>
              <p className="mt-4 text-sm sm:text-base text-slate-600">
                Resourcin partners with employers to run calm, structured hiring
                across Africa and remote markets. Whether you need a single
                critical hire or a full hiring sprint, we plug into your stack
                and own the engine.
              </p>
            </div>

            <div className="flex flex-col items-start gap-3 text-sm lg:items-end">
              <div className="rounded-xl bg-white px-4 py-3 shadow-sm ring-1 ring-slate-200">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Typical engagement
                </p>
                <p className="mt-1 text-sm text-slate-700">
                  4–8-week search cycles • Weekly pipeline reviews • Clear
                  time-to-shortlist and time-to-offer metrics.
                </p>
              </div>
              <Link
                href="/request-talent"
                className="inline-flex items-center justify-center rounded-lg bg-[#172965] px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-[#0f1c46] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#172965]"
              >
                Request talent
                <span className="ml-2 text-xs" aria-hidden="true">
                  →
                </span>
              </Link>
            </div>
          </div>
        </section>

        {/* Services list */}
        <section className="mb-12">
          <div className="mb-6 flex items-center justify-between gap-4">
            <h2 className="text-lg font-semibold text-[#172965]">
              Services (For Employers)
            </h2>
            <div className="hidden gap-2 text-xs text-slate-500 sm:flex">
              {services.map((s) => (
                <a
                  key={s.id}
                  href={`#${s.id}`}
                  className="rounded-full bg-white px-3 py-1 ring-1 ring-slate-200 hover:text-[#172965]"
                >
                  {s.name}
                </a>
              ))}
            </div>
          </div>

          <div className="space-y-8">
            {services.map((service) => (
              <article
                key={service.id}
                id={service.id}
                className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200 sm:p-7"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="max-w-xl">
                    <div className="inline-flex items-center gap-2 rounded-full bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600 ring-1 ring-slate-200">
                      <span className="h-1.5 w-1.5 rounded-full bg-[#306B34]" />
                      {service.tag}
                    </div>
                    <h3 className="mt-3 text-xl font-semibold text-[#172965]">
                      {service.name}
                    </h3>
                    <p className="mt-2 text-sm text-slate-600">
                      {service.summary}
                    </p>
                  </div>

                  <div className="flex flex-col items-start gap-2 text-xs sm:text-sm sm:items-end">
                    <p className="rounded-lg bg-slate-50 px-3 py-2 text-slate-600 ring-1 ring-slate-200">
                      <span className="font-medium text-[#172965]">
                        Typical scope:
                      </span>{" "}
                      3–6 roles / brief or 1 leadership mandate at a time.
                    </p>
                    <Link
                      href="/request-talent"
                      className="inline-flex items-center justify-center rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-[#172965] hover:bg-slate-50"
                    >
                      Discuss this service
                      <span className="ml-1 text-[0.7rem]" aria-hidden="true">
                        →
                      </span>
                    </Link>
                  </div>
                </div>

                <div className="mt-5 grid gap-6 md:grid-cols-3">
                  <div>
                    <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      When this helps
                    </h4>
                    <ul className="mt-2 space-y-2 text-sm text-slate-600">
                      {service.problems.map((item) => (
                        <li key={item} className="flex gap-2">
                          <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-[#64C247]" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      What you get
                    </h4>
                    <ul className="mt-2 space-y-2 text-sm text-slate-600">
                      {service.outcomes.map((item) => (
                        <li key={item} className="flex gap-2">
                          <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-[#64C247]" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Best suited for
                    </h4>
                    <ul className="mt-2 space-y-2 text-sm text-slate-600">
                      {service.bestFor.map((item) => (
                        <li key={item} className="flex gap-2">
                          <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-slate-300" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* How we work */}
        <section className="mb-12 rounded-2xl bg-[#172965] px-5 py-7 text-slate-100 sm:px-7">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold">How we work with you</h2>
              <p className="mt-2 text-sm text-slate-200/80">
                A simple, transparent process you can plug into your existing
                operating rhythm — with clear owners and next steps at every
                stage.
              </p>
            </div>
            <Link
              href="/request-talent"
              className="inline-flex items-center justify-center rounded-lg bg-white px-4 py-2 text-sm font-medium text-[#172965] shadow-sm hover:bg-slate-100"
            >
              Share a hiring brief
              <span className="ml-2 text-xs" aria-hidden="true">
                →
              </span>
            </Link>
          </div>

          <ol className="mt-6 grid gap-4 text-sm sm:grid-cols-3 lg:grid-cols-5">
            {processSteps.map((step) => (
              <li
                key={step.title}
                className="rounded-xl bg-white/5 p-4 ring-1 ring-white/10"
              >
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-200">
                  {step.title}
                </p>
                <p className="mt-2 text-xs text-slate-200/80">{step.text}</p>
              </li>
            ))}
          </ol>
        </section>

        {/* Why Resourcin */}
        <section className="mb-6">
          <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-[#172965]">
                Why teams choose Resourcin
              </h2>
              <p className="mt-1 text-sm text-slate-600">
                Underneath every engagement is the same obsession: clean
                delivery, clear communication, and hires who actually ship work.
              </p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {valuePoints.map((point) => (
              <div
                key={point.title}
                className="flex h-full flex-col justify-between rounded-2xl bg-white p-4 text-sm text-slate-600 shadow-sm ring-1 ring-slate-200"
              >
                <div>
                  <h3 className="text-sm font-semibold text-[#172965]">
                    {point.title}
                  </h3>
                  <p className="mt-2">{point.text}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Final CTA */}
        <section className="mt-8 rounded-2xl bg-white px-5 py-6 shadow-sm ring-1 ring-slate-200 sm:px-7">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-base font-semibold text-[#172965]">
                Have a role or sprint in mind?
              </h2>
              <p className="mt-1 text-sm text-slate-600">
                Share a brief for one role, or a full hiring sprint. We’ll
                respond with a simple plan, commercials, and a realistic
                timeline.
              </p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <Link
                href="/request-talent"
                className="inline-flex items-center justify-center rounded-lg bg-[#172965] px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-[#0f1c46]"
              >
                Request talent
                <span className="ml-2 text-xs" aria-hidden="true">
                  →
                </span>
              </Link>
              <Link
                href="/contact"
                className="inline-flex items-center justify-center rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-[#172965] hover:bg-slate-50"
              >
                Talk to us first
              </Link>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
