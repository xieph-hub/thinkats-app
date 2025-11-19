// components/EmployerLeadForm.tsx
"use client";

import { useState } from "react";

type FormState = {
  name: string;
  company: string;
  email: string;
  role: string;
  message: string;
};

export default function EmployerLeadForm() {
  const [form, setForm] = useState<FormState>({
    name: "",
    company: "",
    email: "",
    role: "",
    message: "",
  });

  const [status, setStatus] = useState<
    "idle" | "submitting" | "success" | "error"
  >("idle");

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // For now, just fake-submit and show a success message.
    // Later we can wire this to an API route or external tool (e.g. Resend, Notion, CRM).
    setStatus("submitting");

    try {
      // Simulate a request delay
      await new Promise((resolve) => setTimeout(resolve, 800));
      setStatus("success");
    } catch (error) {
      console.error("Error submitting employer lead", error);
      setStatus("error");
    }
  };

  const isSubmitting = status === "submitting";

  return (
    <form onSubmit={handleSubmit} className="mt-6 space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-xs font-medium text-slate-700">
            Your name *
          </label>
          <input
            type="text"
            name="name"
            required
            value={form.name}
            onChange={handleChange}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-[#172965] focus:outline-none focus:ring-1 focus:ring-[#172965]"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-700">
            Company *
          </label>
          <input
            type="text"
            name="company"
            required
            value={form.company}
            onChange={handleChange}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-[#172965] focus:outline-none focus:ring-1 focus:ring-[#172965]"
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-xs font-medium text-slate-700">
            Work email *
          </label>
          <input
            type="email"
            name="email"
            required
            value={form.email}
            onChange={handleChange}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-[#172965] focus:outline-none focus:ring-1 focus:ring-[#172965]"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-700">
            Your role
          </label>
          <input
            type="text"
            name="role"
            value={form.role}
            onChange={handleChange}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-[#172965] focus:outline-none focus:ring-1 focus:ring-[#172965]"
            placeholder="Founder, HR Lead, Hiring Manager..."
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-slate-700">
          What do you need help hiring for? *
        </label>
        <textarea
          name="message"
          required
          value={form.message}
          onChange={handleChange}
          rows={4}
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-[#172965] focus:outline-none focus:ring-1 focus:ring-[#172965]"
          placeholder="Share a few lines about the roles, seniority, timelines, and what ‘great’ looks like..."
        />
      </div>

      {status === "success" && (
        <p className="text-xs text-emerald-600">
          Thank you. We&apos;ve received your request and will follow up
          shortly.
        </p>
      )}

      {status === "error" && (
        <p className="text-xs text-red-600">
          Something went wrong. Please try again, or email us directly.
        </p>
      )}

      <div className="pt-2">
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex items-center rounded-full bg-[#172965] px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#111b4a] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? "Sending..." : "Request hiring support"}
        </button>
      </div>
    </form>
  );
}
