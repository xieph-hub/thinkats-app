// app/jobs/PublicJobApplyForm.tsx
"use client";

import { useState } from "react";

type PublicJobApplyFormProps = {
  jobId: string;
  jobTitle: string;
};

export default function PublicJobApplyForm({
  jobId,
  jobTitle,
}: PublicJobApplyFormProps) {
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (submitting) return;

    setSubmitting(true);
    setSuccessMessage(null);
    setErrorMessage(null);

    try {
      const form = e.currentTarget;
      const formData = new FormData(form);

      // Make sure jobId is always included
      formData.set("jobId", jobId);

      const res = await fetch("/api/public-apply", {
        method: "POST",
        body: formData, // IMPORTANT: no Content-Type header here
      });

      let data: any = null;
      try {
        data = await res.json();
      } catch {
        // ignore
      }

      if (!res.ok || data?.error) {
        setErrorMessage(data?.error || "Failed to submit application.");
      } else {
        setSuccessMessage(
          "Thank you for your interest in the role. Your application has been received. We'll be in touch if there's a strong match."
        );
        form.reset();
      }
    } catch (err) {
      console.error("Public apply form error:", err);
      setErrorMessage("Unexpected error while submitting application.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
      <h2 className="text-lg font-semibold text-slate-900">
        Apply for {jobTitle}
      </h2>
      <p className="mt-1 text-xs text-slate-600">
        Share a few details and your CV. You don&apos;t need an account to
        apply.
      </p>

      <form
        onSubmit={handleSubmit}
        className="mt-4 space-y-4"
        encType="multipart/form-data"
      >
        {/* Hidden job id so API knows which job this is for */}
        <input type="hidden" name="jobId" value={jobId} />

        {/* Success / error */}
        {successMessage && (
          <div className="rounded-md bg-emerald-50 px-3 py-2 text-xs text-emerald-800">
            {successMessage}
          </div>
        )}
        {errorMessage && (
          <div className="rounded-md bg-red-50 px-3 py-2 text-xs text-red-800">
            {errorMessage}
          </div>
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
              LinkedIn profile
            </label>
            <input
              name="linkedinUrl"
              type="url"
              placeholder="https://www.linkedin.com/in/..."
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#172965] focus:ring-1 focus:ring-[#172965]"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700">
              Portfolio / GitHub / personal site
            </label>
            <input
              name="portfolioUrl"
              type="url"
              placeholder="https://..."
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#172965] focus:ring-1 focus:ring-[#172965]"
            />
          </div>
        </div>

        {/* CV upload + optional link */}
        <div>
          <label className="block text-xs font-medium text-slate-700">
            Upload CV / Resume (PDF, DOC, DOCX)
          </label>
          <input
            name="cvFile"
            type="file"
            accept=".pdf,.doc,.docx,.rtf"
            className="mt-1 block w-full text-xs text-slate-700 file:mr-3 file:rounded-full file:border-0 file:bg-[#172965] file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-white hover:file:bg-[#111c4c]"
          />
          <p className="mt-1 text-[0.7rem] text-slate-500">
            You can also paste a link instead, if easier.
          </p>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-700">
            CV / Resume link (optional)
          </label>
          <input
            name="cvUrl"
            type="url"
            placeholder="Google Drive, Dropbox, etc."
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#172965] focus:ring-1 focus:ring-[#172965]"
          />
        </div>

        {/* Cover letter / notes */}
        <div>
          <label className="block text-xs font-medium text-slate-700">
            Short note / cover letter
          </label>
          <textarea
            name="coverLetter"
            rows={4}
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#172965] focus:ring-1 focus:ring-[#172965]"
            placeholder="Key context, notice period, why this role, etc."
          />
        </div>

        <p className="text-[0.7rem] text-slate-500">
          By submitting, you agree that we can store your details and reach out
          when we see a strong match. We won&apos;t spam you or sell your data.
        </p>

        <button
          type="submit"
          disabled={submitting}
          className="inline-flex items-center rounded-full bg-[#172965] px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#111b4a] disabled:cursor-not-allowed disabled:opacity-70"
        >
          {submitting ? "Submitting…" : "Submit application"}
        </button>
      </form>
    </section>
  );
}
