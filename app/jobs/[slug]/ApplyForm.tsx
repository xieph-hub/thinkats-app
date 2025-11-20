// app/jobs/[slug]/ApplyForm.tsx
"use client";

import { useState } from "react";

type ApplyFormProps = {
  jobSlug: string;
  jobTitle: string;
};

export default function ApplyForm({ jobSlug, jobTitle }: ApplyFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setApiError(null);
    setSuccess(false);
    setIsSubmitting(true);

    try {
      const form = e.currentTarget;
      const formData = new FormData(form);

      const payload = {
        fullName: (formData.get("fullName") || "").toString().trim(),
        email: (formData.get("email") || "").toString().trim(),
        phone: (formData.get("phone") || "").toString().trim() || null,
        location: (formData.get("location") || "").toString().trim() || null,
        linkedinUrl:
          (formData.get("linkedinUrl") || "").toString().trim() || null,
        portfolioUrl:
          (formData.get("portfolioUrl") || "").toString().trim() || null,
        cvUrl: (formData.get("cvUrl") || "").toString().trim() || null,
        coverLetter:
          (formData.get("coverLetter") || "").toString().trim() || null,
        source: "Website",
      };

      if (!payload.fullName || !payload.email) {
        throw new Error("Full name and email are required.");
      }

      const res = await fetch(`/api/jobs/${jobSlug}/apply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        let message = "Failed to submit application.";
        try {
          const body = await res.json();
          if (body?.error) message = body.error;
        } catch (_) {
          // ignore
        }
        throw new Error(message);
      }

      setSuccess(true);
      form.reset();
    } catch (err: any) {
      setApiError(err?.message || "Something went wrong.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
      <h2 className="text-lg font-semibold text-slate-900">
        Apply for {jobTitle}
      </h2>
      <p className="mt-1 text-xs text-slate-600">
        Share a few details and a link to your CV. We&apos;ll review and get
        back to you.
      </p>

      <form onSubmit={handleSubmit} className="mt-4 space-y-4">
        {/* Name + email */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-medium text-slate-700">
              Full name *
            </label>
            <input
              name="fullName"
              type="text"
              required
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#172965] focus:ring-1 focus:ring-[#172965]"
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
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#172965] focus:ring-1 focus:ring-[#172965]"
            />
          </div>
        </div>

        {/* Phone + location */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-medium text-slate-700">
              Phone
            </label>
            <input
              name="phone"
              type="text"
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#172965] focus:ring-1 focus:ring-[#172965]"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700">
              Location (city, country)
            </label>
            <input
              name="location"
              type="text"
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#172965] focus:ring-1 focus:ring-[#172965]"
            />
          </div>
        </div>

        {/* Links */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-medium text-slate-700">
              LinkedIn URL
            </label>
            <input
              name="linkedinUrl"
              type="url"
              placeholder="https://linkedin.com/in/..."
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#172965] focus:ring-1 focus:ring-[#172965]"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700">
              Portfolio / GitHub URL (optional)
            </label>
            <input
              name="portfolioUrl"
              type="url"
              placeholder="https://..."
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#172965] focus:ring-1 focus:ring-[#172965]"
            />
          </div>
        </div>

        {/* CV link */}
        <div>
          <label className="block text-xs font-medium text-slate-700">
            CV link (Google Drive, Dropbox, etc.)
          </label>
          <input
            name="cvUrl"
            type="url"
            placeholder="https://..."
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#172965] focus:ring-1 focus:ring-[#172965]"
          />
          <p className="mt-1 text-[11px] text-slate-500">
            You can paste a link to your CV for now. We can upgrade this to file
            upload later.
          </p>
        </div>

        {/* Cover letter */}
        <div>
          <label className="block text-xs font-medium text-slate-700">
            Short note / cover letter
          </label>
          <textarea
            name="coverLetter"
            rows={4}
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#172965] focus:ring-1 focus:ring-[#172965]"
          />
        </div>

        {/* Errors / success */}
        {apiError && (
          <p className="text-xs text-red-600">
            {apiError}
          </p>
        )}

        {success && (
          <p className="text-xs text-emerald-700">
            Application submitted. We&apos;ll review and reach out if there&apos;s
            a fit.
          </p>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex items-center rounded-full bg-[#172965] px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#111b4a] disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isSubmitting ? "Submitting…" : "Submit application"}
        </button>
      </form>
    </section>
  );
}
