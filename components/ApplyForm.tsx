// components/ApplyForm.tsx
"use client";

import { FormEvent, useState } from "react";

type ApplyFormProps = {
  jobTitle: string;
  jobId: string;
};

export default function ApplyForm({ jobTitle, jobId }: ApplyFormProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [location, setLocation] = useState("");
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage(null);
    setIsError(false);

    try {
      const formData = new FormData();
      formData.append("jobId", jobId);
      formData.append("name", name);
      formData.append("email", email);
      if (phone) formData.append("phone", phone);
      if (location) formData.append("location", location);
      formData.append("source", "website");
      if (resumeFile) {
        formData.append("resume", resumeFile);
      }

      const res = await fetch("/api/apply", {
        method: "POST",
        body: formData,
      });

      const data = await res.json().catch(() => null);

      if (!res.ok || !data?.ok) {
        setIsError(true);
        setMessage(
          data?.message ||
            "We couldn’t submit your application. Please try again or email us directly."
        );
      } else {
        setIsError(false);
        setMessage(
          data.message ||
            "Thank you — your application has been received."
        );

        // Reset form
        setName("");
        setEmail("");
        setPhone("");
        setLocation("");
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
      <h2 className="mb-2 text-lg font-semibold text-slate-900">
        Apply for this role
      </h2>
      <p className="mb-4 text-xs text-slate-500">
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
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {/* Name */}
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">
              Full name *
            </label>
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[#172965] focus:ring-2 focus:ring-[#172965]"
              placeholder="Jane Doe"
            />
          </div>

          {/* Email */}
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">
              Email address *
            </label>
            <input
              required
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[#172965] focus:ring-2 focus:ring-[#172965]"
              placeholder="jane@example.com"
            />
          </div>

          {/* Phone */}
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">
              Phone number
            </label>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[#172965] focus:ring-2 focus:ring-[#172965]"
              placeholder="+234..."
            />
          </div>

          {/* Location */}
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">
              Location
            </label>
            <input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[#172965] focus:ring-2 focus:ring-[#172965]"
              placeholder="Lagos, Nigeria"
            />
          </div>
        </div>

        {/* CV Upload */}
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">
            Upload CV / Resume
          </label>
          <input
            type="file"
            accept=".pdf,.doc,.docx,.rtf,.txt"
            onChange={(e) => {
              const file = e.target.files?.[0] || null;
              setResumeFile(file);
            }}
            className="block w-full text-xs text-slate-600 file:mr-3 file:rounded-full file:border-0 file:bg-[#172965] file:px-4 file:py-2 file:text-xs file:font-medium file:text-white hover:file:bg-[#101c44]"
          />
          <p className="mt-1 text-[11px] text-slate-500">
            If the upload fails, you&apos;ll still be able to submit and email
            your CV separately.
          </p>
        </div>

        {/* Button + message */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center justify-center rounded-full bg-[#172965] px-5 py-2.5 text-xs font-medium text-white transition-colors hover:bg-[#101c44] disabled:cursor-not-allowed disabled:opacity-60"
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
