// app/solutions/page.tsx
import type { Metadata } from "next";
import Container from "@/components/Container";

export const metadata: Metadata = {
  title: "Solutions | ThinkATS",
  description:
    "See how ThinkATS supports small agencies, mid-market teams and enterprise organisations across multiple hiring use cases.",
};

const sizeBlocks = [
  {
    title: "Small agencies (1–10 recruiters)",
    body: "Get out of spreadsheets and shared inboxes. Publish roles in minutes, track every candidate and keep clients updated without extra admin.",
    bullets: [
      "Fast setup, minimal configuration",
      "Job templates for repeat roles",
      "Client-friendly reporting (roadmap)",
    ],
  },
  {
    title: "Mid-market teams (11–50 recruiters)",
    body: "Standardise pipelines and collaboration as your team grows so hiring quality doesn’t depend on one or two star recruiters.",
    bullets: [
      "Custom stages per function",
      "Role-based access & permissions",
      "Shared templates and email copy",
    ],
  },
  {
    title: "Enterprise & multi-brand",
    body: "Run multiple brands, regions or business units on one ATS while keeping access, data and branding cleanly separated.",
    bullets: [
      "Multi-tenant architecture from day one",
      "Per-client or per-brand career sites",
      "API access and SSO on higher plans",
    ],
  },
];

const useCaseBlocks = [
  {
    title: "White-label career sites",
    body: "Offer branded career portals as part of your service, hosted on ThinkATS and controlled from your back-office.",
  },
  {
    title: "Multi-client management",
    body: "Keep each client’s roles, candidates and reporting separate while your team works from one place.",
  },
  {
    title: "Candidate relationship management",
    body: "Build reusable talent pools, track interactions and reuse candidates across future roles.",
  },
  {
    title: "Recruitment marketing",
    body: "Publish roles quickly, control the on-page story and track which sources and campaigns actually convert.",
  },
];

export default function SolutionsPage() {
  return (
    <main className="bg-white">
      <section className="border-b bg-slate-50 py-12 md:py-16">
        <Container>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
            Solutions
          </p>
          <h1 className="mt-3 text-3xl font-bold text-slate-900 md:text-4xl">
            Solutions for agencies, in-house teams and staffing firms.
          </h1>
          <p className="mt-3 max-w-2xl text-sm text-slate-600 md:text-base">
            Whether you’re running a specialist search firm, a BPO operation or
            a multi-country HR team, ThinkATS gives you the structure to keep
            hiring predictable, visible and scalable.
          </p>
        </Container>
      </section>

      <section className="py-12 md:py-16">
        <Container>
          <div className="max-w-3xl">
            <h2 className="text-lg font-semibold text-slate-900 md:text-xl">
              By company size
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              Start lean and grow without having to migrate tools when your team
              or client list doubles.
            </p>
          </div>

          <div className="mt-8 grid gap-6 md:grid-cols-3">
            {sizeBlocks.map((block) => (
              <article
                key={block.title}
                className="flex flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <h3 className="text-sm font-semibold text-slate-900">
                  {block.title}
                </h3>
                <p className="mt-2 text-xs text-slate-600">{block.body}</p>
                <ul className="mt-3 space-y-1.5 text-xs text-slate-600">
                  {block.bullets.map((b) => (
                    <li key={b} className="flex gap-2">
                      <span className="mt-[3px] inline-block h-1.5 w-1.5 rounded-full bg-[#1E40AF]" />
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>

          <div className="mt-12 max-w-3xl">
            <h2 className="text-lg font-semibold text-slate-900 md:text-xl">
              By use case
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              ThinkATS is opinionated enough to give you guardrails, but flexible
              enough to support the kind of hiring work you actually do.
            </p>
          </div>

          <div className="mt-8 grid gap-6 md:grid-cols-2">
            {useCaseBlocks.map((block) => (
              <article
                key={block.title}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <h3 className="text-sm font-semibold text-slate-900">
                  {block.title}
                </h3>
                <p className="mt-2 text-xs text-slate-600">{block.body}</p>
              </article>
            ))}
          </div>
        </Container>
      </section>
    </main>
  );
}
