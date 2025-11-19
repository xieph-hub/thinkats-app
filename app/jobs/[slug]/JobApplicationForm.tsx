// app/jobs/[slug]/JobApplicationForm.tsx
"use client";

import { useState, type FormEvent } from "react";

type Props = {
  jobId: string;
  jobTitle: string;
};

export default function JobApplicationForm({
  jobId,
  jobTitle,
}: Props) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [location, setLocation] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [portfolioUrl, setPortfolioUrl] = useState("");
  const [cvUrl, setCvUrl] = useState("");
  const [coverLetter, setCoverLetter] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState<string | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!fullName || !email) {
      setError("Full name and email are required.");
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch(
        `/api/jobs/${encodeURIComponent(
          jobId
        )}/apply`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            fullName,
            email,
            phone,
            location,
            linkedinUrl,
            portfolioUrl,
            cvUrl,
            coverLetter,
            source: "Resourcin website",
          }),
        }
      );

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        setError(
          data?.error ||
            "Could not submit your application. Please try again."
        );
        setIsSubmitting(false);
        return;
      }

      setSuccess(
        "Your application has been submitted. Thank you."
      );
      setIsSubmitting(false);

      // Clear the form
      setFullName("");
      setEmail("");
      setPhone("");
      setLocation("");
      setLinkedinUrl("");
      setPortfolioUrl("");
      setCvUrl("");
      setCoverLetter("");
    } catch (err) {
      console.error("Application submit error:", err);
      setError(
        "Something went wrong. Please try again in a moment."
      );
      setIsSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 text-sm"
    >
      {success && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-800">
          {success}
        </div>
      )}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
          {error}
        </div>
      )}

      <div>
        <label className="block text-xs font-medium text-slate-700">
          Full name
        </label>
        <input
          type="text"
          value={fullName}
          onChange={(e) =>
            setFullName(e.target.value)
          }
          className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-[#172965] focus:outline-none focus:ring-1 focus:ring-[#172965]"
          placeholder="Your full name"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-slate-700">
          Email
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) =>
            setEmail(e.target.value)
          }
          className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-[#172965] focus:outline-none focus:ring-1 focus:ring-[#172965]"
          placeholder="you@example.com"
        />
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <div>
          <label className="block text-xs font-medium text-slate-700">
            Phone (optional)
          </label>
          <input
            type="tel"
            value={phone}
            onChange={(e) =>
              setPhone(e.target.value)
            }
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-[#172965] focus:outline-none focus:ring-1 focus:ring-[#172965]"
            placeholder="+234..."
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-700">
            Location (city, country)
          </label>
          <input
            type="text"
            value={location}
            onChange={(e) =>
              setLocation(e.target.value)
            }
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-[#172965] focus:outline-none focus:ring-1 focus:ring-[#172965]"
            placeholder="Lagos, Nigeria"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-slate-700">
          LinkedIn URL
        </label>
        <input
          type="url"
          value={linkedinUrl}
          onChange={(e) =>
            setLinkedinUrl(e.target.value)
          }
          className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-[#172965] focus:outline-none focus:ring-1 focus:ring-[#172965]"
          placeholder="https://www.linkedin.com/in/..."
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-slate-700">
          Portfolio / GitHub / Website (optional)
        </label>
        <input
          type="url"
          value={portfolioUrl}
          onChange={(e) =>
            setPortfolioUrl(e.target.value)
          }
          className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-[#172965] focus:outline-none focus:ring-1 focus:ring-[#172965]"
          placeholder="https://..."
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-slate-700">
          Link to CV (optional)
        </label>
        <input
          type="url"
          value={cvUrl}
          onChange={(e) => setCvUrl(e.target.value)}
          className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-[#172965] focus:outline-none focus:ring-1 focus:ring-[#172965]"
          placeholder="Google Drive / Dropbox / other link"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-slate-700">
          Short cover message
        </label>
        <textarea
          value={coverLetter}
          onChange={(e) =>
            setCoverLetter(e.target.value)
          }
          rows={4}
          className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-[#172965] focus:outline-none focus:ring-1 focus:ring-[#172965]"
          placeholder={`Briefly tell us why you're a good fit for ${jobTitle}.`}
        />
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="inline-flex w-full items-center justify-center rounded-full bg-[#172965] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#111b4a] disabled:cursor-not-allowed disabled:opacity-70"
      >
        {isSubmitting ? "Submitting..." : "Submit application"}
      </button>
    </form>
  );
}
