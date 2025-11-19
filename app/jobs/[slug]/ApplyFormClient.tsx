"use client";

import { useState } from "react";

type ApplyFormClientProps = {
  jobId: string;
  jobTitle: string;
};

export default function ApplyFormClient({
  jobId,
  jobTitle,
}: ApplyFormClientProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (isSubmitting) return;

    // reset state for a fresh submission
    setIsSubmitting(true);
    setError(null);
    setSuccess(false);

    const formData = new FormData(e.currentTarget);

    const payload = {
      fullName: (formData.get("fullName") ?? "").toString().trim(),
      email: (formData.get("email") ?? "").toString().trim(),
      phone: (formData.get("phone") ?? "").toString().trim() || null,
      location: (formData.get("location") ?? "").toString().trim() || null,
      linkedinUrl:
        (formData.get("linkedinUrl") ?? "").toString().trim() || null,
      portfolioUrl:
        (formData.get("portfolioUrl") ?? "").toString().trim() || null,
      cvUrl: (formData.get("cvUrl") ?? "").toString().trim() || null, // still link for now
      coverLetter:
        (formData.get("coverLetter") ?? "").toString().trim() || null,
      source: "Job apply form",
    };

    if (!payload.fullName || !payload.email) {
      setError("Please add your full name and email.");
      setIsSubmitting(false);
      return;
    }

    try {
      const res = await fetch(`/api/jobs/${jobId}/apply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      let data: any = {};
      try {
        data = await res.json();
      } catch {
        // ignore JSON parse errors
      }

      console.log("Apply response:", res.status, data);

      if (!res.ok) {
        const message =
          data?.error ||
          data?.message ||
          "Unexpected error while submitting application.";
        setSuccess(false);
        setError(message);
        return;
      }

      // ✅ success path – make sure error is cleared
      setError(null);
      setSuccess(true);
      e.currentTarget.reset();
    } catch (err) {
      console.error("Apply error", err);
      setSuccess(false);
      setError("Unexpected error while submitting application.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Section: basic info */}
      <div className="space-y-4">
        <h2 className="text-sm font-semibold text-slate-900">Your details</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-slate-700">
              Full name *
            </label>
            <input
              name="fullName"
              type="text"
              required
              className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-[#172965] focus:outline-none focus:ring-1 focus:ring-[#172965]"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700">
              Email *
            </label>
            <input
              name="email"
              type="email"
              required
              className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-[#172965] focus:outline-none focus:ring-1 focus:ring-[#172965]"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700">
              Phone / WhatsApp
            </label>
            <input
              name="phone"
              type="text"
              placeholder="+234…"
              className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-[#172965] focus:outline-none focus:ring-1 focus:ring-[#172965]"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700">
              Current location (City, Country)
            </label>
            <input
              name="location"
              type="text"
              placeholder="Lagos, Nigeria"
              className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-[#172965] focus:outline-none focus:ring-1 focus:ring-[#172965]"
            />
          </div>
        </div>
      </div>

      {/* Section: links */}
      <div className="space-y-4">
        <h2 className="text-sm font-semibold text-slate-900">
          Profiles & CV
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-medium text-slate-700">
              LinkedIn
            </label>
            <input
              name="linkedinUrl"
              type="url"
              placeholder="https://www.linkedin.com/in/…"
              className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-[#172965] focus:outline-none focus:ring-1 focus:ring-[#172965]"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700">
              Portfolio / GitHub / Personal site
            </label>
            <input
              name="portfolioUrl"
              type="url"
              placeholder="https://…"
              className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-[#172965] focus:outline-none focus:ring-1 focus:ring-[#172965]"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-slate-700">
              CV / Resume link
            </label>
            <input
              name="cvUrl"
              type="url"
              placeholder="Google Drive, Dropbox, etc."
              className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-[#172965] focus:outline-none focus:ring-1 focus:ring-[#172965]"
            />
            <p className="mt-1 text-[0.7rem] text-slate-500">
              We’ll wire proper file upload + storage later; for now, a
              shareable link is perfect.
            </p>
          </div>
        </div>
      </div>

      {/* Section: value & notes */}
      <div className="space-y-4">
        <h2 className="text-sm font-semibold text-slate-900">
          Where you create the most value
        </h2>
        <p className="text-xs text-slate-500">
          Think of this as the real version of your CV headline — what
          you&apos;ve actually driven, not just your title.
        </p>
        <textarea
          name="coverLetter"
          rows={6}
          placeholder={`In 4–6 bullet points, tell us where you create the most value for a role like "${jobTitle}".`}
          className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-[#172965] focus:outline-none focus:ring-1 focus:ring-[#172965]"
        />
      </div>

      {/* Status + submit */}
      {error && !success && (
        <div className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">
          {error}
        </div>
      )}

      {success && !error && (
        <div className="rounded-lg bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
          Thanks — your application has been received. We&apos;ll be in touch
          if there&apos;s a strong match.
        </div>
      )}

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex items-center justify-center rounded-lg bg-[#172965] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#111c4c] disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isSubmitting ? "Submitting…" : "Submit application"}
        </button>
        <p className="text-[0.7rem] text-slate-500">
          By submitting, you agree that we can store your details and reach
          out when we see a strong match. No spam, no list-selling.
        </p>
      </div>
    </form>
  );
}
