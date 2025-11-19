// app/jobs/JobApplyForm.tsx
"use client";

import { useState } from "react";

type JobApplyFormProps = {
  jobSlug: string;    // slug or id used in the URL
  jobTitle: string;
};

export default function JobApplyForm({ jobSlug, jobTitle }: JobApplyFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSuccessMessage(null);
    setErrorMessage(null);

    const formData = new FormData(e.currentTarget);

    try {
      const res = await fetch(
        `/api/jobs/${encodeURIComponent(jobSlug)}/apply`,
        {
          method: "POST",
          body: formData, // includes file(s) because of FormData
        }
      );

      if (!res.ok) {
        let message = "Something went wrong while submitting your application.";
        try {
          const data = await res.json();
          if (data?.error) message = data.error;
        } catch {
          // ignore
        }
        setErrorMessage(message);
      } else {
        setSuccessMessage(
          "Thanks — your application has been received. We’ll review and reach out if there’s a strong match."
        );
        e.currentTarget.reset();
      }
    } catch (err) {
      console.error(err);
      setErrorMessage("Network error. Please try again in a moment.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      encType="multipart/form-data"
      className="space-y-5"
    >
      <div className="space-y-1">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Your details
        </p>
        <p className="text-xs text-slate-600">
          Apply directly for <span className="font-medium">{jobTitle}</span>.
          Share the channels you actually use so we can reach you properly.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label className="block text-xs font-medium text-slate-700">
            Full name<span className="text-red-500">*</span>
          </label>
          <input
            name="fullName"
            required
            className="block w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-[#172965] focus:outline-none focus:ring-1 focus:ring-[#172965]"
          />
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-medium text-slate-700">
            Email<span className="text-red-500">*</span>
          </label>
          <input
            type="email"
            name="email"
            required
            className="block w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-[#172965] focus:outline-none focus:ring-1 focus:ring-[#172965]"
          />
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-medium text-slate-700">
            Phone / WhatsApp (with country code)
          </label>
          <input
            name="phone"
            placeholder="+234..."
            className="block w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-[#172965] focus:outline-none focus:ring-1 focus:ring-[#172965]"
          />
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-medium text-slate-700">
            Current location (City, Country)
          </label>
          <input
            name="location"
            placeholder="Lagos, Nigeria"
            className="block w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-[#172965] focus:outline-none focus:ring-1 focus:ring-[#172965]"
          />
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-medium text-slate-700">
            LinkedIn profile
          </label>
          <input
            type="url"
            name="linkedinUrl"
            placeholder="https://www.linkedin.com/in/..."
            className="block w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-[#172965] focus:outline-none focus:ring-1 focus:ring-[#172965]"
          />
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-medium text-slate-700">
            Portfolio / GitHub / personal site (optional)
          </label>
          <input
            type="url"
            name="portfolioUrl"
            placeholder="https://..."
            className="block w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-[#172965] focus:outline-none focus:ring-1 focus:ring-[#172965]"
          />
        </div>
      </div>

      {/* CV upload + link */}
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          CV / Resume
        </p>
        <div className="grid gap-4 sm:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-slate-700">
              Upload CV file
            </label>
            <input
              type="file"
              name="cvFile"
              accept=".pdf,.doc,.docx,.rtf"
              className="block w-full text-xs text-slate-700 file:mr-3 file:rounded-md file:border-0 file:bg-[#172965] file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-white hover:file:bg-[#111c4c]"
            />
            <p className="mt-1 text-[0.7rem] text-slate-500">
              PDF preferred. Max ~5–10MB depending on your browser limits.
            </p>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-slate-700">
              Or paste a CV link (Drive, Dropbox, Notion, etc.)
            </label>
            <input
              type="url"
              name="cvUrl"
              placeholder="https://drive.google.com/..."
              className="block w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-[#172965] focus:outline-none focus:ring-1 focus:ring-[#172965]"
            />
          </div>
        </div>
      </div>

      {/* Context */}
      <div className="space-y-1.5">
        <label className="block text-xs font-medium text-slate-700">
          In 4–6 bullet points, tell us where you create the most value.
        </label>
        <p className="text-[0.7rem] text-slate-500">
          Think of this as the “real” version of your CV headline — what you’ve
          actually done, not just your title.
        </p>
        <textarea
          name="coverLetter"
          rows={5}
          className="mt-1 block w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-[#172965] focus:outline-none focus:ring-1 focus:ring-[#172965]"
        />
      </div>

      {/* Hidden / soft fields */}
      <input type="hidden" name="source" value="Job detail – website" />

      {/* Messages */}
      {errorMessage && (
        <div className="rounded-md bg-red-50 px-3 py-2 text-xs text-red-700">
          {errorMessage}
        </div>
      )}
      {successMessage && (
        <div className="rounded-md bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
          {successMessage}
        </div>
      )}

      <div className="flex items-center justify-between gap-3">
        <p className="text-[0.7rem] text-slate-500">
          By submitting, you agree we can store your details for relevant
          searches. No spam. No selling your data.
        </p>
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex items-center justify-center rounded-lg bg-[#172965] px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-[#111c4c] disabled:cursor-not-allowed disabled:opacity-70 sm:text-sm"
        >
          {isSubmitting ? "Submitting…" : "Submit application"}
        </button>
      </div>
    </form>
  );
}
