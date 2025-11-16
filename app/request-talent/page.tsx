"use client";

import { FormEvent, useState } from "react";

export const metadata = {
  title: "Request Talent | Resourcin",
  description:
    "Share your hiring brief with Resourcin — roles, locations, timelines, and budget. We’ll respond with next steps and a simple engagement plan.",
};

export default function RequestTalentPage() {
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    // TODO: Wire to backend (API route, Supabase, or email service).
    // For now we just show a confirmation message.
    setSubmitted(true);
  };

  return (
    <main className="bg-slate-50 min-h-screen">
      <section className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
        <header className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#306B34]">
            For Employers
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
            Request Talent
          </h1>
          <p className="mt-3 text-sm text-slate-600 sm:text-base">
            Share a concise brief — the roles you’re hiring for, where they sit,
            and how fast you need them. We’ll review and follow up with
            timelines, fees, and the leanest model that fits.
          </p>
        </header>

        <div className="rounded-2xl border border-slate-200 bg-white/90 p-5 shadow-sm sm:p-6">
          {submitted ? (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-5 text-sm text-emerald-800">
              <p className="font-semibold">Brief received.</p>
              <p className="mt-1">
                Thank you for sharing your hiring needs. We’ll review this and
                reach out via email with next steps and clarifying questions
                where needed.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label
                    htmlFor="name"
                    className="text-xs font-medium uppercase tracking-wide text-slate-600"
                  >
                    Your Name
                  </label>
                  <input
                    id="name"
                    name="name"
                    required
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none ring-[#172965]/10 focus:border-[#172965] focus:ring-2"
                    placeholder="Jane Doe"
                  />
                </div>
                <div className="space-y-1.5">
                  <label
                    htmlFor="company"
                    className="text-xs font-medium uppercase tracking-wide text-slate-600"
                  >
                    Company
                  </label>
                  <input
                    id="company"
                    name="company"
                    required
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none ring-[#172965]/10 focus:border-[#172965] focus:ring-2"
                    placeholder="Company name"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label
                    htmlFor="email"
                    className="text-xs font-medium uppercase tracking-wide text-slate-600"
                  >
                    Work Email
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none ring-[#172965]/10 focus:border-[#172965] focus:ring-2"
                    placeholder="you@company.com"
                  />
                </div>
                <div className="space-y-1.5">
                  <label
                    htmlFor="phone"
                    className="text-xs font-medium uppercase tracking-wide text-slate-600"
                  >
                    Phone / WhatsApp (optional)
                  </label>
                  <input
                    id="phone"
                    name="phone"
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none ring-[#172965]/10 focus:border-[#172965] focus:ring-2"
                    placeholder="+234..."
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="roles"
                  className="text-xs font-medium uppercase tracking-wide text-slate-600"
                >
                  Roles you&apos;re hiring for
                </label>
                <textarea
                  id="roles"
                  name="roles"
                  required
                  rows={3}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none ring-[#172965]/10 focus:border-[#172965] focus:ring-2"
                  placeholder="e.g. Senior Product Manager (Lagos), Head of Sales (Kenya), 3 Customer Success Associates (Remote)..."
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label
                    htmlFor="locations"
                    className="text-xs font-medium uppercase tracking-wide text-slate-600"
                  >
                    Locations
                  </label>
                  <input
                    id="locations"
                    name="locations"
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none ring-[#172965]/10 focus:border-[#172965] focus:ring-2"
                    placeholder="Countries / cities / remote"
                  />
                </div>
                <div className="space-y-1.5">
                  <label
                    htmlFor="timeline"
                    className="text-xs font-medium uppercase tracking-wide text-slate-600"
                  >
                    Timeline
                  </label>
                  <input
                    id="timeline"
                    name="timeline"
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none ring-[#172965]/10 focus:border-[#172965] focus:ring-2"
                    placeholder="e.g. Start interviews in 2 weeks, onboard by Q1..."
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="budget"
                  className="text-xs font-medium uppercase tracking-wide text-slate-600"
                >
                  Budget / Compensation bands (if available)
                </label>
                <textarea
                  id="budget"
                  name="budget"
                  rows={2}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none ring-[#172965]/10 focus:border-[#172965] focus:ring-2"
                  placeholder="e.g. $60–80k base, 10–20% bonus, equity band..."
                />
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="notes"
                  className="text-xs font-medium uppercase tracking-wide text-slate-600"
                >
                  Anything else we should know?
                </label>
                <textarea
                  id="notes"
                  name="notes"
                  rows={3}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none ring-[#172965]/10 focus:border-[#172965] focus:ring-2"
                  placeholder="Stack, culture, internal capacity, non-negotiables, dealbreaker traits..."
                />
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <button
                  type="submit"
                  className="rounded-full bg-[#172965] px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#111c4e]"
                >
                  Submit hiring brief
                </button>
                <p className="max-w-xs text-[11px] text-slate-500">
                  We typically respond within 1–2 working days with next steps,
                  clarifying questions, or a quick calendar link.
                </p>
              </div>
            </form>
          )}
        </div>
      </section>
    </main>
  );
}
