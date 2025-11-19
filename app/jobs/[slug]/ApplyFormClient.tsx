// app/jobs/[slug]/ApplyFormClient.tsx
"use client";

import { useState } from "react";

type Props = {
  jobId: string;
  jobTitle: string;
};

type FormState = {
  full_name: string;
  email: string;
  phone: string;
  location: string;
  linkedin_url: string;
  portfolio_url: string;
  cover_letter: string;
};

export default function ApplyFormClient({ jobId, jobTitle }: Props) {
  const [form, setForm] = useState<FormState>({
    full_name: "",
    email: "",
    phone: "",
    location: "",
    linkedin_url: "",
    portfolio_url: "",
    cover_letter: "",
  });

  const [status, setStatus] = useState<
    "idle" | "submitting" | "success" | "error"
  >("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.full_name || !form.email) {
      setErrorMessage("Please provide at least your name and email.");
      return;
    }

    setStatus("submitting");
    setErrorMessage(null);

    try {
      const res = await fetch(
        `/api/jobs/${encodeURIComponent(jobId)}/apply`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ...form,
            source: "Resourcin job board",
          }),
        }
      );

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setErrorMessage(
          data?.error ||
            "Something went wrong while submitting your application. Please try again."
        );
        setStatus("error");
        return;
      }

      setStatus("success");
      // Simple reset of form after success
      setForm({
        full_name: "",
        email: "",
        phone: "",
        location: "",
        linkedin_url: "",
        portfolio_url: "",
        cover_letter: "",
      });
    } catch (err) {
      console.error("Error submitting application", err);
      setErrorMessage("Network error. Please try again.");
      setStatus("error");
    }
  };

  const isSubmitting = status === "submitting";

  return (
    <section className="mt-8 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-900">
        Apply for {jobTitle}
      </h2>
      <p className="mt-1 text-sm text-slate-600">
        Share a few details and we&apos;ll review your application for this
        role.
      </p>

      <form onSubmit={handleSubmit} className="mt-4 space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-medium text-slate-700">
              Full name *
            </label>
            <input
              type="text"
              name="full_name"
              value={form.full_name}
              onChange={handleChange}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-[#172965] focus:outline-none focus:ring-1 focus:ring-[#172965]"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700">
              Email *
            </label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-[#172965] focus:outline-none focus:ring-1 focus:ring-[#172965]"
              required
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-medium text-slate-700">
              Phone
            </label>
            <input
              type="text"
              name="phone"
              value={form.phone}
              onChange={handleChange}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-[#172965] focus:outline-none focus:ring-1 focus:ring-[#172965]"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700">
              Location
            </label>
            <input
              type="text"
              name="location"
              value={form.location}
              onChange={handleChange}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-[#172965] focus:outline-none focus:ring-1 focus:ring-[#172965]"
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-medium text-slate-700">
              LinkedIn URL
            </label>
            <input
              type="url"
              name="linkedin_url"
              value={form.linkedin_url}
              onChange={handleChange}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-[#172965] focus:outline-none focus:ring-1 focus:ring-[#172965]"
              placeholder="https://www.linkedin.com/in/..."
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700">
              Portfolio / website
            </label>
            <input
              type="url"
              name="portfolio_url"
              value={form.portfolio_url}
              onChange={handleChange}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-[#172965] focus:outline-none focus:ring-1 focus:ring-[#172965]"
              placeholder="https://"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-700">
            Cover letter / brief note
          </label>
          <textarea
            name="cover_letter"
            value={form.cover_letter}
            onChange={handleChange}
            rows={4}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-[#172965] focus:outline-none focus:ring-1 focus:ring-[#172965]"
            placeholder="Tell us briefly why you’re a good fit for this role."
          />
        </div>

        {errorMessage && (
          <p className="text-xs text-red-600">{errorMessage}</p>
        )}

        {status === "success" && (
          <p className="text-xs text-emerald-600">
            Thank you. Your application has been received.
          </p>
        )}

        <div className="pt-2">
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center rounded-full bg-[#172965] px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#111b4a] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? "Submitting..." : "Submit application"}
          </button>
        </div>
      </form>
    </section>
  );
}
