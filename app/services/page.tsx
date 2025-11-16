import Link from "next/link";
import {
  Briefcase,
  Users,
  Globe2,
  Layers,
  Sparkles,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";

export const metadata = {
  title: "Services | Resourcin",
  description:
    "Specialised hiring and HR support for growth-focused teams – talent acquisition, RPO, executive search, EOR, and white-label job boards.",
};

type ServiceBlock = {
  id: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  label: string;
  badge?: string;
  description: string;
  bullets: string[];
};

const TALENT_SERVICES: ServiceBlock[] = [
  {
    id: "contingent",
    icon: Briefcase,
    label: "Talent acquisition (contingent search)",
    badge: "Pay on success",
    description:
      "Hands-on search for specialist and mid-senior roles across Product, Engineering, Operations, GTM, and Back-office.",
    bullets: [
      "Role calibration and scorecard design",
      "Outbound sourcing + shortlisting",
      "Structured interviews and stakeholder debriefs",
      "Offer support and closing",
    ],
  },
  {
    id: "executive",
    icon: Sparkles,
    label: "Executive & leadership search",
    badge: "Retained",
    description:
      "Targeted leadership search for C-level, VP, and GM roles where context, chemistry, and track record really matter.",
    bullets: [
      "Market mapping and target-list build",
      "Competency and culture-fit assessments",
      "Board-level shortlists and references",
      "Onboarding and first-90-day support",
    ],
  },
  {
    id: "pipeline",
    icon: Layers,
    label: "Talent pipelining & bench building",
    description:
      "Always-on talent pools for roles you hire repeatedly – SDRs, agents, analysts, engineers, and operational staff.",
    bullets: [
      "Talent pool design and SLA definition",
      "Always-on sourcing and screening",
      "Bench of ‘ready-to-hire’ candidates",
      "Simple pricing per successful hire",
    ],
  },
];

const MODEL_SERVICES: ServiceBlock[] = [
  {
    id: "rpo-lite",
    icon: Users,
    label: "Embedded recruiter (RPO-lite)",
    description:
      "A Resourcin recruiter embedded in your team to own requisitions, process, and candidate experience.",
    bullets: [
      "Part-time or full-time engagement",
      "Works inside your ATS / tools",
      "Drives hiring managers and pipelines",
      "Monthly retainer + success bonus",
    ],
  },
  {
    id: "rpo",
    icon: Globe2,
    label: "Full RPO squads",
    description:
      "End-to-end hiring managed by a pod (recruiter + coordinator + sourcer) with clear monthly targets.",
    bullets: [
      "Team for volume or multi-country hiring",
      "Demand planning and intake meetings",
      "Weekly pipeline and SLA reporting",
      "Aligned to hiring and cost targets",
    ],
  },
  {
    id: "eor",
    icon: Briefcase,
    label: "Employer of Record (via partners)",
    description:
      "Hire and pay talent compliantly in markets where you don’t yet have an entity, using trusted EOR partners.",
    bullets: [
      "Partner selection and coordination",
      "Single point of contact through Resourcin",
      "Offer, contract, and payroll support",
      "Ideal for test-and-learn market entries",
    ],
  },
];

const JOB_BOARD_SERVICE: ServiceBlock = {
  id: "job-board",
  icon: Layers,
  label: "White-label job board & careers microsite",
  badge: "Coming soon",
  description:
    "Turn our jobs platform into your branded careers board – or plug into the Resourcin network as a hosted tenant.",
  bullets: [
    "Custom branding, domain, and copy",
    "Multi-tenant job board with recruiter logins",
    "Candidate application + talent pool sync",
    "Analytics on views, applies, and sources",
  ],
};

export default function ServicesPage() {
  return (
    <main className="bg-slate-50/60">
      {/* Hero */}
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-10 sm:px-6 sm:py-12 lg:px-8 lg:py-14">
          <div className="max-w-3xl">
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-sky-600">
              For employers
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
              Hiring and HR services that plug into how you actually work.
            </h1>
            <p className="mt-3 text-sm text-slate-600 sm:text-base">
              Whether you&apos;re filling a critical leadership role, building an
              operations team, or spinning up a new country, Resourcin gives you a
              pragmatic, data-conscious hiring partner – not just CVs.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600">
            <div className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
              <span>Contingent & retained search</span>
            </div>
            <div className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
              <span>Embedded recruiters & RPO</span>
            </div>
            <div className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
              <span>White-label job board (SaaS)</span>
            </div>

            <div className="grow" />

            <div className="flex flex-wrap gap-2">
              <Link
                href="/request-talent"
                className="inline-flex items-center justify-center rounded-full bg-slate-900 px-5 py-2 text-xs font-medium text-white shadow-sm hover:bg-slate-800"
              >
                Request talent
                <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
              </Link>
              <Link
                href="/contact"
                className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-4 py-2 text-xs font-medium text-slate-800 hover:border-slate-400"
              >
                Talk to the team
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Talent services */}
      <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold tracking-tight text-slate-900 sm:text-2xl">
              Talent acquisition & search
            </h2>
            <p className="mt-1 max-w-2xl text-sm text-slate-600">
              For companies that care about both quality of hire and speed. We combine
              targeted sourcing, structured interviews, and honest feedback so you can
              hire with conviction.
            </p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {TALENT_SERVICES.map((service) => {
            const Icon = service.icon;
            return (
              <article
                key={service.id}
                className="flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <div className="mb-3 flex items-center gap-2">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-sky-50">
                    <Icon className="h-5 w-5 text-sky-600" />
                  </span>
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900">
                      {service.label}
                    </h3>
                    {service.badge && (
                      <p className="mt-0.5 inline-flex rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
                        {service.badge}
                      </p>
                    )}
                  </div>
                </div>
                <p className="mb-3 text-sm text-slate-600">{service.description}</p>
                <ul className="mt-auto space-y-1.5 text-sm text-slate-600">
                  {service.bullets.map((item) => (
                    <li key={item} className="flex gap-2">
                      <span className="mt-1 h-1.5 w-1.5 rounded-full bg-sky-500" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </article>
            );
          })}
        </div>
      </section>

      {/* Hiring models / RPO / EOR */}
      <section className="border-y border-slate-200 bg-slate-50/80">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-xl font-semibold tracking-tight text-slate-900 sm:text-2xl">
                Flexible hiring models
              </h2>
              <p className="mt-1 max-w-2xl text-sm text-slate-600">
                Start with a single critical role and scale up to embedded recruiters or
                full RPO pods as your hiring needs grow.
              </p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {MODEL_SERVICES.map((service) => {
              const Icon = service.icon;
              return (
                <article
                  key={service.id}
                  className="flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                >
                  <div className="mb-3 flex items-center gap-2">
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-50">
                      <Icon className="h-5 w-5 text-emerald-700" />
                    </span>
                    <h3 className="text-sm font-semibold text-slate-900">
                      {service.label}
                    </h3>
                  </div>
                  <p className="mb-3 text-sm text-slate-600">{service.description}</p>
                  <ul className="mt-auto space-y-1.5 text-sm text-slate-600">
                    {service.bullets.map((item) => (
                      <li key={item} className="flex gap-2">
                        <span className="mt-1 h-1.5 w-1.5 rounded-full bg-emerald-500" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {/* Job board SaaS */}
      <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid gap-6 md:grid-cols-[1.5fr,1fr] md:items-center">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">
              Resourcin platform
            </p>
            <h2 className="mt-2 text-xl font-semibold tracking-tight text-slate-900 sm:text-2xl">
              White-label job board & careers microsite
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              The same jobs experience we use for the Resourcin Talent Network can be
              turned into a branded job board for your company – or for multiple
              portfolio companies, business units, or clients.
            </p>

            <div className="mt-4 rounded-2xl border border-dashed border-amber-300 bg-amber-50/70 p-4 text-sm text-amber-900">
              <div className="mb-1 inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-medium">
                <Sparkles className="h-3 w-3" />
                Coming soon – SaaS for employers
              </div>
              <p className="mt-1">
                Multi-tenant by design: each employer gets a configuration (logo,
                colours, URL, copy) and a view filtered to their jobs only. The same
                engine powers your internal careers page and the Resourcin network.
              </p>
            </div>

            <ul className="mt-4 space-y-1.5 text-sm text-slate-600">
              {JOB_BOARD_SERVICE.bullets.map((item) => (
                <li key={item} className="flex gap-2">
                  <span className="mt-1 h-1.5 w-1.5 rounded-full bg-slate-900" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-slate-900">
              How a tenant works (high-level)
            </h3>
            <ol className="mt-3 space-y-2 text-sm text-slate-600">
              <li>
                <span className="font-medium text-slate-900">1. Configure tenant.</span>{" "}
                Define <code className="rounded bg-slate-100 px-1">tenantId</code>, brand
                settings, and URL.
              </li>
              <li>
                <span className="font-medium text-slate-900">2. Attach jobs.</span> Link
                jobs to the tenant via a simple field (e.g.{" "}
                <code className="rounded bg-slate-100 px-1">tenantId</code> on the job
                record).
              </li>
              <li>
                <span className="font-medium text-slate-900">3. Expose board.</span>{" "}
                Employer sees only their jobs and receives applies in their inbox / ATS,
                while Resourcin still sees aggregate data.
              </li>
            </ol>

            <div className="mt-4 rounded-xl bg-slate-900 px-4 py-3 text-xs text-slate-100">
              <p className="font-medium">Interested in white-label?</p>
              <p className="mt-1">
                We can prioritise your use-case in the roadmap. Share a quick brief and
                we&apos;ll respond with options.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Link
                  href="/request-talent"
                  className="inline-flex items-center justify-center rounded-full bg-white px-3.5 py-1.5 text-[11px] font-medium text-slate-900"
                >
                  Share your use-case
                  <ArrowRight className="ml-1.5 h-3 w-3" />
                </Link>
                <Link
                  href="/contact"
                  className="inline-flex items-center justify-center rounded-full border border-slate-500 px-3.5 py-1.5 text-[11px] text-slate-100 hover:border-slate-300"
                >
                  Book a short call
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-4 px-4 py-8 sm:flex-row sm:items-center sm:px-6 lg:px-8">
          <div>
            <h2 className="text-lg font-semibold text-slate-900 sm:text-xl">
              Ready to brief a role or build a hiring plan?
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              Tell us what you&apos;re trying to achieve – we&apos;ll respond with
              options, timelines, and a simple engagement model.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/request-talent"
              className="inline-flex items-center justify-center rounded-full bg-slate-900 px-5 py-2 text-xs font-medium text-white shadow-sm hover:bg-slate-800"
            >
              Request talent
              <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
            </Link>
            <Link
              href="/about"
              className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-4 py-2 text-xs font-medium text-slate-800 hover:border-slate-400"
            >
              Learn more about Resourcin
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
