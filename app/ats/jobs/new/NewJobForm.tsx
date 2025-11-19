// app/ats/jobs/new/NewJobForm.tsx
"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";

export default function NewJobForm() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setApiError(null);
    setIsSubmitting(true);

    try {
      const form = e.currentTarget;
      const formData = new FormData(form);

      const payload = {
        title: (formData.get("title") || "").toString().trim(),
        department: (formData.get("department") || "").toString().trim(),
        location: (formData.get("location") || "").toString().trim(),
        employmentType: (formData.get("employmentType") || "").toString().trim(),
        seniority: (formData.get("seniority") || "").toString().trim(),
        description: (formData.get("description") || "").toString().trim(),
        tags: (formData.get("tags") || "").toString(),
        visibility: (formData.get("visibility") || "").toString().trim(),
        publishNow: formData.get("publishNow") === "on",
      };

      if (!payload.title || !payload.location) {
        setApiError("Please enter at least a job title and location.");
        setIsSubmitting(false);
        return;
      }

      const res = await fetch("/api/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setApiError(data.error || "Failed to create job. Please try again.");
        setIsSubmitting(false);
        return;
      }

      const data = await res.json();

      // Redirect to the newly created job's pipeline
      if (data.id) {
        router.push(`/ats/jobs/${data.id}`);
      } else {
        router.push("/ats");
      }
    } catch (err) {
      console.error("Error submitting job form", err);
      setApiError("Something went wrong. Please try again.");
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {apiError && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {apiError}
        </p>
      )}

      {/* Job basics */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="block text-sm font-medium text-slate-700">
            Job title *
          </label>
          <input
            name="title"
            type="text"
            required
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-[#172965] focus:outline-none focus:ring-1 focus:ring-[#172965]"
            placeholder="Head of Shipping"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700">
            Department
          </label>
          <input
            name="department"
            type="text"
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-[#172965] focus:outline-none focus:ring-1 focus:ring-[#172965]"
            placeholder="Operations, Engineering, etc."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700">
            Location *
          </label>
          <input
            name="location"
            type="text"
            required
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-[#172965] focus:outline-none focus:ring-1 focus:ring-[#172965]"
            placeholder="Lagos, Hybrid, etc."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700">
            Employment type
          </label>
          <input
            name="employmentType"
            type="text"
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-[#172965] focus:outline-none focus:ring-1 focus:ring-[#172965]"
            placeholder="Full-time, Contract, etc."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700">
            Seniority
          </label>
          <input
            name="seniority"
            type="text"
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-[#172965] focus:outline-none focus:ring-1 focus:ring-[#172965]"
            placeholder="Senior, Mid-level, Lead, etc."
          />
        </div>
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-slate-700">
          Description
        </label>
        <textarea
          name="description"
          rows={6}
          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-[#172965] focus:outline-none focus:ring-1 focus:ring-[#172965]"
          placeholder="Describe the role, responsibilities, and profile."
        />
      </div>

      {/* Tags + visibility */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-slate-700">
            Tags (comma-separated)
          </label>
          <input
            name="tags"
            type="text"
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-[#172965] focus:outline-none focus:ring-1 focus:ring-[#172965]"
            placeholder="Product, B2B, SaaS"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700">
            Visibility
          </label>
          <select
            name="visibility"
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-[#172965] focus:outline-none focus:ring-1 focus:ring-[#172965]"
            defaultValue="public"
          >
            <option value="public">Public (show on job board)</option>
            <option value="internal">Internal only</option>
          </select>
        </div>
      </div>

      {/* Publish toggle */}
      <div className="flex items-center gap-2">
        <input
          id="publishNow"
          name="publishNow"
          type="checkbox"
          className="h-4 w-4 rounded border-slate-300 text-[#172965] focus:ring-[#172965]"
        />
        <label htmlFor="publishNow" className="text-sm text-slate-700">
          Publish this role now (status = open)
        </label>
      </div>

      {/* Submit */}
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex items-center rounded-full bg-[#172965] px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#111b4a] disabled:opacity-60"
        >
          {isSubmitting ? "Creating..." : "Create job"}
        </button>
      </div>
    </form>
  );
}
