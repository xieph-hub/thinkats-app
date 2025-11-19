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
          if (json && json.error) {
            message = json.error;
          }
        } catch (error) {
          // ignore JSON parse errors
        }
        setApiError(message);
        setIsSubmitting(false);
        return;
      }

      const job = await res.json();

      // Redirect straight to the new job's pipeline
      if (job && job.id) {
        router.push(`/ats/jobs/${job.id}`);
      } else {
        router.push("/ats");
      }
    } catch (err) {
      console.error("Error submitting job form:", err);
      setApiError("Unexpected error while creating job.");
    } finally {
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
