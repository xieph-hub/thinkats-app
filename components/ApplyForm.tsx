// components/ApplyForm.tsx
"use client";

import { useState } from "react";

type ApplyFormProps = {
  jobTitle: string;
  jobSlug: string;
};

export default function ApplyForm({ jobTitle, jobSlug }: ApplyFormProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [location, setLocation] = useState("");
  const [resumeUrl, setResumeUrl] = useState("");
  const [resumeFile, setResumeFile] = useState<File | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage(null);
    setIsError(false);

    try {
      const formData = new FormData();

      // Job info
      formData.append("jobSlug", jobSlug);
      formData.append("jobTitle", jobTitle);

      // Candidate info
      formData.append("name", name);
      formData.append("email", email);
      if (phone) formData.append("phone", phone);
      if (location) formData.append("location", location);

      // Source
      formData.append("source", "website");

      // Resume: file takes priority; fallback to URL
      if (resumeFile) {
        formData.append("resume", resumeFile);
      } else if (resumeUrl) {
        formData.append("resumeUrl", resumeUrl);
      }

      const res = await fetch("/api/apply", {
        method: "POST",
        body: formData, // browser sets multipart/form-data with boundary
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok || !data.success) {
        setIsError(true);
        setMessage(
          data?.error ||
            "We couldn’t submit your application. Please try again or email us directly."
        );
      } else {
        setIsError(false);
        setMessage("Thank you — your application has been received.");

        // Reset form
        setName("");
        setEmail("");
        setPhone("");
        setLocation("");
        setResumeUrl("");
        setResumeFile(null);
      }
    } catch (error) {
      console.error(error);
      setIsError(true);
      setMessage(
        "Something went wrong while submitting your application. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="mt-10 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-900 mb-2">
        Apply for this role
      </h2>
      <p className="text-xs text-slate-500 mb-4">
        Submit your details and we&apos;ll review your application. You can also
        email{" "}
        <a
          href={`mailto:hello@resourcin.com?subject=${encodeURIComponent(
            `Application: ${jobTitle}`
          )}`}
          className="text-[#172965] underline"
        >
          hello@resourcin.com
        </a>{" "}
        if you prefer.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Name */}
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              Full name *
            </label>
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#172965] focus:border-[#172965]"
              placeholder="Jane Doe"
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              Email address *
            </label>
            <input
              required
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#172965] focus:border-[#172965]"
              placeholder="jane@example.com"
            />
          </div>

          {/* Phone */}
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              Phone number
            </label>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#172965] focus:border-[#172965]"
              placeholder="+234..."
            />
          </div>

          {/* Location */}
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              Location
            </label>
            <input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#172965] focus:border-[#172965]"
              placeholder="Lagos, Nigeria"
            />
          </div>
        </div>

        {/* Resume File */}
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">
            CV / Resume file
          </label>
          <input
            type="file"
            accept=".pdf,.doc,.docx"
            onChange={(e) => {
              const file = e.target.files?.[0] || null;
              setResumeFile(file);
            }}
            className="w-full text-sm text-slate-700"
          />
          <p className="mt-1 text-[11px] text-slate-500">
            You can upload a file here, or paste a link below instead.
          </p>
        </div>

        {/* Resume URL (optional) */}
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">
            CV / Resume URL (optional)
          </label>
          <input
            value={resumeUrl}
            onChange={(e) => setResumeUrl(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#172965] focus:border-[#172965]"
            placeholder="Link to your CV (Google Drive, Dropbox, etc.)"
          />
          <p className="mt-1 text-[11px] text-slate-500">
            If you don&apos;t upload a file, we&apos;ll use this link instead.
            Please make sure it&apos;s accessible.
          </p>
        </div>

        {/* Button + message */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center justify-center rounded-full bg-[#172965] px-5 py-2.5 text-xs font-medium text-white hover:bg-[#101c44] disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
          >
            {isSubmitting ? "Submitting..." : "Submit application"}
          </button>

          {message && (
            <p
              className={`text-xs ${
                isError ? "text-red-600" : "text-emerald-600"
              }`}
            >
              {message}
            </p>
          )}
        </div>
      </form>
    </section>
  );
}
