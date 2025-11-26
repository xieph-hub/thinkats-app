// components/jobs/JobApplyForm.tsx
"use client";

import { useState } from "react";

type JobApplyFormProps = {
  jobId: string;
  jobTitle: string;
};

type Status = "idle" | "submitting" | "success" | "error";

export default function JobApplyForm({ jobId, jobTitle }: JobApplyFormProps) {
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("submitting");
    setError(null);

    const form = e.currentTarget;
    const formData = new FormData(form);

    // Ensure jobId is present for the API
    formData.set("jobId", jobId);

    try {
      const res = await fetch("/api/jobs/apply", {
        method: "POST",
        body: formData,
      });

      const json = await res.json().catch(() => null);

      if (!res.ok || !json?.success) {
        const message =
          json?.error || "Could not submit your application. Please try again.";
        setError(message);
        setStatus("error");
        return;
      }

      setStatus("success");
      form.reset();
    } catch (err) {
      console.error("Submit application error", err);
      setError("Could not submit your application. Please try again.");
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-800">
        <p className="font-medium">
          Thank you. Your application has been received.
        </p>
        <p className="mt-1">
          We&apos;ll review your profile for{" "}
          <span className="font-semibold">{jobTitle}</span> and be in touch if
          there&apos;s a fit.
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-3 text-sm"
      encType="multipart/form-data"
    >
      {/* Hidden jobId for the API */}
      <input type="hidden" name="jobId" value={jobId} />

      <div className="grid gap-3 md:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-700">
            Full name *
          </label>
          <input
            name="fullName"
            required
            className="w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm outline-none ring-0 focus:border-resourcin-blue focus:ring-1 focus:ring-resourcin-blue"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-700">
            Email *
          </label>
          <input
            name="email"
            type="email"
            required
            className="w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm outline-none ring-0 focus:border-resourcin-blue focus:ring-1 focus:ring-resourcin-blue"
          />
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-700">
            Phone
          </label>
          <input
            name="phone"
            className="w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm outline-none ring-0 focus:border-resourcin-blue focus:ring-1 focus:ring-resourcin-blue"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-700">
            Location (city, country)
          </label>
          <input
            name="location"
            className="w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm outline-none ring-0 focus:border-resourcin-blue focus:ring-1 focus:ring-resourcin-blue"
          />
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-700">
            LinkedIn
          </label>
          <input
            name="linkedinUrl"
            placeholder="https://linkedin.com/in/..."
            className="w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm outline-none ring-0 focus:border-resourcin-blue focus:ring-1 focus:ring-resourcin-blue"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-700">
            Portfolio / website
          </label>
          <input
            name="portfolioUrl"
            placeholder="https://..."
            className="w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm outline-none ring-0 focus:border-resourcin-blue focus:ring-1 focus:ring-resourcin-blue"
          />
        </div>
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-slate-700">
          CV / résumé (URL or upload)
        </label>
        <input
          name="cvUrl"
          placeholder="Paste a public CV link (Google Drive, Dropbox, etc.)"
          className="mb-2 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm outline-none ring-0 focus:border-resourcin-blue focus:ring-1 focus:ring-resourcin-blue"
        />
        <input
          name="cv"
          type="file"
          className="block w-full text-xs text-slate-600 file:mr-3 file:rounded-md file:border-0 file:bg-slate-100 file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-slate-800 hover:file:bg-slate-200"
        />
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-slate-700">
          Cover letter / short note
        </label>
        <textarea
          name="coverLetter"
          rows={4}
          className="w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm outline-none ring-0 focus:border-resourcin-blue focus:ring-1 focus:ring-resourcin-blue"
        />
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-700">
            Notice period
          </label>
          <input
            name="noticePeriod"
            placeholder="e.g. 4 weeks"
            className="w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm outline-none ring-0 focus:border-resourcin-blue focus:ring-1 focus:ring-resourcin-blue"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-700">
            Current gross (annual)
          </label>
          <input
            name="currentGrossAnnual"
            placeholder="e.g. 15,000,000 NGN"
            className="w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm outline-none ring-0 focus:border-resourcin-blue focus:ring-1 focus:ring-resourcin-blue"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-700">
            Expected gross (annual)
          </label>
          <input
            name="grossAnnualExpectation"
            placeholder="e.g. 20,000,000 NGN"
            className="w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm outline-none ring-0 focus:border-resourcin-blue focus:ring-1 focus:ring-resourcin-blue"
          />
        </div>
      </div>

      {error && <p className="text-xs text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={status === "submitting"}
        className="inline-flex w-full items-center justify-center rounded-md bg-resourcin-blue px-3 py-2 text-sm font-medium text-white shadow-sm hover:bg-resourcin-blue/90 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {status === "submitting" ? "Submitting..." : "Submit application"}
      </button>
    </form>
  );
}
