"use client";

import { useState } from "react";

type JobApplyFormProps = {
  slug: string;
  jobTitle: string;
};

export default function JobApplyForm({ slug, jobTitle }: JobApplyFormProps) {
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (submitting) return;

    setSubmitting(true);
    setSuccessMessage(null);
    setErrorMessage(null);

    const form = e.currentTarget;
    const formData = new FormData(form);

    try {
      const res = await fetch(`/api/jobs/${encodeURIComponent(slug)}/apply`, {
        method: "POST",
        body: formData,
      });

      let data: any = {};
      try {
        data = await res.json();
      } catch {
        // ignore JSON parse error
      }

      if (!res.ok || data?.error) {
        setErrorMessage(
          data?.error || "Unexpected error while submitting application."
        );
      } else {
        setSuccessMessage(
          "Thanks — your application has been received. We'll be in touch if there's a strong match."
        );
        form.reset();
      }
    } catch (err) {
      console.error("Application submit error", err);
      setErrorMessage("Unexpected error while submitting application.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-5"
      encType="multipart/form-data"
    >
      {successMessage && (
        <div className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          {successMessage}
        </div>
      )}
      {errorMessage && (
        <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">
          {errorMessage}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-xs font-medium text-slate-700">
            Full name
          </label>
          <input
            name="fullName"
            required
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-[#172965] focus:outline-none focus:ring-1 focus:ring-[#172965]"
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
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-[#172965] focus:outline-none focus:ring-1 focus:ring-[#172965]"
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-xs font-medium text-slate-700">
            Phone / WhatsApp (with country code)
          </label>
          <input
            name="phone"
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-[#172965] focus:outline-none focus:ring-1 focus:ring-[#172965]"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-700">
            Current location (City, Country)
          </label>
          <input
            name="location"
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-[#172965] focus:outline-none focus:ring-1 focus:ring-[#172965]"
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-xs font-medium text-slate-700">
            LinkedIn profile
          </label>
          <input
            name="linkedinUrl"
            type="url"
            placeholder="https://www.linkedin.com/in/..."
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-[#172965] focus:outline-none focus:ring-1 focus:ring-[#172965]"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-700">
            Portfolio / GitHub / Personal site (optional)
          </label>
          <input
            name="portfolioUrl"
            type="url"
            placeholder="https://..."
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-[#172965] focus:outline-none focus:ring-1 focus:ring-[#172965]"
          />
        </div>
      </div>

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
        <p className="mt-1 text-[0.7rem] text-slate-500">
          If you prefer, you can paste a link instead.
        </p>
      </div>

      <div>
        <label className="block text-xs font-medium text-slate-700">
          CV / Resume link (optional)
        </label>
        <input
          name="cvUrl"
          type="url"
          placeholder="Link to Drive, Dropbox, etc."
          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-[#172965] focus:outline-none focus:ring-1 focus:ring-[#172965]"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-slate-700">
          In 4–6 bullet points, tell us where you create the most value.
        </label>
        <textarea
          name="headline"
          rows={4}
          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-[#172965] focus:outline-none focus:ring-1 focus:ring-[#172965]"
          placeholder="Think of this as the “real” version of your CV headline — what you've actually done, not just your title."
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-slate-700">
          Anything else we should know?
        </label>
        <textarea
          name="notes"
          rows={3}
          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-[#172965] focus:outline-none focus:ring-1 focus:ring-[#172965]"
          placeholder="Context on notice period, relocation, visa status, etc."
        />
      </div>

      <p className="text-[0.7rem] text-slate-500">
        By submitting, you agree that we can store your details and reach out
        when we see a strong match. We won't spam you or sell your data.
      </p>

      <div className="flex items-center justify-between gap-3 pt-1">
        <button
          type="submit"
          disabled={submitting}
          className="inline-flex items-center justify-center rounded-lg bg-[#172965] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#111c4c] disabled:cursor-not-allowed disabled:opacity-70"
        >
          {submitting ? "Submitting..." : "Submit application"}
          <span className="ml-1.5 text-xs" aria-hidden="true">
            →
          </span>
        </button>
      </div>
    </form>
  );
}
