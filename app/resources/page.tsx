// app/resources/page.tsx
import type { Metadata } from "next";
import Container from "@/components/Container";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Resources | ThinkATS",
  description:
    "Guides, help articles and case studies to help you get more out of ThinkATS and sharpen your hiring practice.",
};

const resources = [
  {
    title: "Blog",
    href: "/blog",
    status: "Planned",
    body: "Long-form thinking on recruitment ops, agency scaling and modern ATS design.",
  },
  {
    title: "Help Center",
    href: "/help",
    status: "Roadmap",
    body: "Step-by-step guides for admins, recruiters and hiring managers.",
  },
  {
    title: "Case Studies",
    href: "/case-studies",
    status: "Roadmap",
    body: "How teams like Resourcin and others use ThinkATS to run searches end-to-end.",
  },
  {
    title: "Webinars",
    href: "/webinars",
    status: "Planned",
    body: "Live and on-demand sessions on optimising hiring workflows and using ThinkATS deeply.",
  },
  {
    title: "eBooks & Guides",
    href: "/resources/guides",
    status: "Future",
    body: "Downloadable playbooks on interview design, scorecards, sourcing and more.",
  },
  {
    title: "Developers & API",
    href: "/developers",
    status: "Future",
    body: "API reference, webhooks and integration examples once public API is opened.",
  },
];

export default function ResourcesPage() {
  return (
    <main className="bg-white">
      <section className="border-b bg-slate-50 py-12 md:py-16">
        <Container>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
            Resources
          </p>
          <h1 className="mt-3 text-3xl font-bold text-slate-900 md:text-4xl">
            Learn, implement and scale with ThinkATS.
          </h1>
          <p className="mt-3 max-w-2xl text-sm text-slate-600 md:text-base">
            This is the home for everything around ThinkATS — how-to guides,
            playbooks and stories from teams building serious recruitment
            operations.
          </p>
        </Container>
      </section>

      <section className="py-12 md:py-16">
        <Container>
          <div className="grid gap-6 md:grid-cols-3">
            {resources.map((r) => (
              <article
                key={r.title}
                className="flex flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <div className="flex items-center justify-between gap-2">
                  <h2 className="text-sm font-semibold text-slate-900">
                    {r.title}
                  </h2>
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600">
                    {r.status}
                  </span>
                </div>
                <p className="mt-2 flex-1 text-xs text-slate-600">{r.body}</p>
                <div className="mt-4">
                  <Link
                    href={r.href}
                    className="text-xs font-semibold text-[#1E40AF] hover:underline"
                  >
                    View section →
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </Container>
      </section>
    </main>
  );
}
