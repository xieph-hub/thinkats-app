"use client";

import { FormEvent, useState } from "react";

export const metadata = {
  title: "Contact | Resourcin",
  description:
    "Get in touch with Resourcin about hiring, HR support, or partnerships.",
};

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <main className="bg-slate-50 min-h-screen">
      <section className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
        <header className="mb-8 max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#306B34]">
            Contact
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
            Let&apos;s talk about your people and hiring plans.
          </h1>
          <p className="mt-3 text-sm text-slate-600 sm:text-base">
            Share a quick note about what you&apos;re trying to solve — hiring,
            HR support, or something more exploratory. We&apos;ll respond with a
            simple next step.
          </p>
        </header>

        <div className="grid gap-8 md:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
          <div className="rounded-2xl border border-slate-200 bg-white/90 p-5 shadow-sm sm:p-6">
            {submitted ? (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-5 text-sm text-emerald-800">
                <p className="font-semibold">Message received.</p>
                <p className="mt-1">
                  Thank you for reaching out. We&apos;ll review your note and
                  get back to you as soon as we can.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <label
                      htmlFor="name"
                      className="text-xs font-medium uppercase tracking-wide text-slate-600"
                    >
                      Name
                    </label>
                    <input
                      id="name"
                      name="name"
                      required
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none ring-[#172965]/10 focus:border-[#172965] focus:ring-2"
                      placeholder="Your name"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label
                      htmlFor="email"
                      className="text-xs font-medium uppercase tracking-wide text-slate-600"
                    >
                      Email
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
                </div>

                <div className="space-y-1.5">
                  <label
                    htmlFor="topic"
                    className="text-xs font-medium uppercase tracking-wide text-slate-600"
                  >
                    Topic
                  </label>
                  <select
                    id="topic"
                    name="topic"
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none ring-[#172965]/10 focus:border-[#172965] focus:ring-2"
                  >
                    <option value="hiring">Hiring / Recruiting</option>
                    <option value="hr">HR / People Operations</option>
                    <option value="partnership">
                      Partnership / Collaboration
                    </option>
                    <option value="other">Something else</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label
                    htmlFor="message"
                    className="text-xs font-medium uppercase tracking-wide text-slate-600"
                  >
                    Message
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    required
                    rows={4}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none ring-[#172965]/10 focus:border-[#172965] focus:ring-2"
                    placeholder="Share a bit of context so we can respond thoughtfully..."
                  />
                </div>

                <button
                  type="submit"
                  className="mt-2 rounded-full bg-[#172965] px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#111c4e]"
                >
                  Send message
                </button>
              </form>
            )}
          </div>

          <aside className="space-y-4 text-sm text-slate-700">
            <div className="rounded-2xl border border-slate-200 bg-white/90 p-5 shadow-sm">
              <h2 className="text-sm font-semibold text-slate-900">
                Contact details
              </h2>
              <dl className="mt-3 space-y-2 text-sm">
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Email
                  </dt>
                  <dd className="mt-0.5 text-slate-700">
                    hello@resourcin.com
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Phone / WhatsApp
                  </dt>
                  <dd className="mt-0.5 text-slate-700">
                    +234 704 557 2393
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Location
                  </dt>
                  <dd className="mt-0.5 text-slate-700">
                    Lagos, Nigeria — working with clients across Africa and
                    beyond.
                  </dd>
                </div>
              </dl>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white/90 p-5 shadow-sm">
              <h2 className="text-sm font-semibold text-slate-900">
                Typical response time
              </h2>
              <p className="mt-2 text-sm text-slate-600">
                We aim to respond within 1–2 business days. For urgent hiring or
                people issues, please mention that clearly in your message.
              </p>
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}
