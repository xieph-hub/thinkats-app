// components/ats/JobPublishingForm.tsx
"use client";

import React, { useRef, useState } from "react";

type SubmitMode = "draft" | "publish";

type JobPublishingFormProps = {
  tenantId?: string;
};

const PUBLIC_TENANT_ID =
  process.env.NEXT_PUBLIC_ATS_TENANT_ID ||
  process.env.NEXT_PUBLIC_DEFAULT_TENANT_ID ||
  "";

export function JobPublishingForm({ tenantId }: JobPublishingFormProps) {
  const formRef = useRef<HTMLFormElement | null>(null);
  const [submitting, setSubmitting] = useState<SubmitMode | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const effectiveTenantId = tenantId || PUBLIC_TENANT_ID;

  async function handleSubmit(mode: SubmitMode) {
    setError(null);
    setMessage(null);

    if (!formRef.current) return;

    if (!effectiveTenantId) {
      setError(
        "Missing tenant configuration. Pass tenantId to JobPublishingForm or set NEXT_PUBLIC_ATS_TENANT_ID."
      );
      return;
    }

    const formEl = formRef.current;
    const formData = new FormData(formEl);

    const payload = {
      tenantId: effectiveTenantId,
      submit_mode: mode,

      // BASIC
      title: String(formData.get("title") || "").trim(),
      shortDescription: String(formData.get("shortDescription") || "").trim(),
      description: String(formData.get("description") || "").trim(),

      // CLASSIFICATION
      department: String(formData.get("department") || "").trim() || null,
      location: String(formData.get("location") || "").trim(),
      locationType: String(formData.get("locationType") || "").trim() || null,
      employmentType: String(formData.get("employmentType") || "").trim(),
      experienceLevel:
        String(formData.get("experienceLevel") || "").trim() || null,
      yearsExperienceMin:
        String(formData.get("yearsExperienceMin") || "").trim() || null,
      yearsExperienceMax:
        String(formData.get("yearsExperienceMax") || "").trim() || null,

      // COMP
      salaryMin: String(formData.get("salaryMin") || "").trim() || null,
      salaryMax: String(formData.get("salaryMax") || "").trim() || null,
      salaryCurrency:
        String(formData.get("salaryCurrency") || "").trim() || null,
      salaryVisible: formData.get("salaryVisible") === "on",

      // REQUIREMENTS
      requiredSkills: String(formData.get("requiredSkills") || "").trim(),
      educationRequired:
        String(formData.get("educationRequired") || "").trim() || null,
      educationField:
        String(formData.get("educationField") || "").trim() || null,

      // TAGS
      tags_raw: String(formData.get("tags_raw") || "").trim(),

      // VISIBILITY / LEGACY FLAGS
      visibility: String(formData.get("visibility") || "").trim() || undefined,
      internalOnly: formData.get("internalOnly") === "on",
      confidential: formData.get("confidential") === "on",
    };

    // Basic validation mirroring your API
    if (!payload.title || !payload.description || !payload.location || !payload.employmentType) {
      setError(
        "Job title, description, location and employment type are required."
      );
      return;
    }

    setSubmitting(mode);

    try {
      const res = await fetch("/api/ats/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json?.error || "Failed to create job");
      }

      setMessage(
        mode === "publish"
          ? "Job published successfully."
          : "Draft saved successfully."
      );

      // You can choose to reset the form on success if you like:
      // formEl.reset();
    } catch (err: any) {
      setError(err?.message || "Unexpected error saving job.");
    } finally {
      setSubmitting(null);
    }
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <header className="border-b border-slate-100 pb-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
          Job publishing
        </p>
        <h1 className="mt-1 text-2xl font-semibold text-slate-900">
          Create a new role
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          This structure feeds both the public job page and the ATS pipeline.
        </p>
      </header>

      <form
        ref={formRef}
        onSubmit={(e) => e.preventDefault()}
        className="mt-6 space-y-6"
      >
        {/* SECTION 1: BASIC INFORMATION */}
        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
            Basic information
          </h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2 space-y-1">
              <label className="text-xs font-medium text-slate-800">
                Job title *
              </label>
              <input
                name="title"
                required
                maxLength={100}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none focus:border-[#172965] focus:ring-1 focus:ring-[#172965]/70"
              />
            </div>
            <div className="sm:col-span-2 space-y-1">
              <label className="text-xs font-medium text-slate-800">
                Short description
              </label>
              <input
                name="shortDescription"
                maxLength={150}
                placeholder="One-line summary shown on job cards"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none focus:border-[#172965] focus:ring-1 focus:ring-[#172965]/70"
              />
            </div>
            <div className="sm:col-span-2 space-y-1">
              <label className="text-xs font-medium text-slate-800">
                Full job description *
              </label>
              <textarea
                name="description"
                required
                rows={8}
                placeholder="Include overview, responsibilities, requirements and what you offer."
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none focus:border-[#172965] focus:ring-1 focus:ring-[#172965]/70"
              />
            </div>
          </div>
        </section>

        {/* SECTION 2: JOB CLASSIFICATION */}
        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
            Classification
          </h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-800">
                Department / Function
              </label>
              <input
                name="department"
                placeholder="Engineering, Product, Sales..."
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none focus:border-[#172965] focus:ring-1 focus:ring-[#172965]/70"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-800">
                Location *
              </label>
              <input
                name="location"
                required
                placeholder="Lagos, Abuja, Remote..."
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none focus:border-[#172965] focus:ring-1 focus:ring-[#172965]/70"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-800">
                Location type
              </label>
              <select
                name="locationType"
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-[#172965] focus:ring-1 focus:ring-[#172965]/70"
              >
                <option value="">Select...</option>
                <option value="onsite">On-site</option>
                <option value="remote">Remote</option>
                <option value="hybrid">Hybrid</option>
                <option value="flexible">Flexible</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-800">
                Employment type *
              </label>
              <select
                name="employmentType"
                required
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-[#172965] focus:ring-1 focus:ring-[#172965]/70"
              >
                <option value="">Select...</option>
                <option value="full-time">Full-time</option>
                <option value="part-time">Part-time</option>
                <option value="contract">Contract</option>
                <option value="internship">Internship</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-800">
                Experience level
              </label>
              <select
                name="experienceLevel"
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-[#172965] focus:ring-1 focus:ring-[#172965]/70"
              >
                <option value="">Select...</option>
                <option value="entry">Entry level</option>
                <option value="mid">Mid level</option>
                <option value="senior">Senior level</option>
                <option value="lead">Lead / Principal</option>
                <option value="executive">Executive</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-800">
                  Min years
                </label>
                <input
                  type="number"
                  name="yearsExperienceMin"
                  min={0}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none focus:border-[#172965] focus:ring-1 focus:ring-[#172965]/70"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-800">
                  Max years
                </label>
                <input
                  type="number"
                  name="yearsExperienceMax"
                  min={0}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none focus:border-[#172965] focus:ring-1 focus:ring-[#172965]/70"
                />
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 3: COMPENSATION */}
        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
            Compensation (optional)
          </h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-800">
                Min salary
              </label>
              <input
                type="number"
                name="salaryMin"
                min={0}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none focus:border-[#172965] focus:ring-1 focus:ring-[#172965]/70"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-800">
                Max salary
              </label>
              <input
                type="number"
                name="salaryMax"
                min={0}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none focus:border-[#172965] focus:ring-1 focus:ring-[#172965]/70"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-800">
                Currency
              </label>
              <select
                name="salaryCurrency"
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-[#172965] focus:ring-1 focus:ring-[#172965]/70"
              >
                <option value="">Select...</option>
                <option value="NGN">NGN</option>
                <option value="USD">USD</option>
                <option value="GBP">GBP</option>
                <option value="EUR">EUR</option>
              </select>
            </div>
          </div>
          <div className="mt-3 flex items-center gap-2">
            <input
              id="salaryVisible"
              name="salaryVisible"
              type="checkbox"
              className="h-3 w-3 rounded border-slate-300 text-[#172965] focus:ring-[#172965]"
            />
            <label
              htmlFor="salaryVisible"
              className="text-[11px] text-slate-700"
            >
              Show salary range publicly on the job page
            </label>
          </div>
        </section>

        {/* SECTION 4: REQUIREMENTS & TAGS */}
        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
            Requirements & skills
          </h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-800">
                Required skills (comma-separated)
              </label>
              <input
                name="requiredSkills"
                placeholder="JavaScript, React, Stakeholder management..."
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none focus:border-[#172965] focus:ring-1 focus:ring-[#172965]/70"
              />
              <p className="mt-1 text-[10px] text-slate-500">
                Used for candidate matching and internal search.
              </p>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-800">
                Tags (comma-separated)
              </label>
              <input
                name="tags_raw"
                placeholder="Nigeria, Fintech, Leadership..."
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none focus:border-[#172965] focus:ring-1 focus:ring-[#172965]/70"
              />
              <p className="mt-1 text-[10px] text-slate-500">
                Powers filters and public job page chips.
              </p>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-800">
                Minimum education
              </label>
              <select
                name="educationRequired"
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-[#172965] focus:ring-1 focus:ring-[#172965]/70"
              >
                <option value="">Select...</option>
                <option value="high_school">High School Diploma</option>
                <option value="bachelor">Bachelor&apos;s Degree</option>
                <option value="master">Master&apos;s Degree</option>
                <option value="phd">PhD</option>
                <option value="certification">Professional certification</option>
                <option value="none">No formal education required</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-800">
                Field of study
              </label>
              <input
                name="educationField"
                placeholder="e.g. Computer Science, Accounting"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none focus:border-[#172965] focus:ring-1 focus:ring-[#172965]/70"
              />
            </div>
          </div>
        </section>

        {/* SECTION 5: VISIBILITY & SETTINGS */}
        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
            Visibility & settings
          </h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <p className="text-[11px] font-medium text-slate-800">
                Who should see this job?
              </p>
              <div className="space-y-2 text-[11px] text-slate-700">
                <label className="flex items-start gap-2">
                  <input
                    type="radio"
                    name="visibility"
                    value="public"
                    defaultChecked
                    className="mt-[2px] h-3 w-3 border-slate-300 text-[#172965] focus:ring-[#172965]"
                  />
                  <span>
                    <span className="font-semibold text-slate-900">
                      Public
                    </span>{" "}
                    – appears on your careers site and can be shared.
                  </span>
                </label>
                <label className="flex items-start gap-2">
                  <input
                    type="radio"
                    name="visibility"
                    value="internal"
                    className="mt-[2px] h-3 w-3 border-slate-300 text-[#172965] focus:ring-[#172965]"
                  />
                  <span>
                    <span className="font-semibold text-slate-900">
                      Internal
                    </span>{" "}
                    – only visible to employees and internal referrals.
                  </span>
                </label>
                <label className="flex items-start gap-2">
                  <input
                    type="radio"
                    name="visibility"
                    value="confidential"
                    className="mt-[2px] h-3 w-3 border-slate-300 text-[#172965] focus:ring-[#172965]"
                  />
                  <span>
                    <span className="font-semibold text-slate-900">
                      Confidential
                    </span>{" "}
                    – hides client name on the public job page.
                  </span>
                </label>
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-[11px] font-medium text-slate-800">
                Legacy flags
              </p>
              <div className="space-y-2 text-[11px] text-slate-700">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    name="internalOnly"
                    className="h-3 w-3 border-slate-300 text-[#172965] focus:ring-[#172965]"
                  />
                  <span>Internal only (kept for backwards compatibility)</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    name="confidential"
                    className="h-3 w-3 border-slate-300 text-[#172965] focus:ring-[#172965]"
                  />
                  <span>Confidential (kept for backwards compatibility)</span>
                </label>
              </div>
            </div>
          </div>
        </section>

        {/* STATUS / FEEDBACK + ACTIONS */}
        {(error || message) && (
          <div className="rounded-xl border px-3 py-2 text-[11px] text-slate-800">
            {error && (
              <p className="border-b border-red-100 pb-1 text-red-700">
                {error}
              </p>
            )}
            {message && (
              <p className="pt-1 text-emerald-700">{message}</p>
            )}
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-[11px] text-slate-500">
            Save as a draft or publish straight to your job board. You can edit,
            pause or close the role at any time.
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={submitting !== null}
              onClick={() => handleSubmit("draft")}
              className="inline-flex items-center rounded-full border border-slate-200 bg-white px-4 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting === "draft" ? "Saving..." : "Save as draft"}
            </button>
            <button
              type="button"
              disabled={submitting !== null}
              onClick={() => handleSubmit("publish")}
              className="inline-flex items-center rounded-full bg-[#172965] px-4 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-[#111c4c] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {submitting === "publish" ? "Publishing..." : "Publish job"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
