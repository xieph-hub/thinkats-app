// app/contact/page.tsx
import Link from "next/link";

export const metadata = {
  title: "Contact | ThinkATS",
  description:
    "Talk to the ThinkATS team about trials, pricing, and multi-tenant ATS setups.",
};

export default function ContactPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
      <div className="mx-auto flex min-h-screen max-w-5xl flex-col px-4 py-10 sm:py-14 lg:px-10">
        {/* Page header */}
        <header className="pb-8">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
            Contact
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-50 sm:text-4xl">
            Talk to the ThinkATS team.
          </h1>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-slate-300">
            Share a bit of context about your organisation, and we’ll help you
            figure out the right way to use ThinkATS—whether you’re an agency,
            group of companies or a single in-house team.
          </p>
        </header>

        <div className="grid gap-8 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.9fr)] lg:items-start">
          {/* Contact form */}
          <section className="rounded-2xl border border-slate-700/70 bg-slate-950/80 p-6 shadow-[0_20px_60px_rgba(0,0,0,0.7)] backdrop-blur">
            <h2 className="text-sm font-semibold text-slate-50">
              Send us a message
            </h2>
            <p className="mt-1 text-xs text-slate-400">
              We typically respond within one working day.
            </p>

            <form
              className="mt-5 space-y-4"
              // TODO: wire this to a real handler later (API / CRM)
              onSubmit={(e) => {
                e.preventDefault();
                alert(
                  "Form hooked up visually. When you’re ready, we’ll wire this to an API route or CRM."
                );
              }}
            >
              <div className="space-y-1">
                <label
                  htmlFor="name"
                  className="text-[11px] font-medium uppercase tracking-wide text-slate-400"
                >
                  Full name
                </label>
                <input
                  id="name"
                  name="name"
                  required
                  className="block w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-50 placeholder:text-slate-500 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                  placeholder="Ada Okafor"
                />
              </div>

              <div className="space-y-1">
                <label
                  htmlFor="email"
                  className="text-[11px] font-medium uppercase tracking-wide text-slate-400"
                >
                  Work email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  className="block w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-50 placeholder:text-slate-500 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                  placeholder="you@company.com"
                />
              </div>

              <div className="space-y-1">
                <label
                  htmlFor="company"
                  className="text-[11px] font-medium uppercase tracking-wide text-slate-400"
                >
                  Company / organisation
                </label>
                <input
                  id="company"
                  name="company"
                  className="block w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-50 placeholder:text-slate-500 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                  placeholder="Resourcin, Venture Garden Group…"
                />
              </div>

              <div className="space-y-1">
                <label
                  htmlFor="topic"
                  className="text-[11px] font-medium uppercase tracking-wide text-slate-400"
                >
                  What do you want to talk about?
                </label>
                <select
                  id="topic"
                  name="topic"
                  className="block w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-50 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                >
                  <option value="">Select an option</option>
                  <option value="trial">Starting a trial / pilot</option>
                  <option value="pricing">Pricing & rollout</option>
                  <option value="agency">Using ThinkATS as an agency</option>
                  <option value="support">Support / question</option>
                  <option value="other">Something else</option>
                </select>
              </div>

              <div className="space-y-1">
                <label
                  htmlFor="message"
                  className="text-[11px] font-medium uppercase tracking-wide text-slate-400"
                >
                  Message
                </label>
                <textarea
                  id="message"
                  name="message"
                  rows={4}
                  className="block w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-50 placeholder:text-slate-500 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                  placeholder="Share a bit of context about your roles, team, and timelines…"
                />
              </div>

              <button
                type="submit"
                className="mt-2 inline-flex w-full items-center justify-center rounded-md bg-sky-500 px-3 py-2 text-sm font-semibold text-slate-950 shadow-sm hover:bg-sky-400"
              >
                Send message
              </button>

              <p className="mt-3 text-[11px] text-slate-500">
                You can also email us directly at{" "}
                <a
                  href="mailto:hello@thinkats.com"
                  className="font-medium text-slate-100 underline underline-offset-4"
                >
                  hello@thinkats.com
                </a>
                .
              </p>
            </form>
          </section>

          {/* Side info */}
          <aside className="space-y-6 text-sm text-slate-200">
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                For agencies & groups
              </h3>
              <p className="mt-2 text-sm text-slate-300">
                If you’re running multiple clients or entities, let us know how
                many workspaces you expect and how you’d like access to be
                structured across founders, HR, and hiring managers.
              </p>
            </div>

            <div>
              <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                Support & product questions
              </h3>
              <p className="mt-2 text-sm text-slate-300">
                Already using ThinkATS and need help with tenants, roles, or an
                ATS workflow? Share your workspace name and we’ll route it to
                the right person.
              </p>
            </div>

            <div className="rounded-xl border border-slate-700/70 bg-slate-950/60 p-4 text-xs text-slate-300">
              <p className="font-medium text-slate-100">
                Prefer to see it first?
              </p>
              <p className="mt-1">
                Ask for a short demo in your message and we’ll walk you through
                how ThinkATS handles career sites, pipelines and talent pools.
              </p>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
