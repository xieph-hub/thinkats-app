"use client";

import { FormEvent, useState } from "react";

type Status = "idle" | "submitting" | "success" | "error";

export default function RequestTalentForm() {
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    // ✅ Store the form element BEFORE any await
    const form = e.currentTarget;

    setStatus("submitting");
    setError(null);

    try {
      const formData = new FormData(form);

      const res = await fetch("/api/request-talent", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || "Failed to submit brief.");
      }

      setStatus("success");
      form.reset(); // ✅ use the stored form, not e.currentTarget
    } catch (err) {
      console.error(err);
      setStatus("error");
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again."
      );
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-6 grid gap-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:grid-cols-2"
    >
      <div className="sm:col-span-1">
        <label className="block text-xs font-medium text-slate-700">
          Your name
        </label>
        <input
          name="name"
          type="text"
          required
          className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none focus:border-[#172965]"
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
          required
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
          Role(s) you want to hire
        </label>
        <input
          name="roles"
          type="text"
          required
          className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none focus:border-[#172965]"
          placeholder="e.g. Senior Backend Engineer, Country Manager (Kenya)"
        />
      </div>

      <div className="sm:col-span-1">
        <label className="block text-xs font-medium text-slate-700">
          Headcount
        </label>
        <input
          name="headcount"
          type="number"
          min={1}
          className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none focus:border-[#172965]"
          placeholder="1–10"
        />
      </div>

      <div className="sm:col-span-1">
        <label className="block text-xs font-medium text-slate-700">
          Location(s)
        </label>
        <input
          name="locations"
          type="text"
          className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none focus:border-[#172965]"
          placeholder="Lagos, Nairobi, Remote Africa, etc."
        />
      </div>

      <div className="sm:col-span-1">
        <label className="block text-xs font-medium text-slate-700">
          Budget (per role)
        </label>
        <input
          name="budget"
          type="text"
          className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none focus:border-[#172965]"
          placeholder="e.g. $4k–$6k / month or NGN range"
        />
      </div>

      <div className="sm:col-span-1">
        <label className="block text-xs font-medium text-slate-700">
          Ideal start date
        </label>
        <input
          name="timeline"
          type="text"
          className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none focus:border-[#172965]"
          placeholder="e.g. ASAP, within 30 days, Q1 2026"
        />
      </div>

      <div className="sm:col-span-2">
        <label className="block text-xs font-medium text-slate-700">
          Any extra context we should know?
        </label>
        <textarea
          name="notes"
          rows={4}
          className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none focus:border-[#172965]"
          placeholder="Team structure, reporting line, key objectives, dealbreakers, etc."
        />
      </div>

      <div className="sm:col-span-2 flex items-center justify-between gap-4 pt-2">
        <p className="text-xs text-slate-500">
          Once you submit this, we&apos;ll respond with a simple plan and
          proposed next steps.
        </p>
        <button
          type="submit"
          disabled={status === "submitting"}
          className="inline-flex items-center rounded-full bg-[#172965] px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-[#101b47] disabled:cursor-not-allowed disabled:opacity-70"
        >
          {status === "submitting" ? "Sending…" : "Submit brief"}
        </button>
      </div>

      {status === "success" && (
        <div className="sm:col-span-2 rounded-lg bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
          Thanks — your brief is in. We&apos;ll follow up shortly.
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
