import Link from "next/link";

export const metadata = {
  title: "Services for Employers | Resourcin",
  description:
    "Resourcin helps high-growth companies hire, manage, and retain talent across Africa and beyond through Talent Acquisition, RPO, EOR and Executive Search.",
};

const services = [
  {
    id: "ta",
    name: "Talent Acquisition (Contingent & Retained)",
    badge: "Core",
    summary:
      "End-to-end recruiting for critical roles — from intake to shortlist, interviews, and offer support.",
    bullets: [
      "Role scoping, compensation benchmarking, and market mapping",
      "Sourcing, screening, and competency-based interviews",
      "Shortlists with calibrated, write-ups you can act on",
      "Offer negotiation support and candidate closing",
    ],
    idealFor: "Companies that need predictable recruiting support without building a large in-house team.",
  },
  {
    id: "exec",
    name: "Executive Search",
    badge: "Leadership",
    summary:
      "Partner-level search for CEOs, functional heads, and mission-critical leadership roles.",
    bullets: [
      "Structured search strategy, target-company mapping and outreach",
      "Deep-dive interviews and leadership assessment support",
      "Stakeholder alignment on scorecards and expectations",
      "Tightly-managed candidate experience and communication",
    ],
    idealFor: "Founders, boards, and investors hiring leaders who will shape direction, culture, and results.",
  },
  {
    id: "rpo",
    name: "Recruitment Process Outsourcing (RPO)",
    badge: "Scale",
    summary:
      "Plug-in recruiting pods for volume hiring, project hiring, or aggressive growth campaigns.",
    bullets: [
      "Dedicated Resourcin recruiting squad aligned to your tools and rituals",
      "Pipeline generation across multiple roles and locations",
      "Recruitment analytics, funnel insights, and weekly reporting",
      "Flexible scope — from 3-month sprints to longer-term engagements",
    ],
    idealFor: "Businesses entering new markets, launching new products, or clearing recruitment backlogs.",
  },
  {
    id: "eor",
    name: "Employer of Record (EOR) & HR Support",
    badge: "Compliance",
    summary:
      "Hire talent compliantly in Nigeria and across Africa without setting up legal entities.",
    bullets: [
      "Local contracts, compliance, and statutory remittances",
      "Payroll administration and basic HR support",
      "Onboarding coordination and policy alignment",
      "Optional add-ons: performance, learning, and HR advisory",
    ],
    idealFor: "Global companies testing or scaling into African markets without building a full HR/legal stack.",
  },
];

export default function ServicesPage() {
  return (
    <main className="bg-slate-50 min-h-screen">
      <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <header className="mb-10 max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#306B34]">
            For Employers
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
            Services to help you hire, manage, and retain great talent.
          </h1>
          <p className="mt-4 text-sm text-slate-600 sm:text-base">
            Resourcin plugs into your leadership team as a People partner —
            combining recruiting, HR expertise, and market knowledge to help you
            hire well, move faster, and protect your people costs.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/request-talent"
              className="rounded-full bg-[#172965] px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#111c4e]"
            >
              Request Talent
            </Link>
            <Link
              href="/contact"
              className="rounded-full border border-slate-300 bg-white px-5 py-2 text-sm font-medium text-slate-700 hover:border-[#172965] hover:text-[#172965]"
            >
              Talk to a People Partner
            </Link>
          </div>
        </header>

        <div className="grid gap-6 md:grid-cols-2">
          {services.map((service) => (
            <article
              key={service.id}
              className="flex h-full flex-col justify-between rounded-2xl border border-slate-200 bg-white/90 p-5 shadow-sm"
            >
              <div>
                <div className="mb-3 flex items-center justify-between gap-2">
                  <h2 className="text-base font-semibold text-slate-900">
                    {service.name}
                  </h2>
                  <span className="inline-flex items-center rounded-full bg-[#172965]/5 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-[#172965]">
                    {service.badge}
                  </span>
                </div>
                <p className="text-sm text-slate-600">{service.summary}</p>
                <ul className="mt-4 space-y-1.5 text-sm text-slate-700">
                  {service.bullets.map((item) => (
                    <li key={item} className="flex gap-2">
                      <span className="mt-[6px] h-1.5 w-1.5 flex-shrink-0 rounded-full bg-[#64C247]" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="mt-4 border-t border-slate-100 pt-3 text-xs text-slate-500">
                <span className="font-medium text-slate-600">Best for: </span>
                {service.idealFor}
              </div>
            </article>
          ))}
        </div>

        <section className="mt-10 rounded-2xl border border-[#172965]/10 bg-[#172965]/5 p-5 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="max-w-xl">
              <h2 className="text-base font-semibold text-slate-900">
                Not sure which service fits?
              </h2>
              <p className="mt-1.5 text-sm text-slate-600">
                We can start with a light-touch discovery call — understand your
                hiring goals, constraints, and internal capacity — then suggest
                the minimal setup that gets you moving.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/request-talent"
                className="rounded-full bg-[#172965] px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#111c4e]"
              >
                Share a hiring brief
              </Link>
              <Link
                href="/contact"
                className="rounded-full border border-slate-300 bg-white px-5 py-2 text-sm font-medium text-slate-700 hover:border-[#172965] hover:text-[#172965]"
              >
                Book a quick call
              </Link>
            </div>
          </div>
        </section>
      </section>
    </main>
  );
}
