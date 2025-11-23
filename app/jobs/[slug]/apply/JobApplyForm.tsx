// app/jobs/[slug]/apply/JobApplyForm.tsx
"use client";

import { useState } from "react";

type JobApplyFormProps = {
  slug: string;
  jobTitle: string;
};

export default function JobApplyForm({
  slug,
  jobTitle,
}: JobApplyFormProps) {
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(
    null
  );
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
      // 1) Upload CV file first (if provided)
      let uploadedCvUrl: string | null = null;
      const cvFile = formData.get("cv") as File | null;
      const emailValue = formData.get("email");
      const email =
        typeof emailValue === "string" && emailValue.trim().length > 0
          ? emailValue.trim()
          : null;

      if (cvFile && cvFile.size > 0) {
        const uploadForm = new FormData();
        uploadForm.append("cv", cvFile);
        if (email) uploadForm.append("email", email);

        const uploadRes = await fetch("/api/upload-cv", {
          method: "POST",
          body: uploadForm,
        });

        let uploadData: any = null;
        try {
          uploadData = await uploadRes.json();
        } catch {
          uploadData = null;
        }

        if (!uploadRes.ok || uploadData?.error) {
          console.error("CV upload failed", uploadData?.error);
          // We don't block the application if upload fails;
          // candidate can still submit with a manual CV link.
        } else if (typeof uploadData.url === "string") {
          uploadedCvUrl = uploadData.url;
        }
      }

      // 2) Build JSON payload for application API
      const getString = (key: string): string | undefined => {
        const value = formData.get(key);
        if (typeof value !== "string") return undefined;
        const trimmed = value.trim();
        return trimmed.length > 0 ? trimmed : undefined;
      };

      const payload: any = {
        fullName: getString("fullName"),
        email: getString("email"),
        phone: getString("phone"),
        location: getString("location"),
        linkedinUrl: getString("linkedinUrl"),
        portfolioUrl: getString("portfolioUrl"),
        coverLetter: getString("coverLetter"),
        source: "Website",
      };

      // Prefer uploaded CV URL from Supabase, fall back to manual link field
      const manualCvUrl = getString("cvUrl");
      if (uploadedCvUrl) {
        payload.cvUrl = uploadedCvUrl;
      } else if (manualCvUrl) {
        payload.cvUrl = manualCvUrl;
      }

      if (!payload.fullName || !payload.email) {
        throw new Error("Full name and email are required.");
      }

      // 3) Call your existing jobs apply API
      const res = await fetch(
        `/api/jobs/${encodeURIComponent(slug)}/apply`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      );

      let data: any = null;
      try {
        data = await res.json();
      } catch {
        data = null;
      }

      if (!res.ok || data?.error) {
        setErrorMessage(
          data?.error ||
            "Unexpected error while submitting application."
        );
      } else {
        setSuccessMessage(
          "Thank you for your interest in the role. Your application has been received. We'll be in touch if there's a strong match."
        );
        form.reset();

        // 🔼 Scroll back to the top of the form so the message is visible
        if (typeof window !== "undefined") {
          const rect = form.getBoundingClientRect();
          const top = rect.top + window.scrollY - 80; // small offset
          window.scrollTo({ top, behavior: "smooth" });
        }
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
      {/* Messages at the top */}
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

      {/* Basic intro (optional) */}
      <p className="text-xs text-slate-600">
        Apply for <span className="font-semibold">{jobTitle}</span>.
        Share a few details and your CV.
      </p>

      {/* Full name + email */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-xs font-medium text-slate-700">
            Full name *
          </label>
          <input
            name="fullName"
            type="text"
            required
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-[#172965] focus:outline-none focus:ring-1 focus:ring-[#172965]"
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
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-[#172965] focus:outline-none focus:ring-1 focus:ring-[#172965]"
          />
        </div>
      </div>

      {/* Phone + location */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-xs font-medium text-slate-700">
            Phone / WhatsApp (with country code)
          </label>
          <input
            name="phone"
            type="text"
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-[#172965] focus:outline-none focus:ring-1 focus:ring-[#172965]"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-700">
            Current location (City, Country)
          </label>
          <input
            name="location"
            type="text"
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-[#172965] focus:outline-none focus:ring-1 focus:ring-[#172965]"
          />
        </div>
      </div>

      {/* LinkedIn + portfolio */}
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

      {/* CV upload */}
      <div>
        <label className="block text-xs font-medium text-slate-700">
          Upload CV / Resume (PDF or DOC/DOCX)
        </label>
        <input
          name="cv"
          type="file"
          accept=".pdf,.doc,.docx,.rtf"
          className="mt-1 block w-full text-xs text-slate-700 file:mr-3 file:rounded-full file:border-0 file:bg-[#172965] file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-white hover:file:bg-[#111c4c]"
        />
        <p className="mt-1 text-[0.7rem] text-slate-500">
          You can also paste a link below if that&apos;s easier.
        </p>
      </div>

      {/* CV link fallback */}
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

      {/* Cover letter / note */}
      <div>
        <label className="block text-xs font-medium text-slate-700">
          Short note / cover letter
        </label>
        <textarea
          name="coverLetter"
          rows={4}
          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-[#172965] focus:outline-none focus:ring-1 focus:ring-[#172965]"
          placeholder="Give quick context on your experience and interest in this role."
        />
      </div>

      <p className="text-[0.7rem] text-slate-500">
        By submitting, you agree that we can store your details and reach out
        when we see a strong match. We won&apos;t spam you or sell your data.
      </p>

      <div className="flex items-center justify-between gap-3 pt-1">
        <button
          type="submit"
          disabled={submitting}
          className="inline-flex items-center justify-center rounded-full bg-[#172965] px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#111c4c] disabled:cursor-not-allowed disabled:opacity-70"
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
