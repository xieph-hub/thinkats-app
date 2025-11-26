// app/jobs/[jobIdOrSlug]/JobApplyForm.tsx
"use client";

import { useState } from "react";

type Props = {
  jobId: string;
};

export function JobApplyForm({ jobId }: Props) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [location, setLocation] = useState("");
  const [currentTitle, setCurrentTitle] = useState("");
  const [currentCompany, setCurrentCompany] = useState("");
  const [cvFile, setCvFile] = useState<File | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const formData = new FormData();
      formData.append("fullName", fullName);
      formData.append("email", email);
      if (location) formData.append("location", location);
      if (currentTitle) formData.append("currentTitle", currentTitle);
      if (currentCompany) formData.append("currentCompany", currentCompany);
      if (cvFile) formData.append("cv", cvFile);

      const res = await fetch(`/api/jobs/${jobId}/apply`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(
          data.error ||
            "We couldn't submit your application. Please try again or email your CV instead."
        );
      }

      setSuccessMessage("Thank you. Your application has been received.");
      setFullName("");
      setEmail("");
      setLocation("");
      setCurrentTitle("");
      setCurrentCompany("");
      setCvFile(null);
      (document.getElementById("job-apply-cv-input") as HTMLInputElement | null)?.value = "";
    } catch (err: any) {
      setError(
        err?.message ||
          "We couldn't submit your application. Please try again or email your CV instead."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      {successMessage && (
        <div className="mb-3 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-800">
          {successMessage}
        </div>
      )}

      {error && (
        <div className="mb-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="space-y-1">
          <label className="block text-xs font-medium text-slate-700">
            Full name *
          </label>
          <input
            type="text"
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="block w-full rounded-md border border-slate-300 px-2.5 py-1.5 text-xs text-slate-900 shadow-sm focus:border-resourcin-blue focus:outline-none focus:ring-1 focus:ring-resourcin-blue"
          />
        </div>

        <div className="space-y-1">
          <label className="block text-xs font-medium text-slate-700">
            Email *
          </label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="block w-full rounded-md border border-slate-300 px-2.5 py-1.5 text-xs text-slate-900 shadow-sm focus:border-resourcin-blue focus:outline-none focus:ring-1 focus:ring-resourcin-blue"
          />
        </div>

        <div className="space-y-1">
          <label className="block text-xs font-medium text-slate-700">
            Current role / company
          </label>
          <div className="grid gap-2 sm:grid-cols-2">
            <input
              type="text"
              value={currentTitle}
              onChange={(e) => setCurrentTitle(e.target.value)}
              placeholder="Current title"
              className="block w-full rounded-md border border-slate-300 px-2.5 py-1.5 text-xs text-slate-900 shadow-sm focus:border-resourcin-blue focus:outline-none focus:ring-1 focus:ring-resourcin-blue"
            />
            <input
              type="text"
              value={currentCompany}
              onChange={(e) => setCurrentCompany(e.target.value)}
              placeholder="Current company"
              className="block w-full rounded-md border border-slate-300 px-2.5 py-1.5 text-xs text-slate-900 shadow-sm focus:border-resourcin-blue focus:outline-none focus:ring-1 focus:ring-resourcin-blue"
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="block text-xs font-medium text-slate-700">
            Location
          </label>
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="City, Country"
            className="block w-full rounded-md border border-slate-300 px-2.5 py-1.5 text-xs text-slate-900 shadow-sm focus:border-resourcin-blue focus:outline-none focus:ring-1 focus:ring-resourcin-blue"
          />
        </div>

        <div className="space-y-1">
          <label className="block text-xs font-medium text-slate-700">
            CV / Resume (PDF or DOC)
          </label>
          <input
            id="job-apply-cv-input"
            type="file"
            accept=".pdf,.doc,.docx"
            onChange={(e) => {
              const file = e.target.files?.[0] || null;
              setCvFile(file);
            }}
            className="block w-full text-xs text-slate-700 file:mr-3 file:rounded-md file:border-0 file:bg-slate-100 file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-slate-700 hover:file:bg-slate-200"
          />
          <p className="text-[11px] text-slate-400">
            If this fails, you can email your CV instead.
          </p>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="mt-1 w-full rounded-md bg-resourcin-blue px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-slate-900 disabled:opacity-60"
        >
          {submitting ? "Submitting…" : "Submit application"}
        </button>
      </form>
    </div>
  );
}
