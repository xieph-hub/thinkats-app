"use client";

import { FormEvent, useState } from "react";

type Status = "idle" | "submitting" | "success" | "error";

export default function ContactForm() {
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("submitting");
    setError(null);

    try {
      const formData = new FormData(e.currentTarget);
      const payload = Object.fromEntries(formData.entries());

      // TODO: replace this with real API / email integration
      console.log("Contact form submission:", payload);

      setStatus("success");
      e.currentTarget.reset();
    } catch (err) {
      console.error(err);
      setStatus("error");
      setError("Something went wrong. Please try again.");
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-6 grid gap-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:grid-cols-2"
    >
      <div className="sm:col-span-1">
        <label className="block text-xs font-medium text-slate-700">
          Full name
        </label>
        <input
          name="name"
          type="text"
          required
          className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none ring-0 focus:border-[#172965]"
          placeholder="Jane Doe"
        />
      </div>

      <div className="sm:col-span-1">
        <label className="block text-xs font-medium text-slate-700">
          Company
        </label>
        <input
          name="company"
          type="text"
          className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none focus:border-[#172965]"
          placeholder="Acme Inc."
        />
      </div>

      <div className="sm:col-span-1">
        <label className="block text-xs font-medium text-slate-700">
          Work email
        </label>
        <input
          name="email"
          type="email"
          required
          className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none focus:border-[#172965]"
          placeholder="you@company.com"
        />
      </div>

      <div className="sm:col-span-1">
        <label className="block text-xs font-medium text-slate-700">
          Phone / WhatsApp
        </label>
        <input
          name="phone"
          type="tel"
          className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none focus:border-[#172965]"
          placeholder="+234…"
        />
      </div>

      <div className="sm:col-span-2">
        <label className="block text-xs font-medium text-slate-700">
          What would you like to discuss?
        </label>
        <select
          name="topic"
          className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-[#172965]"
          defaultValue=""
        >
          <option value="" disabled>
            Select an option
          </option>
          <option value="hiring">Hiring / recruiting support</option>
          <option value="embedded-hr">Embedded HR / people operations</option>
          <option value="payroll">Payroll / EOR / compliance</option>
          <option value="consulting">HR consulting / projects</option>
          <option value="partnerships">Partnerships</option>
          <option value="other">Something else</option>
        </select>
      </div>

      <div className="sm:col-span-2">
        <label className="block text-xs font-medium text-slate-700">
          Tell us a bit more
        </label>
        <textarea
          name="message"
          rows={4}
          required
          className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none focus:border-[#172965]"
          placeholder="Roles, timelines, context… anything that helps us respond with a concrete next step."
        />
      </div>

      <div className="sm:col-span-2">
        <label className="block text-xs font-medium text-slate-700">
          How did you hear about Resourcin?
        </label>
        <input
          name="referral"
          type="text"
          className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none focus:border-[#172965]"
          placeholder="Referral, LinkedIn, X, event, etc."
        />
      </div>

      <div className="sm:col-span-2 flex items-center justify-between gap-4 pt-2">
        <p className="text-xs text-slate-500">
          We typically reply within one business day.
        </p>
        <button
          type="submit"
          disabled={status === "submitting"}
          className="inline-flex items-center rounded-full bg-[#172965] px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-[#101b47] disabled:cursor-not-allowed disabled:opacity-70"
        >
          {status === "submitting" ? "Sending…" : "Submit"}
        </button>
      </div>

      {status === "success" && (
        <div className="sm:col-span-2 rounded-lg bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
          Thanks for reaching out — we&apos;ll get back to you shortly.
        </div>
      )}

      {status === "error" && (
        <div className="sm:col-span-2 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">
          {error ?? "Something went wrong. Please try again."}
        </div>
      )}
    </form>
  );
}
