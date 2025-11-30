// app/product/page.tsx
import type { Metadata } from "next";
import Container from "@/components/Container";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Product | ThinkATS",
  description:
    "See how ThinkATS helps agencies, HR teams and staffing firms run end-to-end hiring: career sites, pipelines, automation and analytics.",
};

const featureBlocks = [
  {
    label: "Career Sites",
    title: "White-labelled career portals for every client",
    body: "Spin up branded career sites on clientname.thinkats.com or your clients' own domains. Mobile-optimised, SEO-friendly and ready for paid traffic.",
    items: [
      "Custom domains & subdomains",
      "Responsive layouts and filters",
      "SEO meta & Open Graph support",
      "Multi-language ready (future phase)",
    ],
  },
  {
    label: "Candidate Management",
    title: "A clean, searchable candidate CRM",
    body: "Keep every profile, CV, note and communication in one place instead of spreadsheets and inboxes.",
    items: [
      "Rich candidate profiles & timelines",
      "Multiple applications per candidate",
      "Tags, sources and pools",
      "History across clients & jobs",
    ],
  },
  {
    label: "Job Management",
    title: "Structured jobs, not copy-pasted emails",
    body: "Standardise how roles are opened, approved and published across teams and locations.",
    items: [
      "Job templates per function & seniority",
      "Internal vs external postings",
      "Multi-channel publishing (future: boards)",
      "Field validation to reduce rework",
    ],
  },
  {
    label: "Collaboration",
    title: "Keep recruiters, hiring managers and clients aligned",
    body: "Comment, tag, request feedback and share shortlists without creating yet another WhatsApp group.",
    items: [
      "Activity feed on candidates & jobs",
      "Internal + client-facing notes (roadmap)",
      "Role-based permissions",
      "Email notifications that don’t spam",
    ],
  },
  {
    label: "Automation",
    title: "Let the system handle the repetitive work",
    body: "Automated acknowledgements, nudges and reminders so candidates and clients aren’t left hanging.",
    items: [
      "Application received emails",
      "Internal and client notifications",
      "Stage-based triggers (roadmap)",
      "Templates with safe variables",
    ],
  },
  {
    label: "Analytics",
    title: "See the health of your hiring funnel at a glance",
    body: "Track the metrics that actually matter to you and to clients: throughput, conversion and time-to-hire.",
    items: [
      "Job-level funnel views (roadmap)",
      "Source effectiveness",
      "Time-to-hire & ageing",
      "Export to CSV / BI tools",
    ],
  },
];

export default function ProductPage() {
  return (
    <main className="bg-white">
      {/* Hero */}
      <section className="border-b bg-slate-50 py-12 md:py-16">
        <Container>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
            Product
          </p>
          <h1 className="mt-3 text-3xl font-bold text-slate-900 md:text-4xl">
            One ATS to run{" "}
            <span className="text-[#1E40AF]">every search, client and role</span>.
          </h1>
          <p className="mt-3 max-w-2xl text-sm text-slate-600 md:text-base">
            ThinkATS brings together white-label career sites, structured pipelines,
            candidate CRM and automation so recruitment agencies and HR teams can
            scale without losing visibility or quality.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/signup"
              className="rounded-xl bg-[#1E40AF] px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#1D4ED8]"
            >
              Start free trial
            </Link>
            <Link
              href="/pricing"
              className="rounded-xl border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-800 hover:bg-slate-50"
            >
              View pricing
            </Link>
          </div>
        </Container>
      </section>

      {/* Feature grid */}
      <section className="py-12 md:py-16">
        <Container>
          <div className="max-w-3xl">
            <h2 className="text-xl font-semibold text-slate-900 md:text-2xl">
              Built for agencies, in-house teams and staffing firms.
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              Start with the core ATS today and grow into advanced automation,
              reporting and integrations as your hiring footprint expands.
            </p>
          </div>

          <div className="mt-8 grid gap-6 md:grid-cols-2">
            {featureBlocks.map((block) => (
              <article
                key={block.label}
                className="flex flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <p className="text-[11px] font-semibold uppercase tracking-wide text-[#1E40AF]">
                  {block.label}
                </p>
                <h3 className="mt-2 text-sm font-semibold text-slate-900">
                  {block.title}
                </h3>
                <p className="mt-2 text-xs text-slate-600">{block.body}</p>
                <ul className="mt-3 space-y-1.5 text-xs text-slate-600">
                  {block.items.map((item) => (
                    <li key={item} className="flex gap-2">
                      <span className="mt-[3px] inline-block h-1.5 w-1.5 rounded-full bg-[#1E40AF]" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </Container>
      </section>
    </main>
  );
}
