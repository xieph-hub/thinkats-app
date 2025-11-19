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

    try:
    {
      const form = e.currentTarget;
      const formData = new FormData(form);

      const title = String(formData.get("title") || "").trim();
      const slug = String(formData.get("slug") || "").trim();
      const location = String(formData.get("location") || "").trim();

      if (!title) {
        setApiError("Title is required.");
        setIsSubmitting(false);
        return;
      }

      // Build payload matching /api/jobs (and Jobs table)
      const payload: any = {
        title,
        slug: slug || undefined, // server will slugify if empty
        location: location || null,
        department: String(formData.get("department") || "").trim() || null,
        jobType: String(formData.get("jobType") || "").trim() || null,
        level: String(formData.get("level") || "").trim() || null,
        function: String(formData.get("function") || "").trim() || null,
        industry: String(formData.get("industry") || "").trim() || null,
        remoteOption:
          String(formData.get("remoteOption") || "").trim() || null,
        employmentType:
          String(formData.get("employmentType") || "").trim() || null,
        seniority: String(formData.get("seniority") || "").trim() || null,
        salaryCurrency:
          String(formData.get("salaryCurrency") || "").trim() || null,
        salaryMin: String(formData.get("salaryMin") || "").trim() || null,
        salaryMax: String(formData.get("salaryMax") || "").trim() || null,
        experienceMax:
          String(formData.get("experienceMax") || "").trim() || null,
        summary: String(formData.get("summary") || "").trim() || null,
        description: String(formData.get("description") || "").trim() || null,
        requirements:
          String(formData.get("requirements") || "").trim() || null,
        clientName: String(formData.get("clientName") || "").trim() || null,
        clientSlug: String(formData.get("clientSlug") || "").trim() || null,
        clientCompanyId:
          String(formData.get("clientCompanyId") || "").trim() || null,
        status: String(formData.get("status") || "").trim() || "draft",
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
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        let message = "Failed to create job.";
        try {
          const json = await res.json();
          if (json?.error) message = json.error;
        } catch (_) {
          // ignore JSON parse errors
        }
        setApiError(message);
        setIsSubmitting(false);
        return;
      }

      const job = await res.json();

      // Redirect straight to the new job's pipeline
      if (job?.id) {
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
            Slug
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

        <div>
          <label className="block text-sm font-medium text-slate-700">
            Location
          </label>
          <input
            name="location"
            type="text"
            placeholder="Lagos, Nigeria · Hybrid"
            className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-[#172965] focus:outline-none focus:ring-1 focus:ring-[#172965]"
          />
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
            Job type
          </label>
          <select
            name="jobType"
            className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-[#172965] focus:outline-none focus:ring-1 focus:ring-[#172965]"
          >
            <option value="">Select...</option>
            <option value="Full-time">Full-time</option>
            <option value="Part-time">Part-time</option>
            <option value="Contract">Contract</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">
            Level / seniority
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
            Remote option
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
            Industry
          </label>
          <input
            name="industry"
            type="text"
            placeholder="Fintech, Oil & Gas..."
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
        <div>
          <label className="block text-sm font-medium text-slate-700">
            Max experience (years)
          </label>
          <input
            name="experienceMax"
            type="number"
            min={0}
            className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-[#172965] focus:outline-none focus:ring-1 focus:ring-[#172965]"
          />
        </div>
      </div>

      {/* Client context */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label className="block text-sm font-medium text-slate-700">
            Client name
          </label>
          <input
            name="clientName"
            type="text"
            className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-[#172965] focus:outline-none focus:ring-1 focus:ring-[#172965]"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">
            Client slug
          </label>
          <input
            name="clientSlug"
            type="text"
            placeholder="acme-inc"
            className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-[#172965] focus:outline-none focus:ring-1 focus:ring-[#172965]"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">
            Client company ID
          </label>
          <input
            name="clientCompanyId"
            type="text"
            className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-[#172965] focus:outline-none focus:ring-1 focus:ring-[#172965]"
          />
        </div>
      </div>

      {/* Copy fields */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700">
            Short summary
          </label>
          <textarea
            name="summary"
            rows={2}
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
            className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-[#172965] focus:outline-none focus:ring-1 focus:ring-[#172965]"
          />
        </div>
      </div>

      {/* Tags & status */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700">
            Tags
          </label>
          <input
            name="tags"
            type="text"
            placeholder="shipping, logistics, operations"
            className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-[#172965] focus:outline-none focus:ring-1 focus:ring-[#172965]"
          />
          <p className="mt-1 text-xs text-slate-500">
            Comma-separated. Used for search and filtering.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-4">
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
              Publish this role
            </label>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-500">
              Status
            </label>
            <select
              name="status"
              defaultValue="open"
              className="mt-1 block w-40 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs shadow-sm focus:border-[#172965] focus:outline-none focus:ring-1 focus:ring-[#172965]"
            >
              <option value="open">Open</option>
              <option value="on_hold">On hold</option>
              <option value="closed">Closed</option>
              <option value="draft">Draft</option>
            </select>
          </div>
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
