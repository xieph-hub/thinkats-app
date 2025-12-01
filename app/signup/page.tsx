// app/signup/page.tsx
"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";

type Status = "idle" | "loading" | "success" | "error";

export default function SignupPage() {
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("loading");
    setError(null);

    const form = e.currentTarget;
    const formData = new FormData(form);

    const payload = {
      company: formData.get("company"),
      name: formData.get("name"),
      email: formData.get("email"),
      role: formData.get("role"),
      teamSize: formData.get("teamSize"),
      notes: formData.get("notes"),
    };

    try {
      const res = await fetch("/api/trial-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        setStatus("error");
        setError(data?.error || "Could not submit your request.");
        return;
      }

      setStatus("success");
      form.reset();
    } catch {
      setStatus("error");
      setError("Something went wrong. Please try again.");
    }
  }

  const isSubmitted = status === "success";

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
      <div className="mx-auto flex min-h-screen max-w-5xl flex-col px-4 py-10 sm:py-14 lg:px-10">
        <header className="flex items-center justify-between pb-8">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100">
              <span className="text-xs font-bold tracking-tight text-slate-900">
                TA
              </span>
            </div>
            <span className="text-sm font-semibold tracking-tight text-slate-50">
              ThinkATS
            </span>
          </Link>

          <Link
            href="/login"
            className="rounded-full border border-slate-600 px-3 py-1.5 text-xs font-medium text-slate-100 hover:border-slate-400"
          >
            Back to login
          </Link>
        </header>

        <div className="grid flex-1 items-center gap-10 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
          {/* Left copy */}
          <section>
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-900/60 px-3 py-1 text-[11px] text-slate-300">
              <span className="h-1.5 w-1.5 rounded-full bg-sky-400" />
              <span>Request early access</span>
            </div>

            <h1 className="mt-5 text-3xl font-semibold tracking-tight text-slate-50 sm:text-4xl">
              Start a ThinkATS trial for your team.
            </h1>
            <p className="mt-4 max-w-xl text-sm leading-relaxed text-slate-300">
              Share a few details about your organisation and how you hire. We’ll
              help you shape the right workspace, tenants and permissions for
              your first cohort of roles.
            </p>

            <p className="mt-6 text-xs text-slate-400">
              We’ll only use your details to follow up about ThinkATS. No credit
              card required.
            </p>
          </section>

          {/* Right form */}
          <section className="lg:justify-self-end">
            <div className="w-full max-w-md rounded-2xl border border-slate-700/70 bg-slate-950/80 p-6 shadow-[0_20px_60px_rgba(0,0,0,0.7)] backdrop-blur">
              <h2 className="text-base font-semibold text-slate-50">
                Request access
              </h2>
              <p className="mt-1 text-xs text-slate-400">
                We’ll get back to you on your work email with next steps.
              </p>

              {isSubmitted ? (
                <div className="mt-5 rounded-xl border border-emerald-200/40 bg-emerald-900/20 px-4 py-4 text-sm text-emerald-100">
                  <p className="font-medium">
                    Thanks – we’ve got your request.
                  </p>
                  <p className="mt-1 text-xs text-emerald-100/90">
                    Someone from the ThinkATS team will follow up shortly to help
                    you configure your workspace and first roles.
                  </p>
                  <p className="mt-3 text-xs">
                    You can{" "}
                    <Link
                      href="/"
                      className="font-semibold text-emerald-200 underline underline-offset-4"
                    >
                      return to the homepage
                    </Link>{" "}
                    while you wait.
                  </p>
                </div>
              ) : (
                <form className="mt-5 space-y-4" onSubmit={handleSubmit}>
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
                      type="text"
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
                      type="text"
                      className="block w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-50 placeholder:text-slate-500 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                      placeholder="Resourcin, Venture Garden Group…"
                    />
                  </div>

                  <div className="space-y-1">
                    <label
                      htmlFor="role"
                      className="text-[11px] font-medium uppercase tracking-wide text-slate-400"
                    >
                      Your role
                    </label>
                    <input
                      id="role"
                      name="role"
                      type="text"
                      className="block w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-50 placeholder:text-slate-500 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                      placeholder="Founder, Head of People, Talent Lead…"
                    />
                  </div>

                  <div className="space-y-1">
                    <label
                      htmlFor="teamSize"
                      className="text-[11px] font-medium uppercase tracking-wide text-slate-400"
                    >
                      Rough team size hiring for
                    </label>
                    <select
                      id="teamSize"
                      name="teamSize"
                      className="block w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-50 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                    >
                      <option value="">Select an option</option>
                      <option value="0-25">0–25 people</option>
                      <option value="25-50">25–50 people</option>
                      <option value="50-100">50–100 people</option>
                      <option value="100-250">100–250 people</option>
                      <option value="250-plus">250+ people</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label
                      htmlFor="notes"
                      className="text-[11px] font-medium uppercase tracking-wide text-slate-400"
                    >
                      What are you hoping ThinkATS will help with?
                    </label>
                    <textarea
                      id="notes"
                      name="notes"
                      rows={3}
                      className="block w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-50 placeholder:text-slate-500 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                      placeholder="E.g. centralising roles, running leadership searches, better visibility for the group…"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={status === "loading"}
                    className="mt-2 inline-flex w-full items-center justify-center rounded-md bg-sky-500 px-3 py-2 text-sm font-semibold text-slate-950 shadow-sm hover:bg-sky-400 disabled:opacity-60"
                  >
                    {status === "loading" ? "Submitting…" : "Request access"}
                  </button>

                  {status === "error" && error && (
                    <p className="mt-3 text-[11px] text-red-400">{error}</p>
                  )}
                </form>
              )}

              <p className="mt-5 text-center text-[11px] text-slate-500">
                Already have an account?{" "}
                <Link
                  href="/login"
                  className="font-semibold text-slate-100 underline underline-offset-4"
                >
                  Log in
                </Link>
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
