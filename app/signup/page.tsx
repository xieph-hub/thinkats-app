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
    } catch (err) {
      setStatus("error");
      setError("Something went wrong. Please try again.");
    }
  }

  const isSubmitted = status === "success";

  return (
    <main className="flex min-h-[70vh] items-center justify-center bg-slate-50 px-4 py-10">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-xl font-semibold text-slate-900">
          Start your trial
        </h1>
        <p className="mt-1 text-xs text-slate-600">
          Tell us a bit about your team so we can shape the right early access
          experience for you.
        </p>

        {isSubmitted ? (
          <div className="mt-5 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-4 text-sm text-emerald-800">
            <p className="font-medium">Thanks – we’ve got your request.</p>
            <p className="mt-1">
              Someone from the ThinkATS team will follow up shortly on your work
              email to complete your setup.
            </p>
            <p className="mt-3 text-xs">
              In the meantime, you can{" "}
              <Link
                href="/"
                className="font-semibold text-emerald-900 underline underline-offset-4"
              >
                return to the homepage
              </Link>
              .
            </p>
          </div>
        ) : (
          <form className="mt-5 space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-1">
              <label
                htmlFor="name"
                className="text-xs font-medium text-slate-700"
              >
                Full name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                className="block w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none ring-0 placeholder:text-slate-400 focus:border-[#172965] focus:bg-white focus:ring-1 focus:ring-[#172965]"
                placeholder="Ada Okafor"
              />
            </div>

            <div className="space-y-1">
              <label
                htmlFor="email"
                className="text-xs font-medium text-slate-700"
              >
                Work email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                className="block w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none ring-0 placeholder:text-slate-400 focus:border-[#172965] focus:bg-white focus:ring-1 focus:ring-[#172965]"
                placeholder="you@company.com"
              />
            </div>

            <div className="space-y-1">
              <label
                htmlFor="company"
                className="text-xs font-medium text-slate-700"
              >
                Company / organisation
              </label>
              <input
                id="company"
                name="company"
                type="text"
                className="block w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none ring-0 placeholder:text-slate-400 focus:border-[#172965] focus:bg-white focus:ring-1 focus:ring-[#172965]"
                placeholder="Resourcin, Venture Garden Group…"
              />
            </div>

            <div className="space-y-1">
              <label
                htmlFor="role"
                className="text-xs font-medium text-slate-700"
              >
                Your role
              </label>
              <input
                id="role"
                name="role"
                type="text"
                className="block w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none ring-0 placeholder:text-slate-400 focus:border-[#172965] focus:bg-white focus:ring-1 focus:ring-[#172965]"
                placeholder="Founder, Head of People, Talent Lead…"
              />
            </div>

            <div className="space-y-1">
              <label
                htmlFor="teamSize"
                className="text-xs font-medium text-slate-700"
              >
                Rough team size hiring for
              </label>
              <select
                id="teamSize"
                name="teamSize"
                className="block w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none ring-0 focus:border-[#172965] focus:bg-white focus:ring-1 focus:ring-[#172965]"
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
                className="text-xs font-medium text-slate-700"
              >
                What are you hoping ThinkATS will help with?
              </label>
              <textarea
                id="notes"
                name="notes"
                rows={3}
                className="block w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none ring-0 placeholder:text-slate-400 focus:border-[#172965] focus:bg-white focus:ring-1 focus:ring-[#172965]"
                placeholder="E.g. centralising all our roles, running leadership searches, better visibility for the group…"
              />
            </div>

            <button
              type="submit"
              disabled={status === "loading"}
              className="mt-2 inline-flex w-full items-center justify-center rounded-full bg-[#172965] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#0f1c48] disabled:opacity-60"
            >
              {status === "loading" ? "Submitting…" : "Request access"}
            </button>

            {status === "error" && error && (
              <p className="mt-3 text-xs text-red-600">{error}</p>
            )}
          </form>
        )}

        <p className="mt-4 text-center text-[11px] text-slate-600">
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-semibold text-[#172965] hover:underline"
          >
            Log in
          </Link>
        </p>
      </div>
    </main>
  );
}
