// app/talent-network/TalentNetworkForm.tsx
"use client";

import { FormEvent, useState } from "react";

type TalentNetworkFormProps = {
  prefillRole?: string;
  sourceJobSlugRaw?: string;
};

export default function TalentNetworkForm({
  prefillRole = "",
  sourceJobSlugRaw = "",
}: TalentNetworkFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const form = e.currentTarget;
      const formData = new FormData(form);

      // 🔐 ensure sourceJobSlug is always there (even if empty)
      if (!formData.get("sourceJobSlug") && sourceJobSlugRaw) {
        formData.set("sourceJobSlug", sourceJobSlugRaw);
      }

      // TODO: if you already have a different endpoint, change this:
      const res = await fetch("/api/talent-network", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        console.error("Talent network submission failed", await res.text());
        setError("Something went wrong submitting your profile. Please try again.");
        return;
      }

      setHasSubmitted(true);
      form.reset();
    } catch (err) {
      console.error("Talent network error", err);
      setError("Something went wrong submitting your profile. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (hasSubmitted) {
    return (
      <div className="rounded-2xl bg-emerald-50 px-5 py-6 text-sm text-emerald-800 ring-1 ring-emerald-200">
        <p className="font-semibold">Profile received.</p>
        <p className="mt-1">
          Thanks for sharing your details. We&apos;ll reach out when we&apos;re
          running a search that meaningfully overlaps with your profile.
        </p>
        <button
          type="button"
          onClick={() => setHasSubmitted(false)}
          className="mt-4 inline-flex items-center rounded-lg bg-white px-3.5 py-1.5 text-xs font-medium text-emerald-800 ring-1 ring-emerald-300 hover:bg-emerald-100"
        >
          Submit another profile
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6 rounded-2xl bg-white px-5 py-6 shadow-sm ring-1 ring-slate-200 sm:px-7 sm:py-7"
    >
      {/* 🔒 Hidden field: job slug that sent them here */}
      <input
        type="hidden"
        name="sourceJobSlug"
        value={sourceJobSlugRaw || ""}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        {/* Full name */}
        <div className="sm:col-span-2">
          <label className="block text-xs font-medium text-slate-700">
            Full name
          </label>
          <input
            type="text"
            name="fullName"
            required
            className="mt-1 block w-full rounded-md border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-[#172965] focus:outline-none focus:ring-2 focus:ring-[#172965]/30"
          />
        </div>

        {/* Email */}
        <div>
          <label className="block text-xs font-medium text-slate-700">
            Email
          </label>
          <input
            type="email"
            name="email"
            required
            className="mt-1 block w-full rounded-md border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-[#172965] focus:outline-none focus:ring-2 focus:ring-[#172965]/30"
          />
        </div>

        {/* Phone / WhatsApp */}
        <div>
          <label className="block text-xs font-medium text-slate-700">
            Phone / WhatsApp (with country code)
          </label>
          <input
            type="text"
            name="phone"
            placeholder="+234..."
            className="mt-1 block w-full rounded-md border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-[#172965] focus:outline-none focus:ring-2 focus:ring-[#172965]/30"
          />
        </div>

        {/* Location */}
        <div>
          <label className="block text-xs font-medium text-slate-700">
            Current location (City, Country)
          </label>
          <input
            type="text"
            name="location"
            placeholder="Lagos, Nigeria"
            className="mt-1 block w-full rounded-md border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-[#172965] focus:outline-none focus:ring-2 focus:ring-[#172965]/30"
          />
        </div>

        {/* LinkedIn */}
        <div>
          <label className="block text-xs font-medium text-slate-700">
            LinkedIn profile
          </label>
          <input
            type="url"
            name="linkedinUrl"
            placeholder="https://www.linkedin.com/in/..."
            className="mt-1 block w-full rounded-md border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-[#172965] focus:outline-none focus:ring-2 focus:ring-[#172965]/30"
          />
        </div>

        {/* Portfolio / GitHub / Personal site */}
        <div className="sm:col-span-2">
          <label className="block text-xs font-medium text-slate-700">
            Portfolio / GitHub / Personal site (optional)
          </label>
          <input
            type="url"
            name="portfolioUrl"
            placeholder="https://..."
            className="mt-1 block w-full rounded-md border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-[#172965] focus:outline-none focus:ring-2 focus:ring-[#172965]/30"
          />
        </div>

        {/* CV / Resume link */}
        <div className="sm:col-span-2">
          <label className="block text-xs font-medium text-slate-700">
            CV / Resume link (Google Drive, Dropbox, etc.)
          </label>
          <input
            type="url"
            name="cvUrl"
            placeholder="https://..."
            className="mt-1 block w-full rounded-md border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-[#172965] focus:outline-none focus:ring-2 focus:ring-[#172965]/30"
          />
        </div>

        {/* Primary function */}
        <div>
          <label className="block text-xs font-medium text-slate-700">
            Primary function
          </label>
          <input
            type="text"
            name="primaryFunction"
            placeholder="Product Management, Engineering, Data..."
            className="mt-1 block w-full rounded-md border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-[#172965] focus:outline-none focus:ring-2 focus:ring-[#172965]/30"
          />
        </div>

        {/* Experience level */}
        <div>
          <label className="block text-xs font-medium text-slate-700">
            Experience level
          </label>
          <select
            name="experienceLevel"
            className="mt-1 block w-full rounded-md border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-[#172965] focus:outline-none focus:ring-2 focus:ring-[#172965]/30"
          >
            <option value="">Select one</option>
            <option value="0-2">0–2 years (Junior)</option>
            <option value="3-7">3–7 years (Mid-level)</option>
            <option value="8-12">8–12 years (Senior)</option>
            <option value="13+">13+ years (Lead / Exec)</option>
          </select>
        </div>

        {/* Current / most recent company */}
        <div>
          <label className="block text-xs font-medium text-slate-700">
            Current / most recent company
          </label>
          <input
            type="text"
            name="currentCompany"
            className="mt-1 block w-full rounded-md border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-[#172965] focus:outline-none focus:ring-2 focus:ring-[#172965]/30"
          />
        </div>

        {/* Current / last comp */}
        <div>
          <label className="block text-xs font-medium text-slate-700">
            Current / last total compensation (currency + per month / year)
          </label>
          <input
            type="text"
            name="currentComp"
            placeholder="₦900k / month, $80k / year..."
            className="mt-1 block w-full rounded-md border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-[#172965] focus:outline-none focus:ring-2 focus:ring-[#172965]/30"
          />
        </div>

        {/* Role you're most interested in next */}
        <div className="sm:col-span-2">
          <label className="block text-xs font-medium text-slate-700">
            Role you&apos;re most interested in next
          </label>
          <input
            type="text"
            name="desiredRole"
            defaultValue={prefillRole}
            placeholder="Senior Product Manager – Fintech Platform"
            className="mt-1 block w-full rounded-md border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-[#172965] focus:outline-none focus:ring-2 focus:ring-[#172965]/30"
          />
        </div>

        {/* Work preference */}
        <div className="sm:col-span-2">
          <label className="block text-xs font-medium text-slate-700">
            Work preference
          </label>
          <select
            name="workPreference"
            className="mt-1 block w-full rounded-md border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-[#172965] focus:outline-none focus:ring-2 focus:ring-[#172965]/30"
          >
            <option value="">Select one</option>
            <option value="onsite">Onsite</option>
            <option value="hybrid">Hybrid</option>
            <option value="remote">Remote</option>
          </select>
        </div>
      </div>

      {/* Value bullets */}
      <div>
        <label className="block text-xs font-medium text-slate-700">
          In 4–6 bullet points, tell us where you create the most value.
        </label>
        <p className="mt-1 text-[0.75rem] text-slate-500">
          Think of this as the “real” version of your CV headline — what
          you&apos;ve actually done, not just your title.
        </p>
        <textarea
          name="valueBullets"
          rows={5}
          className="mt-2 block w-full rounded-md border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-[#172965] focus:outline-none focus:ring-2 focus:ring-[#172965]/30"
        />
      </div>

      {/* Anything else we should know */}
      <div>
        <label className="block text-xs font-medium text-slate-700">
          Anything else we should know?
        </label>
        <p className="mt-1 text-[0.75rem] text-slate-500">
          Context on notice period, relocation, visa status, etc.
        </p>
        <textarea
          name="extraInfo"
          rows={3}
          className="mt-2 block w-full rounded-md border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-[#172965] focus:outline-none focus:ring-2 focus:ring-[#172965]/30"
        />
      </div>

      {/* Consent + actions */}
      <div className="space-y-3 border-t border-slate-200 pt-4">
        <p className="text-[0.7rem] text-slate-500">
          By submitting, you agree that we can store your details and reach out
          when we see a strong match. We won&apos;t spam you or sell your data.
        </p>

        {error && (
          <p className="text-xs font-medium text-red-600">{error}</p>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3">
          <a
            href="/jobs"
            className="text-xs font-medium text-slate-600 hover:underline"
          >
            Back to jobs
          </a>

          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center justify-center rounded-lg bg-[#172965] px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-[#111c4c] disabled:cursor-not-allowed disabled:opacity-70 sm:text-sm"
          >
            {isSubmitting ? "Submitting..." : "Submit profile"}
            <span className="ml-1.5 text-[0.7rem]" aria-hidden="true">
              →
            </span>
          </button>
        </div>
      </div>
    </form>
  );
}
