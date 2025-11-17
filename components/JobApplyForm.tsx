"use client";

import { FormEvent, useState } from "react";

type Status = "idle" | "submitting" | "success" | "error";

type JobApplyFormProps = {
  jobId: string;
};

export default function JobApplyForm({ jobId }: JobApplyFormProps) {
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("submitting");
    setError(null);

    const form = e.currentTarget;
    const formData = new FormData(form);

    // Make sure the API knows which job this is for
    formData.set("jobId", jobId);

    try {
      const res = await fetch("/api/apply", {
        method: "POST",
        body: formData, // important: no manual Content-Type header
      });

      if (!res.ok) {
        let message = "Failed to submit application.";
        try {
          const data = await res.json();
          if (data?.error) message = data.error;
        } catch {
          // ignore JSON parse errors
        }
        throw new Error(message);
      }

      form.reset();
      setStatus("success");
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "Something went wrong. Please try again.");
      setStatus("error");
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 sm:p-5"
    >
      <h2 className="text-sm font-semibold text-slate-900">
        I&apos;m interested in this role
      </h2>
      <p className="text-xs text-slate-500">
        Share a few details and your CV. If there&apos;s a fit, we&apos;ll
        reach out with next steps.
      </p>

      {/* Full name */}
      <div>
        <label className="block text-xs font-medium text-slate-700">
          Full name
        </label>
        <input
          name="fullName"
          type="text"
          required
          className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none focus:border-[#172965]"
          placeholder="Jane Doe"
        />
      </div>

      {/* Email */}
      <div>
        <label className="block text-xs font-medium text-slate-700">
          Email
        </label>
        <input
          name="email"
          type="email"
          required
          className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none focus:border-[#172965]"
          placeholder="you@example.com"
        />
      </div>

      {/* Phone + Location */}
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="block text-xs font-medium text-slate-700">
            Phone / WhatsApp
          </label>
          <input
            name="phone"
            type="tel"
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none focus:border-[#172965]"
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
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none focus:border-[#172965]"
            placeholder="Lagos, remote, etc."
          />
        </div>
      </div>

      {/* Links */}
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="block text-xs font-medium text-slate-700">
            LinkedIn URL
          </label>
          <input
            name="linkedinUrl"
            type="url"
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none focus:border-[#172965]"
            placeholder="https://www.linkedin.com/in/..."
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-700">
            Portfolio / GitHub (optional)
          </label>
          <input
            name="portfolioUrl"
            type="url"
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none focus:border-[#172965]"
            placeholder="https://..."
          />
        </div>
      </div>

      {/* CV upload */}
      <div>
        <label className="block text-xs font-medium text-slate-700">
          CV / Resume (PDF or DOC)
        </label>
        <input
          name="cv"
          type="file"
          required
          accept=".pdf,.doc,.docx"
          className="mt-1 block w-full text-xs text-slate-600 file:mr-3 file:rounded-full file:border-0 file:bg-[#172965] file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-white hover:file:bg-[#101b47]"
        />
        <p className="mt-1 text-[0.7rem] text-slate-400">
          We&apos;ll never share your CV without your consent.
        </p>
      </div>

      {/* Cover letter */}
      <div>
        <label className="block text-xs font-medium text-slate-700">
          Brief note (optional)
        </label>
        <textarea
          name="coverLetter"
          rows={3}
          className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none focus:border-[#172965]"
          placeholder="Share a quick context about your experience and what you're looking for."
        />
      </div>

      {/* Hidden source field */}
      <input type="hidden" name="source" value="Job detail page" />
      {/* jobId is injected into FormData in handleSubmit */}

      {/* Footer */}
      <div className="flex items-center justify-between gap-3 pt-1">
        <p className="text-[0.7rem] text-slate-500">
          We try to respond to strong fits within a few working days.
        </p>
        <button
          type="submit"
          disabled={status === "submitting"}
          className="inline-flex items-center rounded-full bg-[#172965] px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-[#101b47] disabled:cursor-not-allowed disabled:opacity-70"
        >
          {status === "submitting" ? "Sending..." : "Submit application"}
        </button>
      </div>

      {status === "success" && (
        <div className="rounded-lg bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
          Thanks — your profile is in. We&apos;ll be in touch if there&apos;s a
          strong match.
        </div>
      )}

      {status === "error" && (
        <div className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">
          {error ?? "Something went wrong. Please try again."}
        </div>
      )}
    </form>
  );
}
