// components/JobApplyForm.tsx
"use client";

import { FormEvent, useState } from "react";

type JobApplyFormProps = {
  jobId: string;
  jobTitle: string;
};

type Status = "idle" | "submitting" | "success" | "error";

export default function JobApplyForm({ jobId, jobTitle }: JobApplyFormProps) {
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("submitting");
    setError(null);

    const form = e.currentTarget;
    const formData = new FormData(form);

    // Make sure jobId & source are always included
    formData.set("jobId", jobId);
    formData.set("source", "job_detail");

    try {
      const res = await fetch("/api/apply", {
        method: "POST",
        body: formData,
      });

      let json: any = null;
      try {
        json = await res.json();
      } catch {
        // ignore JSON parse errors, we'll just show a generic message
      }

      if (!res.ok || !json?.ok) {
        setStatus("error");
        setError(
          (json && typeof json.error === "string" && json.error) ||
            "Something went wrong while submitting your application. Please try again."
        );
        return;
      }

      // Success
      form.reset();
      setStatus("success");
    } catch (err) {
      console.error(err);
      setStatus("error");
      setError(
        "Something went wrong while submitting your application. Please try again."
      );
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      encType="multipart/form-data"
      className="space-y-4 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 sm:p-5"
    >
      {/* Hidden jobId so it's always present */}
      <input type="hidden" name="jobId" value={jobId} />

      <h2 className="text-sm font-semibold text-slate-900">
        Apply for this role
      </h2>
      <p className="text-xs text-slate-500">
        You&apos;re applying for{" "}
        <span className="font-medium text-slate-900">{jobTitle}</span>. Share a
        few details and your CV.
      </p>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="block text-xs font-medium text-slate-700">
            Full name
          </label>
          <input
            name="fullName"
            type="text"
            required
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#172965]"
            placeholder="Jane Doe"
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
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#172965]"
            placeholder="you@email.com"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-700">
            Phone / WhatsApp
          </label>
          <input
            name="phone"
            type="tel"
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#172965]"
            placeholder="+234…"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-700">
            Location
          </label>
          <input
            name="location"
            type="text"
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#172965]"
            placeholder="Lagos, Remote, etc."
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-700">
            LinkedIn profile
          </label>
          <input
            name="linkedinUrl"
            type="url"
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#172965]"
            placeholder="https://www.linkedin.com/in/..."
          />
        </div>

        <div className="sm:col-span-2">
          <label className="block text-xs font-medium text-slate-700">
            Portfolio / GitHub (optional)
          </label>
          <input
            name="portfolioUrl"
            type="url"
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#172965]"
            placeholder="Portfolio, GitHub or website"
          />
        </div>

        <div className="sm:col-span-2">
          <label className="block text-xs font-medium text-slate-700">
            Short note / cover (optional)
          </label>
          <textarea
            name="coverLetter"
            rows={4}
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#172965]"
            placeholder="Context, reasons for exploring, notice period, salary expectations, etc."
          />
        </div>

        <div className="sm:col-span-2">
          <label className="block text-xs font-medium text-slate-700">
            CV / Resume
          </label>
          <input
            name="cv"
            type="file"
            required
            accept=".pdf,.doc,.docx"
            className="mt-1 block w-full text-xs text-slate-600 file:mr-3 file:rounded-full file:border-0 file:bg-[#172965] file:px-4 file:py-1.5 file:text-xs file:font-semibold file:text-white hover:file:bg-[#111c4c]"
          />
          <p className="mt-1 text-[0.7rem] text-slate-400">
            PDF or Word. Max ~5MB.
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between pt-1">
        <p className="text-[0.7rem] text-slate-500">
          One profile, multiple searches. We&apos;ll only share your CV with
          clients when there&apos;s mutual interest.
        </p>
        <button
          type="submit"
          disabled={status === "submitting"}
          className="inline-flex items-center rounded-full bg-[#172965] px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-[#101b47] disabled:cursor-not-allowed disabled:opacity-70"
        >
          {status === "submitting" ? "Submitting…" : "Submit application"}
        </button>
      </div>

      {status === "error" && (
        <div className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">
          {error ??
            "Something went wrong while submitting your application. Please try again."}
        </div>
      )}

      {status === "success" && (
        <div className="mt-2 rounded-lg bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
          Thanks — your profile is in. We&apos;ll be in touch if there&apos;s a
          strong match.
        </div>
      )}
    </form>
  );
}
