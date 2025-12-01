"use client";

import { useState } from "react";
import Link from "next/link";

export default function SignupPage() {
  const [status, setStatus] = useState<"idle" | "submitted">("idle");

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    // For now we just show a thank-you message.
    // Later you can POST this to an API route or a CRM.
    setStatus("submitted");
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-3xl px-4 py-16 lg:px-8 lg:py-24">
        <div className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
            THINKATS
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
            Start your free trial
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-slate-600">
            Tell us a bit about your organisation and we’ll get your ThinkATS
            workspace set up. No credit card required – we’ll reach out to
            confirm details and onboarding.
          </p>
        </div>

        {status === "submitted" ? (
          <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-5 text-sm text-emerald-800">
            <p className="font-medium">Thanks – we’ve got your request.</p>
            <p className="mt-1">
              Someone from the ThinkATS team will follow up shortly on your
              work email to complete your setup.
            </p>
            <p className="mt-3">
              In the meantime, you can{" "}
              <Link
                href="/"
                className="font-medium text-emerald-900 underline underline-offset-4"
              >
                return to the homepage
              </Link>
              .
            </p>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8"
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label
                  htmlFor="company"
                  className="block text-xs font-medium uppercase tracking-wide text-slate-500"
                >
                  Company / organisation
                </label>
                <input
                  id="company"
                  name="company"
                  required
                  className="mt-1 block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                  placeholder="Resourcin, Acme Inc, Client name…"
                />
              </div>

              <div>
                <label
                  htmlFor="name"
                  className="block text-xs font-medium uppercase tracking-wide text-slate-500"
                >
                  Full name
                </label>
                <input
                  id="name"
                  name="name"
                  required
                  className="mt-1 block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                  placeholder="Your name"
                />
              </div>

              <div>
                <label
                  htmlFor="email"
                  className="block text-xs font-medium uppercase tracking-wide text-slate-500"
                >
                  Work email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  className="mt-1 block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                  placeholder="you@company.com"
                />
              </div>

              <div>
                <label
                  htmlFor="role"
                  className="block text-xs font-medium uppercase tracking-wide text-slate-500"
                >
                  Your role
                </label>
                <input
                  id="role"
                  name="role"
                  className="mt-1 block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                  placeholder="Founder, Head of People, Talent Lead…"
                />
              </div>

              <div>
                <label
                  htmlFor="teamSize"
                  className="block text-xs font-medium uppercase tracking-wide text-slate-500"
                >
                  Hiring team size
                </label>
                <select
                  id="teamSize"
                  name="teamSize"
                  className="mt-1 block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                >
                  <option value="">Select an option</option>
                  <option value="1-5">1–5 people</option>
                  <option value="6-20">6–20 people</option>
                  <option value="21-100">21–100 people</option>
                  <option value="100+">100+ people</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label
                  htmlFor="notes"
                  className="block text-xs font-medium uppercase tracking-wide text-slate-500"
                >
                  What would you like to use ThinkATS for?
                </label>
                <textarea
                  id="notes"
                  name="notes"
                  rows={4}
                  className="mt-1 block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                  placeholder="E.g. run all agency hiring, centralise career sites for multiple clients, build a talent network…"
                />
              </div>
            </div>

            <button
              type="submit"
              className="mt-6 inline-flex w-full items-center justify-center rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white shadow-sm hover:bg-slate-800"
            >
              Submit trial request
            </button>

            <p className="mt-3 text-xs text-slate-500">
              A member of the ThinkATS team will follow up on your request and
              help you configure the right workspace, tenants and permissions.
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
