"use client";

import { FormEvent, useState } from "react";
import { useSearchParams } from "next/navigation";

export type JobApplyFormProps = {
  jobId?: string;
  jobTitle?: string;
};

export default function JobApplyForm({
  jobId: jobIdFromProps,
  jobTitle: jobTitleFromProps,
}: JobApplyFormProps) {
  const searchParams = useSearchParams();

  // Job context (from props or URL ?job=slug)
  const jobId = jobIdFromProps ?? searchParams.get("job") ?? undefined;
  const jobTitle = jobTitleFromProps ?? searchParams.get("jobTitle") ?? undefined;

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const formData = new FormData(e.currentTarget);

    const fullName = String(formData.get("fullName") ?? "").trim();
    const email = String(formData.get("email") ?? "").trim();
    const phone = String(formData.get("phone") ?? "").trim();
    const location = String(formData.get("location") ?? "").trim();
    const linkedinUrl = String(formData.get("linkedinUrl") ?? "").trim();
    const portfolioUrl = String(formData.get("portfolioUrl") ?? "").trim();
    const coverLetter = String(formData.get("coverLetter") ?? "").trim();
    const cvFile = formData.get("cv") as File | null; // 👈 name="cv" must match input

    if (!fullName || !email) {
      setError("Please add at least your name and email.");
      return;
    }

    setIsSubmitting(true);

    try {
      let cvUrl: string | undefined;

      // 1) Upload CV to Supabase (if present)
      if (cvFile && cvFile.size > 0) {
        const uploadForm = new FormData();
        uploadForm.append("cv", cvFile);    // 👈 field name expected by /api/upload-cv
        uploadForm.append("email", email);  // used to build a nice path

        const uploadRes = await fetch("/api/upload-cv", {
          method: "POST",
          body: uploadForm,
        });

        if (!uploadRes.ok) {
          console.error("Upload failed:", await uploadRes.text());
          throw new Error("CV_UPLOAD_FAILED");
        }

        const uploadJson = await uploadRes.json();
        cvUrl = uploadJson.url as string | undefined;
      }

      // 2) Submit application payload to /api/apply
      const applyRes = await fetch("/api/apply", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          jobId,        // may be undefined for general talent network
          jobTitle,     // optional, for context
          fullName,
          email,
          phone: phone || null,
          location: location || null,
          linkedinUrl: linkedinUrl || null,
          portfolioUrl: portfolioUrl || null,
          source: "Resourcin website",
          coverLetter,
          cvUrl,        // signed/public URL from Supabase (or undefined)
        }),
      });

      if (!applyRes.ok) {
        console.error("Apply failed:", await applyRes.text());
        throw new Error("APPLY_FAILED");
      }

      setSuccess(
        "Thanks — your profile is in. We'll be in touch if there's a strong match."
      );
      e.currentTarget.reset();
    } catch (err: any) {
      console.error("Apply flow error:", err);

      if (err?.message === "CV_UPLOAD_FAILED") {
        setError(
          "Could not upload CV. Please try again in a moment, or email it directly if this persists."
        );
      } else {
        setError(
          "Something went wrong while submitting your application. Please try again in a moment."
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Context line (optional) */}
      {jobTitle && (
        <p className="text-xs text-slate-500">
          You&apos;re expressing interest in:{" "}
          <span className="font-medium text-slate-900">{jobTitle}</span>
        </p>
      )}

      {error && (
        <div className="rounded-md bg-red-50 px-3 py-2 text-xs text-red-700">
          {error}
        </div>
      )}

      {success && (
        <div className="rounded-md bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
          {success}
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <label className="block text-xs font-medium text-slate-700">
            Full name
          </label>
          <input
            name="fullName"
            type="text"
            required
            className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:border-[#172965] focus:outline-none focus:ring-1 focus:ring-[#172965]"
          />
        </div>

        <div className="space-y-1">
          <label className="block text-xs font-medium text-slate-700">
            Email
          </label>
          <input
            name="email"
            type="email"
            required
            className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:border-[#172965] focus:outline-none focus:ring-1 focus:ring-[#172965]"
          />
        </div>

        <div className="space-y-1">
          <label className="block text-xs font-medium text-slate-700">
            Phone (optional)
          </label>
          <input
            name="phone"
            type="tel"
            className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:border-[#172965] focus:outline-none focus:ring-1 focus:ring-[#172965]"
          />
        </div>

        <div className="space-y-1">
          <label className="block text-xs font-medium text-slate-700">
            Location (city, country)
          </label>
          <input
            name="location"
            type="text"
            className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:border-[#172965] focus:outline-none focus:ring-1 focus:ring-[#172965]"
          />
        </div>

        <div className="space-y-1">
          <label className="block text-xs font-medium text-slate-700">
            LinkedIn URL
          </label>
          <input
            name="linkedinUrl"
            type="url"
            placeholder="https://www.linkedin.com/in/..."
            className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:border-[#172965] focus:outline-none focus:ring-1 focus:ring-[#172965]"
          />
        </div>

        <div className="space-y-1">
          <label className="block text-xs font-medium text-slate-700">
            Portfolio / GitHub / Personal site (optional)
          </label>
          <input
            name="portfolioUrl"
            type="url"
            placeholder="https://..."
            className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:border-[#172965] focus:outline-none focus:ring-1 focus:ring-[#172965]"
          />
        </div>
      </div>

      <div className="space-y-1">
        <label className="block text-xs font-medium text-slate-700">
          CV / Resume
        </label>
        <input
          name="cv"
          type="file"
          accept=".pdf,.doc,.docx"
          className="block w-full text-xs text-slate-600 file:mr-3 file:rounded-md file:border-0 file:bg-[#172965] file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-white hover:file:bg-[#111c4c]"
        />
        <p className="mt-1 text-[0.7rem] text-slate-500">
          PDF or DOC, up to ~5MB.
        </p>
      </div>

      <div className="space-y-1">
        <label className="block text-xs font-medium text-slate-700">
          Anything you&apos;d like us to know? (optional)
        </label>
        <textarea
          name="coverLetter"
          rows={4}
          className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:border-[#172965] focus:outline-none focus:ring-1 focus:ring-[#172965]"
        />
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="inline-flex w-full items-center justify-center rounded-lg bg-[#172965] px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-[#111c4c] disabled:cursor-not-allowed disabled:bg-slate-400"
      >
        {isSubmitting ? "Submitting..." : "Submit profile"}
      </button>

      <p className="text-[0.7rem] text-slate-500">
        We&apos;ll only reach out when there&apos;s a strong match on skills,
        level and preferences. No spam.
      </p>
    </form>
  );
}
