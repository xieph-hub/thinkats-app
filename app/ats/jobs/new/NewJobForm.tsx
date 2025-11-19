// app/ats/jobs/new/NewJobForm.tsx
"use client";

import {
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";
import { useRouter } from "next/navigation";

interface NewJobFormProps {
  tenantId: string;
}

type FormState = {
  title: string;
  department: string;
  location: string;
  employment_type: string;
  seniority: string;
  description: string;
};

export default function NewJobForm({ tenantId }: NewJobFormProps) {
  const router = useRouter();

  const [form, setForm] = useState<FormState>({
    title: "",
    department: "",
    location: "",
    employment_type: "",
    seniority: "",
    description: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (
    e: ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    if (!form.title.trim()) {
      setError("Job title is required.");
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch("/api/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          tenant_id: tenantId,
        }),
      });

      let data: any = null;
      try {
        data = await res.json();
      } catch {
        // ignore JSON parse error, we will handle with generic error
      }

      if (!res.ok) {
        const message =
          data?.error || "Failed to create job. Please try again.";
        setError(message);
        setIsSubmitting(false);
        return;
      }

      const jobId = data?.job?.id;
      if (jobId) {
        router.push(`/ats/jobs/${jobId}`);
      } else {
        router.push("/ats");
      }
    } catch (err) {
      console.error("Error creating job:", err);
      setError("Something went wrong. Please try again.");
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    router.push("/ats");
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
    >
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
          {error}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="block text-xs font-medium text-slate-700">
            Job title <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="title"
            value={form.title}
            onChange={handleChange}
            required
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-[#172965] focus:outline-none focus:ring-1 focus:ring-[#172965]"
            placeholder="e.g. Senior Product Manager"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-700">
            Department
          </label>
          <input
            type="text"
            name="department"
            value={form.department}
            onChange={handleChange}
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-[#172965] focus:outline-none focus:ring-1 focus:ring-[#172965]"
            placeholder="e.g. Product, Engineering, Commercial"
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
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-[#172965] focus:outline-none focus:ring-1 focus:ring-[#172965]"
            placeholder="e.g. Lagos (Hybrid), Remote – Africa"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-700">
            Employment type
          </label>
          <select
            name="employment_type"
            value={form.employment_type}
            onChange={handleChange}
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-[#172965] focus:outline-none focus:ring-1 focus:ring-[#172965]"
          >
            <option value="">Select type</option>
            <option value="full_time">Full-time</option>
            <option value="part_time">Part-time</option>
            <option value="contract">Contract</option>
            <option value="internship">Internship</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-700">
            Seniority
          </label>
          <select
            name="seniority"
            value={form.seniority}
            onChange={handleChange}
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-[#172965] focus:outline-none focus:ring-1 focus:ring-[#172965]"
          >
            <option value="">Select level</option>
            <option value="entry">Entry / Junior</option>
            <option value="mid">Mid-level</option>
            <option value="senior">Senior</option>
            <option value="lead">Lead / Manager</option>
            <option value="executive">Executive / C-level</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-slate-700">
          Description
        </label>
        <textarea
          name="description"
          value={form.description}
          onChange={handleChange}
          rows={6}
          className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-[#172965] focus:outline-none focus:ring-1 focus:ring-[#172965]"
          placeholder="Add a clear role overview, responsibilities, and requirements."
        />
      </div>

      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={handleCancel}
          className="text-sm text-slate-600 hover:text-slate-900"
        >
          Cancel
        </button>

        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex items-center rounded-full bg-[#172965] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#111b4a] disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isSubmitting ? "Creating job..." : "Create job"}
        </button>
      </div>
    </form>
  );
}
