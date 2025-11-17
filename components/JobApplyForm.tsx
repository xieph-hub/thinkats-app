"use client";

import { FormEvent, useState } from "react";

type Status = "idle" | "submitting" | "success" | "error";

interface JobApplyFormProps {
  jobId: string;
  source?: string; // e.g. "Website", "Talent network"
}

export default function JobApplyForm({
  jobId,
  source = "Website",
}: JobApplyFormProps) {
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;

    setStatus("submitting");
    setError(null);

    try {
      const formData = new FormData(form);
      formData.append("jobId", jobId);
      formData.append("source", source);

      const res = await fetch("/api/apply", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || "Failed to submit application.");
      }

      setStatus("success");
      form.reset();
    } catch (err) {
      console.error(err);
      setStatus("error");
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again."
      );
    } finally {
      setStatus((prev) => (prev === "submitting" ? "idle" : prev));
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
    >
      <div>
        <h2 className="text-sm font-semibold text-slate-900">
          Apply for this role
        </h2>
        <p className="mt-1 text-xs text-slate-500">
          Share a few details and we&apos;ll get back to you if there&apos;s a
          strong fit.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-xs font-medium text-slate-700">
            Full name
          </label>
          <input
            name="fullName"
            type="text"
            required
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none focus:border-[#172965]"
            placeholder="Jane Doe"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-700">
            Email
          </label>
          <input
            name="email"
            type="email"
            required
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none focus:border-[#172965]"
            placeholder="you@email.com"
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
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
        <div>
          <label className="block text-xs font-medium text-slate-700">
            Location
          </label>
          <input
            name="location"
            type="text"
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none focus:border-[#172965]"
            placeholder="City, Country"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-slate-700">
          LinkedIn URL
        </label>
        <input
          name="linkedinUrl"
          type="url"
          className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none focus:border-[#172965]"
          placeholder="https://linkedin.com/in/..."
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-slate-700">
          Portfolio / GitHub (optional)
        </label>
        <input
          name="portfolioUrl"
          type="url"
          className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none focus:border-[#172965]"
          placeholder="Portfolio, GitHub, etc."
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-slate-700">
          Cover letter / context (optional)
        </label>
        <textarea
          name="coverLetter"
          rows={4}
          className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none focus:border-[#172965]"
          placeholder="Tell us briefly why this role is a fit for you."
        />
      </div>

      <div className="flex items-center justify-between gap-4 pt-2">
        <p className="text-xs text-slate-500">
          We&apos;ll email you if we&apos;d like to move you to the next stage.
        </p>
        <button
          type="submit"
          disabled={status === "submitting"}
          className="inline-flex items-center rounded-full bg-[#172965] px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-[#101b47] disabled:cursor-not-allowed disabled:opacity-70"
        >
          {status === "submitting" ? "Submitting…" : "Submit application"}
        </button>
      </div>

      {status === "success" && (
        <p className="rounded-lg bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
          Thanks — your application is in. We&apos;ll be in touch if there&apos;s
          a strong match.
        </p>
      )}

      {status === "error" && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">
          {error ?? "Something went wrong. Please try again."}
        </p>
      )}
    </form>
  );
}
