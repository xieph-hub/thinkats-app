// app/jobs/JobApplyForm.tsx
"use client";

import { useState } from "react";

type JobApplyFormProps = {
  jobSlug: string;
  jobTitle: string;
};

export default function JobApplyForm({ jobSlug, jobTitle }: JobApplyFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    setStatus("idle");
    setErrorMessage(null);

    const formData = new FormData(e.currentTarget);
    const payload = Object.fromEntries(formData.entries());

    try {
      const res = await fetch(
        `/api/jobs/${encodeURIComponent(jobSlug)}/apply`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      if (!res.ok) {
        let data: any = null;
        try {
          data = await res.json();
        } catch {
          // ignore
        }

        setStatus("error");
        setErrorMessage(
          data?.error ||
            "Something went wrong while submitting. Please try again."
        );
        return;
      }

      setStatus("success");
      e.currentTarget.reset();
    } catch (err) {
      console.error("Apply error", err);
      setStatus("error");
      setErrorMessage("Network error. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="mt-10 rounded-2xl bg-white px-5 py-6 shadow-sm ring-1 ring-slate-200 sm:px-7">
      <h2 className="text-base font-semibold text-[#172965] sm:text-lg">
        Apply for this role
      </h2>
      <p className="mt-1 text-sm text-slate-600">
        Share a few details and we&apos;ll review your profile against{" "}
        <span className="font-medium">{jobTitle}</span>. You&apos;ll also be
        added to the Resourcin talent network for relevant future searches.
      </p>

      <form onSubmit={handleSubmit} className="mt-4 space-y-4">
        {/* hidden jobSlug (extra safety) */}
        <input type="hidden" name="jobSlug" value={jobSlug} />

        {/* Full name */}
        <div className="space-y-1">
          <label className="block text-xs font-medium text-slate-700">
            Full name <span className="text-red-500">*</span>
          </label>
          <input
            name="fullName"
            required
            className="block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-[#172965] focus:outline-none focus:ring-1 focus:ring-[#172965]"
          />
        </div>

        {/* Email */}
        <div className="space-y-1">
          <label className="block text-xs font-medium text-slate-700">
            Email <span className="text-red-500">*</span>
          </label>
          <input
            name="email"
            type="email"
            required
            className="block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-[#172965] focus:outline-none focus:ring-1 focus:ring-[#172965]"
          />
        </div>

        {/* Phone */}
        <div className="space-y-1">
          <label className="block text-xs font-medium text-slate-700">
            Phone / WhatsApp (with country code)
          </label>
          <input
            name="phone"
            className="block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-[#172965] focus:outline-none focus:ring-1 focus:ring-[#172965]"
          />
        </div>

        {/* Location */}
        <div className="space-y-1">
          <label className="block text-xs font-medium text-slate-700">
            Current location (City, Country)
          </label>
          <input
            name="location"
            className="block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-[#172965] focus:outline-none focus:ring-1 focus:ring-[#172965]"
          />
        </div>

        {/* LinkedIn */}
        <div className="space-y-1">
          <label className="block text-xs font-medium text-slate-700">
            LinkedIn profile
          </label>
          <input
            name="linkedinUrl"
            type="url"
            placeholder="https://www.linkedin.com/in/..."
            className="block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-[#172965] focus:outline-none focus:ring-1 focus:ring-[#172965]"
          />
        </div>

        {/* Portfolio / CV */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1">
            <label className="block text-xs font-medium text-slate-700">
              Portfolio / GitHub / personal site
            </label>
            <input
              name="portfolioUrl"
              type="url"
              placeholder="https://..."
              className="block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-[#172965] focus:outline-none focus:ring-1 focus:ring-[#172965]"
            />
          </div>
          <div className="space-y-1">
            <label className="block text-xs font-medium text-slate-700">
              CV / Résumé link
            </label>
            <input
              name="cvUrl"
              type="url"
              placeholder="Google Drive, Dropbox, etc."
              className="block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-[#172965] focus:outline-none focus:ring-1 focus:ring-[#172965]"
            />
          </div>
        </div>

        {/* Short note */}
        <div className="space-y-1">
          <label className="block text-xs font-medium text-slate-700">
            Short note (optional)
          </label>
          <textarea
            name="coverLetter"
            rows={4}
            className="block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-[#172965] focus:outline-none focus:ring-1 focus:ring-[#172965]"
            placeholder="Context on your experience and why this brief makes sense for you."
          />
        </div>

        {/* Status messages */}
        {status === "success" && (
          <p className="text-xs text-emerald-600">
            Thanks — your application has been received. We&apos;ll review and
            circle back if it&apos;s a strong match.
          </p>
        )}
        {status === "error" && (
          <p className="text-xs text-red-600">
            {errorMessage ||
              "Something went wrong while submitting. Please try again."}
          </p>
        )}

        {/* Submit button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex items-center justify-center rounded-lg bg-[#172965] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#111c4c] disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isSubmitting ? "Submitting..." : "Submit application"}
        </button>

        <p className="mt-2 text-[0.7rem] text-slate-500">
          By submitting, you agree that we can store your details and reach out
          when we see a strong match. We won&apos;t spam you or sell your data.
        </p>
      </form>
    </section>
  );
}
