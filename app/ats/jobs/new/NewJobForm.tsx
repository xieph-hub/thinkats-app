// app/ats/jobs/new/NewJobForm.tsx
"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

type ApiError = string | null;

export default function NewJobForm() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState<ApiError>(null);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setApiError(null);
    setIsSubmitting(true);

    try {
      const form = e.currentTarget;
      const formData = new FormData(form);

      const title = String(formData.get("title") || "").trim();
      const location = String(formData.get("location") || "").trim();

      if (!title) {
        setApiError("Job title is required.");
        setIsSubmitting(false);
        return;
      }

      if (!location) {
        setApiError("Location is required.");
        setIsSubmitting(false);
        return;
      }

      // Build payload to send to /api/jobs
      const payload: any = {
        title,
        location,
        slug: String(formData.get("slug") || "").trim() || undefined,
        department:
          String(formData.get("department") || "").trim() || null,
        employmentType:
          String(formData.get("employmentType") || "").trim() || null,
        seniority:
          String(formData.get("seniority") || "").trim() || null,
        function:
          String(formData.get("function") || "").trim() || null,
        industry:
          String(formData.get("industry") || "").trim() || null,
        remoteOption:
          String(formData.get("remoteOption") || "").trim() || null,
        salaryCurrency:
          String(formData.get("salaryCurrency") || "").trim() || null,
        salaryMin: String(formData.get("salaryMin") || "").trim() || null,
        salaryMax: String(formData.get("salaryMax") || "").trim() || null,
        experienceMax:
          String(formData.get("experienceMax") || "").trim() || null,
        summary: String(formData.get("summary") || "").trim() || null,
        description:
          String(formData.get("description") || "").trim() || null,
        requirements:
          String(formData.get("requirements") || "").trim() || null,
        isPublished: formData.get("isPublished") === "on",
      };

      const tagsRaw = String(formData.get("tags") || "").trim();
      if (tagsRaw) {
        payload.tags = tagsRaw
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean);
      }

      const res = await fetch("/api/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        let message = "Failed to create job.";
        try {
          const json = await res.json();
          if (json && json.error) {
            message = json.error;
          }
        } catch {
          // ignore
        }
        setApiError(message);
        setIsSubmitting(false);
        return;
      }

      const job = await res.json();

      // Redirect: go straight to ATS pipeline, or fallback to ATS dashboard
      if (job && job.id) {
        router.push(`/ats/jobs/${job.id}`);
      } else {
        router.push("/ats");
      }
    } catch (err) {
      console.error("Error submitting job form:", err);
      setApiError("Unexpected error while creating job.");
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Error banner */}
      {apiError && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {apiError}
        </div>
      )}

      {/* Basic info */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="block text-sm font-medium text-slate-700">
            Job title<span className="text-red-500">*</span>
          </label>
          <input
            name="title"
            type="text"
            required
            placeholder="Head of Shipping"
            className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-[#172965] focus:outline-none focus:ring-1 focus:ring-[#172965]"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700">
            Location<span className="text-red-500">*</span>
          </label>
          <input
            name="location"
            type="text"
            required
            placeholder="Lagos, Nigeria · Hybrid"
            className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-[#172965] focus:outline-none focus:ring-1 focus:ring-[#172965]"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700">
            Slug (optional)
          </label>
          <input
            name="slug"
            type="text"
            placeholder="head-of-shipping"
            className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-[#172965] focus:outline-none focus:ring-1 focus:ring-[#172965]"
          />
          <p className="mt-1 text-xs text-slate-500">
            Leave blank to auto-generate from the title.
          </p>
        </div>
      </div>

      {/* Classification */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label className="block text-sm font-medium text-slate-700">
            Department
          </label>
          <input
            name="department"
            type="text"
            placeholder="Operations"
            className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-[#172965] focus:outline-none focus:ring-1 focus:ring-[#172965]"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">
            Employment type
          </label>
          <select
            name="employmentType"
            className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-[#172965] focus:outline-none focus:ring-1 focus:ring-[#172965]"
          >
            <option value="">Select...</option>
            <option value="Full-time">Full-time</option>
            <option value="Part-time">Part-time</option>
            <option value="Contract">Contract</option>
            <option value="Internship">Internship</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">
            Seniority
          </label>
          <select
            name="seniority"
            className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-[#172965] focus:outline-none focus:ring-1 focus:ring-[#172965]"
          >
            <option value="">Select...</option>
            <option value="Junior">Junior</option>
            <option value="Mid">Mid</option>
            <option value="Senior">Senior</option>
            <option value="Lead">Lead</option>
            <option value="Director">Director</option>
            <option value="Executive">Executive</option>
          </select>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label className="block text-sm font-medium text-slate-700">
            Function
          </label>
          <input
            name="function"
            type="text"
            placeholder="Operations, Sales, Engineering..."
            className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-[#172965] focus:outline-none focus:ring-1 focus:ring-[#172965]"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">
            Work mode
          </label>
          <select
            name="remoteOption"
            className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-[#172965] focus:outline-none focus:ring-1 focus:ring-[#172965]"
          >
            <option value="">Select...</option>
            <option value="Onsite">Onsite</option>
            <option value="Hybrid">Hybrid</option>
            <option value="Remote">Remote</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">
            Minimum years of experience
          </label>
          <input
            name="experienceMax"
            type="number"
            min={0}
            className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-[#172965] focus:outline-none focus:ring-1 focus:ring-[#172965]"
          />
        </div>
      </div>

      {/* Compensation */}
      <div className="grid gap-4 sm:grid-cols-4">
        <div>
          <label className="block text-sm font-medium text-slate-700">
            Currency
          </label>
          <input
            name="salaryCurrency"
            type="text"
            placeholder="NGN, USD..."
            className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-[#172965] focus:outline-none focus:ring-1 focus:ring-[#172965]"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">
            Min salary
          </label>
          <input
            name="salaryMin"
            type="number"
            min={0}
            className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-[#172965] focus:outline-none focus:ring-1 focus:ring-[#172965]"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">
            Max salary
          </label>
          <input
            name="salaryMax"
            type="number"
            min={0}
            className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-[#172965] focus:outline-none focus:ring-1 focus:ring-[#172965]"
          />
        </div>
      </div>

      {/* Industry & copy fields */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700">
            Industry
          </label>
          <input
            name="industry"
            type="text"
            placeholder="Fintech, Logistics, Healthcare..."
            className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-[#172965] focus:outline-none focus:ring-1 focus:ring-[#172965]"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700">
            Short summary
          </label>
          <textarea
            name="summary"
            rows={2}
            placeholder="One or two lines that describe the role."
            className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-[#172965] focus:outline-none focus:ring-1 focus:ring-[#172965]"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700">
            Full description
          </label>
          <textarea
            name="description"
            rows={4}
            placeholder="What this role exists to do, the team, etc."
            className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-[#172965] focus:outline-none focus:ring-1 focus:ring-[#172965]"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700">
            Requirements
          </label>
          <textarea
            name="requirements"
            rows={3}
            placeholder="Skills, experience, and traits you care about."
            className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-[#172965] focus:outline-none focus:ring-1 focus:ring-[#172965]"
          />
        </div>
      </div>

      {/* Tags & publish */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700">
            Tags / skills
          </label>
          <input
            name="tags"
            type="text"
            placeholder="shipping, logistics, operations, excel"
            className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-[#172965] focus:outline-none focus:ring-1 focus:ring-[#172965]"
          />
          <p className="mt-1 text-xs text-slate-500">
            Comma-separated keywords (your skills/competency taxonomy v1).
          </p>
        </div>

        <div className="flex items-center gap-2">
          <input
            id="isPublished"
            name="isPublished"
            type="checkbox"
            className="h-4 w-4 rounded border-slate-300 text-[#172965] focus:ring-[#172965]"
          />
          <label
            htmlFor="isPublished"
            className="text-sm font-medium text-slate-700"
          >
            Publish this role now (otherwise it will be saved as draft)
          </label>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 pt-4">
        <button
          type="button"
          onClick={() => router.push("/ats")}
          className="inline-flex items-center rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
          disabled={isSubmitting}
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex items-center rounded-full bg-[#172965] px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#111b4a] disabled:opacity-70"
        >
          {isSubmitting ? "Creating..." : "Create job"}
        </button>
      </div>
    </form>
  );
}
