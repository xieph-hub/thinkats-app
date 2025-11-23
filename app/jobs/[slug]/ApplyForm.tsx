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
    if (isSubmitting) return;

    setIsSubmitting(true);
    setApiError(null);
    setSuccess(false);

    try {
      const form = e.currentTarget;
      const formData = new FormData(form);

      const fullName = (formData.get("fullName") || "").toString().trim();
      const email = (formData.get("email") || "").toString().trim();

      if (!fullName || !email) {
        throw new Error("Full name and email are required.");
      }

      // Let the browser set multipart headers
      const res = await fetch(
        `/api/public/jobs/${encodeURIComponent(jobSlug)}/apply`,
        {
          method: "POST",
          body: formData,
        }
      );

      let body: any = null;
      try {
        body = await res.json();
      } catch {
        // ignore parse error
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
      setApiError(err?.message || "Unexpected error while submitting.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="mt-10 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
      <h2 className="text-lg font-semibold text-slate-900">
        Apply for {jobTitle}
      </h2>
      <p className="mt-1 text-xs text-slate-600">
        Share a few details and attach your CV. We&apos;ll review and get back
        to you.
      </p>

      <form
        onSubmit={handleSubmit}
        className="mt-4 space-y-4"
        encType="multipart/form-data"
      >
        {apiError && (
          <p className="text-xs text-red-600">{apiError}</p>
        )}

        {success && (
          <p className="text-xs text-emerald-700">
            Thank you for your interest in the role. Your application has been
            received. We&apos;ll be in touch if there&apos;s a strong match.
          </p>
        )}

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
              Phone / WhatsApp
            </label>
            <input
              name="phone"
              type="text"
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#172965] focus:ring-1 focus:ring-[#172965]"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700">
              Current location (city, country)
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
              Portfolio / GitHub (optional)
            </label>
            <input
              name="portfolioUrl"
              type="url"
              placeholder="https://..."
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#172965] focus:ring-1 focus:ring-[#172965]"
            />
          </div>
        </div>

        {/* CV upload + link */}
        <div>
          <label className="block text-xs font-medium text-slate-700">
            Upload CV / Resume (PDF or DOC/DOCX)
          </label>
          <input
            name="cvFile"
            type="file"
            accept=".pdf,.doc,.docx,.rtf"
            className="mt-1 block w-full text-xs text-slate-700 file:mr-3 file:rounded-full file:border-0 file:bg-[#172965] file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-white hover:file:bg-[#111c4c]"
          />
          <p className="mt-1 text-[11px] text-slate-500">
            You can also paste a link instead of uploading.
          </p>
        </div>

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

        <p className="text-[0.7rem] text-slate-500">
          By submitting, you agree that we can store your details and reach out
          when we see a strong match. We won&apos;t spam you or sell your data.
        </p>

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
