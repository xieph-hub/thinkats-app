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

      const getString = (name: string): string | undefined => {
        const value = formData.get(name);
        if (typeof value !== "string") return undefined;
        const trimmed = value.trim();
        return trimmed.length > 0 ? trimmed : undefined;
      };

      const payload = {
        fullName: getString("fullName") ?? "",
        email: getString("email") ?? "",
        phone: getString("phone"),
        location: getString("location"),
        linkedinUrl: getString("linkedinUrl"),
        portfolioUrl: getString("portfolioUrl"),
        cvUrl: getString("cvUrl"),
        coverLetter: getString("coverLetter"),
        source: "Website",
      };

      if (!payload.fullName || !payload.email) {
        throw new Error("Full name and email are required.");
      }

      const res = await fetch(`/api/jobs/${encodeURIComponent(jobSlug)}/apply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      let body: any = null;
      try {
        body = await res.json();
      } catch {
        // ignore JSON parse error
      }

      if (!res.ok || body?.error) {
        const message =
          body?.error ||
          `Failed to submit application (status ${res.status}).`;
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

        {apiError && (
          <p className="text-xs text-red-600">
            {apiError}
          </p>
        )}

        {success && (
          <p className="text-xs text-emerald-700">
            Thank you for your interest in the role. Your application has been
            received. We&apos;ll be in touch if there&apos;s a strong match.
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
