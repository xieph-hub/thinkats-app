// app/pricing/page.tsx
import type { Metadata } from "next";
import Container from "@/components/Container";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Pricing | ThinkATS",
  description:
    "Simple, scalable pricing for recruitment agencies, HR teams and staffing firms. Start with a free trial and upgrade as you grow.",
};

const plans = [
  {
    name: "Starter",
    price: "$99",
    cadence: "month",
    highlight: "For small teams getting out of spreadsheets",
    badge: null,
    features: [
      "1 user included",
      "Up to 10 active jobs",
      "Standard pipeline stages",
      "Basic career site (thinkats.com subdomain)",
      "Email support",
    ],
  },
  {
    name: "Professional",
    price: "$299",
    cadence: "month",
    highlight: "Most popular for growing agencies and HR teams",
    badge: "Most popular",
    features: [
      "Up to 5 users included",
      "Unlimited active jobs",
      "Custom stages & templates",
      "Custom domain for career site",
      "Priority email support",
      "Advanced analytics (roadmap)",
    ],
  },
  {
    name: "Business",
    price: "$699",
    cadence: "month",
    highlight: "For multi-brand teams and high-volume hiring",
    badge: null,
    features: [
      "Up to 15 users included",
      "Unlimited jobs & candidates",
      "White-label options",
      "API access",
      "Dedicated account manager",
      "Custom integrations (scoped)",
    ],
  },
  {
    name: "Enterprise",
    price: "Custom",
    cadence: "",
    highlight: "For groups, enterprises and platform partners",
    badge: null,
    features: [
      "Unlimited users (negotiated)",
      "Multi-tenant management",
      "SSO & advanced security",
      "Custom SLA & uptime targets",
      "Bespoke onboarding & migration",
      "Roadmap input & co-design",
    ],
  },
];

export default function PricingPage() {
  return (
    <main className="bg-white">
      <section className="border-b bg-slate-50 py-12 md:py-16">
        <Container>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
            Pricing
          </p>
          <h1 className="mt-3 text-3xl font-bold text-slate-900 md:text-4xl">
            Pricing that grows with your hiring footprint.
          </h1>
          <p className="mt-3 max-w-2xl text-sm text-slate-600 md:text-base">
            Start with a free 14-day trial. No credit card needed. Upgrade when
            you&apos;re ready to bring your whole team and client base onto
            ThinkATS.
          </p>

          <p className="mt-3 text-xs text-slate-500">
            All prices in USD. Local currency billing and annual discounts can be
            discussed with our sales team.
          </p>
        </Container>
      </section>

      <section className="py-12 md:py-16">
        <Container>
          <div className="grid gap-6 md:grid-cols-4">
            {plans.map((plan) => (
              <article
                key={plan.name}
                className={`flex flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm ${
                  plan.badge ? "ring-2 ring-[#1E40AF]/80" : ""
                }`}
              >
                {plan.badge && (
                  <span className="inline-flex w-fit items-center rounded-full bg-[#1E40AF]/5 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-[#1E40AF]">
                    {plan.badge}
                  </span>
                )}
                <h2 className="mt-2 text-sm font-semibold text-slate-900">
                  {plan.name}
                </h2>
                <p className="mt-1 text-xs text-slate-600">{plan.highlight}</p>

                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-2xl font-bold text-slate-900">
                    {plan.price}
                  </span>
                  {plan.cadence && (
                    <span className="text-xs text-slate-500">
                      /{plan.cadence}
                    </span>
                  )}
                </div>

                <ul className="mt-4 flex-1 space-y-1.5 text-xs text-slate-600">
                  {plan.features.map((f) => (
                    <li key={f} className="flex gap-2">
                      <span className="mt-[3px] inline-block h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>

                <div className="mt-5">
                  {plan.name === "Enterprise" ? (
                    <Link
                      href="/contact"
                      className="inline-flex w-full items-center justify-center rounded-full border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-800 hover:bg-slate-50"
                    >
                      Talk to sales
                    </Link>
                  ) : (
                    <Link
                      href="/signup"
                      className="inline-flex w-full items-center justify-center rounded-full bg-[#1E40AF] px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-[#1D4ED8]"
                    >
                      Start free trial
                    </Link>
                  )}
                </div>
              </article>
            ))}
          </div>

          <p className="mt-8 text-xs text-slate-500">
            Need a different configuration (more users, region-specific hosting,
            migration support)?{" "}
            <Link
              href="/contact"
              className="font-semibold text-[#1E40AF] hover:underline"
            >
              Let&apos;s talk.
            </Link>
          </p>
        </Container>
      </section>
    </main>
  );
}
