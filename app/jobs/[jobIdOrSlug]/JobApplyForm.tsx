// app/jobs/[jobIdOrSlug]/JobApplyForm.tsx
"use client";

import { useState } from "react";

type Props = {
  jobId: string;
};

export default function JobApplyForm({ jobId }: Props) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsSubmitting(true);

    try {
      const form = e.currentTarget;
      const formData = new FormData(form);

      // Ensure jobId is sent to the API
      formData.set("jobId", jobId);

      const res = await fetch("/api/jobs/apply", {
        method: "POST",
        body: formData,
      });

      let data: any = null;
      try {
        data = await res.json();
      } catch {
        // ignore if not JSON, we'll just use generic messaging
      }

      if (!res.ok || data?.success === false || data?.error) {
        const msg =
          data?.error ||
          data?.message ||
          "Could not submit your application. Please try again in a moment.";
        setErrorMessage(msg);
        return;
      }

      // ✅ Success – reset form + show confirmation
      form.reset();
      setSuccessMessage(
        data?.message || "Thank you. Your application has been received."
      );
    } catch (err) {
      console.error("JobApplyForm submit error", err);
      setErrorMessage(
        "Something went wrong while submitting. Please try again in a moment."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-3">
      <form onSubmit={handleSubmit} className="space-y-3">
        {/* Name + Email */}
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label
              htmlFor="fullName"
              className="block text-xs font-medium text-slate-700"
            >
              Full name *
            </label>
            <input
              id="fullName"
              name="fullName"
              type="text"
              required
              className="block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 shadow-sm outline-none ring-0 placeholder:text-slate-400 focus:border-slate-900 focus:ring-1 focus:ring-slate-900"
              placeholder="Jane Doe"
            />
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="email"
              className="block text-xs font-medium text-slate-700"
            >
              Email *
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              className="block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 shadow-sm outline-none ring-0 placeholder:text-slate-400 focus:border-slate-900 focus:ring-1 focus:ring-slate-900"
              placeholder="you@example.com"
            />
          </div>
        </div>

        {/* Phone + Location */}
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label
              htmlFor="phone"
              className="block text-xs font-medium text-slate-700"
            >
              Phone
            </label>
            <input
              id="phone"
              name="phone"
              type="tel"
              className="block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 shadow-sm outline-none ring-0 placeholder:text-slate-400 focus:border-slate-900 focus:ring-1 focus:ring-slate-900"
              placeholder="+234..."
            />
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="location"
              className="block text-xs font-medium text-slate-700"
            >
              Location (city, country)
            </label>
            <input
              id="location"
              name="location"
              type="text"
              className="block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 shadow-sm outline-none ring-0 placeholder:text-slate-400 focus:border-slate-900 focus:ring-1 focus:ring-slate-900"
              placeholder="Lagos, Nigeria"
            />
          </div>
        </div>

        {/* Links */}
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label
              htmlFor="linkedinUrl"
              className="block text-xs font-medium text-slate-700"
            >
              LinkedIn
            </label>
            <input
              id="linkedinUrl"
              name="linkedinUrl"
              type="url"
              className="block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 shadow-sm outline-none ring-0 placeholder:text-slate-400 focus:border-slate-900 focus:ring-1 focus:ring-slate-900"
              placeholder="https://www.linkedin.com/in/..."
            />
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="githubUrl"
              className="block text-xs font-medium text-slate-700"
            >
              GitHub / Portfolio
            </label>
            <input
              id="githubUrl"
              name="githubUrl"
              type="url"
              className="block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 shadow-sm outline-none ring-0 placeholder:text-slate-400 focus:border-slate-900 focus:ring-1 focus:ring-slate-900"
              placeholder="https://github.com/... or portfolio link"
            />
          </div>
        </div>

        {/* Comp + notice period */}
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="space-y-1.5">
            <label
              htmlFor="currentGrossAnnual"
              className="block text-xs font-medium text-slate-700"
            >
              Current gross annual (currency + amount)
            </label>
            <input
              id="currentGrossAnnual"
              name="currentGrossAnnual"
              type="text"
              className="block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 shadow-sm outline-none ring-0 placeholder:text-slate-400 focus:border-slate-900 focus:ring-1 focus:ring-slate-900"
              placeholder="e.g. NGN 18,000,000"
            />
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="grossAnnualExpectation"
              className="block text-xs font-medium text-slate-700"
            >
              Expected gross annual
            </label>
            <input
              id="grossAnnualExpectation"
              name="grossAnnualExpectation"
              type="text"
              className="block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 shadow-sm outline-none ring-0 placeholder:text-slate-400 focus:border-slate-900 focus:ring-1 focus:ring-slate-900"
              placeholder="e.g. NGN 22,000,000"
            />
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="noticePeriod"
              className="block text-xs font-medium text-slate-700"
            >
              Notice period
            </label>
            <input
              id="noticePeriod"
              name="noticePeriod"
              type="text"
              className="block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 shadow-sm outline-none ring-0 placeholder:text-slate-400 focus:border-slate-900 focus:ring-1 focus:ring-slate-900"
              placeholder="e.g. 4 weeks"
            />
          </div>
        </div>

        {/* How they heard + source */}
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label
              htmlFor="howHeard"
              className="block text-xs font-medium text-slate-700"
            >
              How did you hear about this role?
            </label>
            <input
              id="howHeard"
              name="howHeard"
              type="text"
              className="block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 shadow-sm outline-none ring-0 placeholder:text-slate-400 focus:border-slate-900 focus:ring-1 focus:ring-slate-900"
              placeholder="Resourcin site, LinkedIn, referral, etc."
            />
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="source"
              className="block text-xs font-medium text-slate-700"
            >
              Source (internal)
            </label>
            <input
              id="source"
              name="source"
              type="text"
              className="block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 shadow-sm outline-none ring-0 placeholder:text-slate-400 focus:border-slate-900 focus:ring-1 focus:ring-slate-900"
              placeholder="(Your tracking, optional)"
            />
          </div>
        </div>

        {/* CV upload */}
        <div className="space-y-1.5">
          <label
            htmlFor="cv"
            className="block text-xs font-medium text-slate-700"
          >
            CV / Resume (PDF or DOCX)
          </label>
          <input
            id="cv"
            name="cv"
            type="file"
            accept=".pdf,.doc,.docx"
            className="block w-full cursor-pointer rounded-md border border-dashed border-slate-300 bg-slate-50 px-3 py-2 text-xs text-slate-700 file:mr-3 file:cursor-pointer file:rounded file:border-0 file:bg-slate-900 file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-white hover:border-slate-400"
          />
          <p className="text-[11px] text-slate-500">
            If the upload fails, you can email your CV manually and we’ll attach
            it to your profile from our end.
          </p>
        </div>

        {/* Cover letter */}
        <div className="space-y-1.5">
          <label
            htmlFor="coverLetter"
            className="block text-xs font-medium text-slate-700"
          >
            Short note or cover letter
          </label>
          <textarea
            id="coverLetter"
            name="coverLetter"
            rows={4}
            className="block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-xs leading-relaxed text-slate-900 shadow-sm outline-none ring-0 placeholder:text-slate-400 focus:border-slate-900 focus:ring-1 focus:ring-slate-900"
            placeholder="A short context on why you might be a strong fit..."
          />
        </div>

        {/* Messages + submit button */}
        <div className="flex flex-col gap-2 pt-1">
          {errorMessage && (
            <div className="rounded-md bg-red-50 px-3 py-2 text-[11px] text-red-700">
              {errorMessage}
            </div>
          )}

          {successMessage && (
            <div className="rounded-md bg-emerald-50 px-3 py-2 text-[11px] text-emerald-800">
              {successMessage}
            </div>
          )}

          <div className="flex items-center justify-end">
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center rounded-md bg-[#0B1320] px-3 py-1.5 text-xs font-medium text-white shadow-sm transition hover:bg-[#111827] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSubmitting ? "Submitting..." : "Submit application"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
