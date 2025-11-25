// components/ats/JobPublishingForm.tsx
"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

type ClientCompany = {
  id: string;
  name: string;
  logo_url: string | null;
  slug: string | null;
};

type Props = {
  tenantId: string;
  clients: ClientCompany[];
};

type SubmitMode = "draft" | "publish";

export function JobPublishingForm({ tenantId, clients }: Props) {
  const router = useRouter();
  const [submitMode, setSubmitMode] = React.useState<SubmitMode>("publish");
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState<string | null>(null);
  const [createdJobLink, setCreatedJobLink] = React.useState<string | null>(
    null
  );

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(null);
    setCreatedJobLink(null);

    const form = e.currentTarget;
    const formData = new FormData(form);

    try {
      const payload: Record<string, unknown> = {};

      // Core
      payload.tenantId = tenantId;
      payload.title = (formData.get("title") || "").toString().trim();
      payload.shortDescription = (
        formData.get("shortDescription") || ""
      ).toString();
      payload.description = (
        formData.get("description") || ""
      ).toString();
      payload.department = (
        formData.get("department") || ""
      ).toString();
      payload.location = (formData.get("location") || "").toString().trim();

      // Client
      const clientCompanyId = (formData.get("clientCompanyId") || "")
        .toString()
        .trim();
      if (clientCompanyId) {
        payload.clientCompanyId = clientCompanyId;
      }

      // Work mode / location type
      const workMode = (formData.get("work_mode") || "")
        .toString()
        .toLowerCase();
      payload.work_mode = workMode || null;
      // Keep locationType in sync for backwards compatibility
      payload.locationType = workMode || null;

      // Employment / experience
      payload.employmentType = (
        formData.get("employmentType") || ""
      ).toString();
      payload.experienceLevel = (
        formData.get("experienceLevel") || ""
      ).toString();

      payload.yearsExperienceMin = (
        formData.get("yearsExperienceMin") || ""
      ).toString();
      payload.yearsExperienceMax = (
        formData.get("yearsExperienceMax") || ""
      ).toString();

      // Compensation
      payload.salaryMin = (
        formData.get("salaryMin") || ""
      ).toString();
      payload.salaryMax = (
        formData.get("salaryMax") || ""
      ).toString();
      payload.salaryCurrency = (
        formData.get("salaryCurrency") || ""
      ).toString();
      payload.salaryVisible = formData.get("salaryVisible") === "on";

      // Tags / skills
      payload.tags_raw = (formData.get("tags_raw") || "").toString();
      payload.requiredSkills = (
        formData.get("requiredSkills") || ""
      ).toString();

      // Education
      payload.educationRequired = (
        formData.get("educationRequired") || ""
      ).toString();
      payload.educationField = (
        formData.get("educationField") || ""
      ).toString();

      // Visibility / confidential model
      const visibility =
        ((formData.get("visibility") || "public") as string) || "public";
      payload.visibility = visibility;

      // Submit mode
      payload.submit_mode = submitMode;

      const res = await fetch("/api/ats/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        let msg =
          "We couldn't save this role. Please review the fields or try again.";
        try {
          const json = await res.json();
          if (json?.error) msg = json.error as string;
        } catch {
          // ignore JSON parse failure
        }
        setError(msg);
        return;
      }

      const json = (await res.json()) as { jobId?: string; slug?: string | null };

      const jobId = json.jobId;
      const slug = json.slug ?? null;

      setSuccess(
        submitMode === "publish"
          ? "Role published. It is now visible in your ATS and on the public jobs page (if set to public)."
          : "Draft saved. You can continue editing this role in the ATS."
      );

      if (jobId) {
        const atsUrl = `/ats/jobs/${jobId}`;
        setCreatedJobLink(atsUrl);
      }

      // Optional: reset form after creating a draft / new job
      form.reset();
    } catch (err) {
      console.error("Job publishing failed:", err);
      setError(
        "Something went wrong while saving this role. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const disabled = submitting;

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <header className="border-b border-slate-100 pb-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
          New mandate
        </p>
        <h1 className="mt-1 text-2xl font-semibold text-slate-900">
          Create a new role
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-600">
          Capture the essentials, assign a client, and choose where this role
          appears. You can save drafts or publish directly to the public jobs
          page.
        </p>
      </header>

      {error && (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[11px] text-red-700">
          {error}
        </div>
      )}

      {success && (
        <div className="mt-4 flex items-start justify-between gap-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-[11px] text-emerald-800">
          <div>
            <p>{success}</p>
            {createdJobLink && (
              <p className="mt-1">
                View it in{" "}
                <button
                  type="button"
                  onClick={() => router.push(createdJobLink)}
                  className="font-semibold underline underline-offset-2"
                >
                  ATS job detail
                </button>
                .
              </p>
            )}
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-6 space-y-6">
        {/* 1. Job basics */}
        <section className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
          <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            Job basics
          </h2>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="block text-[11px] font-medium text-slate-700">
                Job title
                <input
                  type="text"
                  name="title"
                  required
                  className="mt-1 w-full rounded-md border border-slate-200 px-2 py-1.5 text-xs text-slate-900 shadow-sm focus:border-[#172965] focus:outline-none focus:ring-1 focus:ring-[#172965]"
                  placeholder="e.g. Head of Sales (West Africa)"
                />
              </label>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-slate-700">
                Department / Function
                <input
                  type="text"
                  name="department"
                  className="mt-1 w-full rounded-md border border-slate-200 px-2 py-1.5 text-xs text-slate-900 shadow-sm focus:border-[#172965] focus:outline-none focus:ring-1 focus:ring-[#172965]"
                  placeholder="e.g. Commercial, Operations"
                />
              </label>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-slate-700">
                Location (city, country)
                <input
                  type="text"
                  name="location"
                  required
                  className="mt-1 w-full rounded-md border border-slate-200 px-2 py-1.5 text-xs text-slate-900 shadow-sm focus:border-[#172965] focus:outline-none focus:ring-1 focus:ring-[#172965]"
                  placeholder="e.g. Lagos, Nigeria"
                />
              </label>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-[11px] font-medium text-slate-700">
                Short summary (internal & public)
                <textarea
                  name="shortDescription"
                  rows={2}
                  className="mt-1 w-full rounded-md border border-slate-200 px-2 py-1.5 text-xs text-slate-900 shadow-sm focus:border-[#172965] focus:outline-none focus:ring-1 focus:ring-[#172965]"
                  placeholder="One or two lines summarising why this role exists and what success looks like."
                />
              </label>
            </div>
          </div>
        </section>

        {/* 2. Client & visibility */}
        <section className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
          <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            Client & visibility
          </h2>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-[11px] font-medium text-slate-700">
                Client
                <select
                  name="clientCompanyId"
                  className="mt-1 w-full rounded-md border border-slate-200 bg-white px-2 py-1.5 text-xs text-slate-900 shadow-sm focus:border-[#172965] focus:outline-none focus:ring-1 focus:ring-[#172965]"
                  defaultValue=""
                >
                  <option value="">
                    No specific client / Resourcin direct
                  </option>
                  {clients.map((client) => (
                    <option key={client.id} value={client.id}>
                      {client.name}
                    </option>
                  ))}
                </select>
              </label>
              <p className="mt-1 text-[10px] text-slate-500">
                If this is a client mandate, pick the company so their name and
                logo can appear on ATS views and public pages (unless
                confidential).
              </p>
            </div>

            <div>
              <p className="text-[11px] font-medium text-slate-700">
                Work mode
              </p>
              <div className="mt-1 grid grid-cols-2 gap-1 text-[11px]">
                {[
                  { value: "onsite", label: "On-site" },
                  { value: "hybrid", label: "Hybrid" },
                  { value: "remote", label: "Remote" },
                  { value: "flexible", label: "Flexible" },
                ].map((opt) => (
                  <label
                    key={opt.value}
                    className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-2 py-1 text-slate-700"
                  >
                    <input
                      type="radio"
                      name="work_mode"
                      value={opt.value}
                      defaultChecked={opt.value === "onsite"}
                      className="h-3 w-3 border-slate-300 text-[#172965] focus:ring-[#172965]"
                    />
                    <span>{opt.label}</span>
                  </label>
                ))}
              </div>
              <p className="mt-1 text-[10px] text-slate-500">
                This drives remote / hybrid labels on internal and public job
                views.
              </p>
            </div>
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-[11px] font-medium text-slate-700">
                Visibility
              </p>
              <div className="mt-1 space-y-1 text-[11px]">
                <label className="flex items-start gap-2">
                  <input
                    type="radio"
                    name="visibility"
                    value="public"
                    defaultChecked
                    className="mt-[2px] h-3 w-3 border-slate-300 text-[#172965] focus:ring-[#172965]"
                  />
                  <span>
                    <span className="font-medium">Public</span>{" "}
                    <span className="text-slate-500">
                      – listed on /jobs and visible to candidates.
                    </span>
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
                    <span className="font-medium">Internal</span>{" "}
                    <span className="text-slate-500">
                      – only visible within your ATS, not on the public jobs
                      page.
                    </span>
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
                    <span className="font-medium">Confidential search</span>{" "}
                    <span className="text-slate-500">
                      – role can be public, but client name can be hidden in
                      public views.
                    </span>
                  </span>
                </label>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-slate-700">
                Tags (comma-separated)
                <input
                  type="text"
                  name="tags_raw"
                  className="mt-1 w-full rounded-md border border-slate-200 px-2 py-1.5 text-xs text-slate-900 shadow-sm focus:border-[#172965] focus:outline-none focus:ring-1 focus:ring-[#172965]"
                  placeholder="e.g. sales leadership, B2B SaaS, West Africa"
                />
              </label>
              <p className="mt-1 text-[10px] text-slate-500">
                Used for filtering and quick context on job cards.
              </p>
            </div>
          </div>
        </section>

        {/* 3. Experience & compensation */}
        <section className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
          <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            Experience & compensation
          </h2>

          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <div>
              <label className="block text-[11px] font-medium text-slate-700">
                Employment type
                <select
                  name="employmentType"
                  required
                  className="mt-1 w-full rounded-md border border-slate-200 bg-white px-2 py-1.5 text-xs text-slate-900 shadow-sm focus:border-[#172965] focus:outline-none focus:ring-1 focus:ring-[#172965]"
                  defaultValue="full-time"
                >
                  <option value="full-time">Full-time</option>
                  <option value="part-time">Part-time</option>
                  <option value="contract">Contract</option>
                  <option value="internship">Internship</option>
                </select>
              </label>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-slate-700">
                Experience level
                <select
                  name="experienceLevel"
                  className="mt-1 w-full rounded-md border border-slate-200 bg-white px-2 py-1.5 text-xs text-slate-900 shadow-sm focus:border-[#172965] focus:outline-none focus:ring-1 focus:ring-[#172965]"
                  defaultValue=""
                >
                  <option value="">Not specified</option>
                  <option value="entry">Entry level</option>
                  <option value="mid">Mid level</option>
                  <option value="senior">Senior level</option>
                  <option value="lead">Lead / Principal</option>
                  <option value="executive">Executive</option>
                </select>
              </label>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-slate-700">
                Years of experience
              </label>
              <div className="mt-1 grid grid-cols-[1fr_auto_1fr] items-center gap-1">
                <input
                  type="number"
                  name="yearsExperienceMin"
                  min={0}
                  className="w-full rounded-md border border-slate-200 px-2 py-1.5 text-xs text-slate-900 shadow-sm focus:border-[#172965] focus:outline-none focus:ring-1 focus:ring-[#172965]"
                  placeholder="Min"
                />
                <span className="text-center text-[11px] text-slate-500">
                  –
                </span>
                <input
                  type="number"
                  name="yearsExperienceMax"
                  min={0}
                  className="w-full rounded-md border border-slate-200 px-2 py-1.5 text-xs text-slate-900 shadow-sm focus:border-[#172965] focus:outline-none focus:ring-1 focus:ring-[#172965]"
                  placeholder="Max"
                />
              </div>
            </div>
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-[1.2fr_1fr]">
            <div>
              <label className="block text-[11px] font-medium text-slate-700">
                Salary range (gross, annual)
              </label>
              <div className="mt-1 grid grid-cols-[1fr_auto_1fr] items-center gap-1">
                <input
                  type="number"
                  name="salaryMin"
                  min={0}
                  className="w-full rounded-md border border-slate-200 px-2 py-1.5 text-xs text-slate-900 shadow-sm focus:border-[#172965] focus:outline-none focus:ring-1 focus:ring-[#172965]"
                  placeholder="Min"
                />
                <span className="text-center text-[11px] text-slate-500">
                  –
                </span>
                <input
                  type="number"
                  name="salaryMax"
                  min={0}
                  className="w-full rounded-md border border-slate-200 px-2 py-1.5 text-xs text-slate-900 shadow-sm focus:border-[#172965] focus:outline-none focus:ring-1 focus:ring-[#172965]"
                  placeholder="Max"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-[11px] font-medium text-slate-700">
                Currency
                <select
                  name="salaryCurrency"
                  className="mt-1 w-full rounded-md border border-slate-200 bg-white px-2 py-1.5 text-xs text-slate-900 shadow-sm focus:border-[#172965] focus:outline-none focus:ring-1 focus:ring-[#172965]"
                  defaultValue="NGN"
                >
                  <option value="NGN">NGN</option>
                  <option value="USD">USD</option>
                  <option value="GBP">GBP</option>
                  <option value="EUR">EUR</option>
                </select>
              </label>
              <label className="inline-flex items-center gap-2 text-[11px] text-slate-700">
                <input
                  type="checkbox"
                  name="salaryVisible"
                  className="h-3 w-3 border-slate-300 text-[#172965] focus:ring-[#172965]"
                />
                <span>Show range on public job page</span>
              </label>
              <p className="text-[10px] text-slate-500">
                If left unticked, compensation is captured internally but not
                shown on /jobs.
              </p>
            </div>
          </div>
        </section>

        {/* 4. Description, skills & education */}
        <section className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
          <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            Description, skills & education
          </h2>

          <div className="mt-4 space-y-4">
            <div>
              <label className="block text-[11px] font-medium text-slate-700">
                Full description
                <textarea
                  name="description"
                  rows={8}
                  required
                  className="mt-1 w-full rounded-md border border-slate-200 px-2 py-1.5 text-xs text-slate-900 shadow-sm focus:border-[#172965] focus:outline-none focus:ring-1 focus:ring-[#172965]"
                  placeholder={
                    "Use clear headings like:\n\nOverview\n\nResponsibilities\n- Bullet 1\n- Bullet 2\n\nRequirements\n- Bullet 1\n- Bullet 2"
                  }
                />
              </label>
              <p className="mt-1 text-[10px] text-slate-500">
                The public job detail page will automatically split this into
                Overview, Responsibilities and Requirements where possible.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-[11px] font-medium text-slate-700">
                  Key skills (comma-separated)
                  <input
                    type="text"
                    name="requiredSkills"
                    className="mt-1 w-full rounded-md border border-slate-200 px-2 py-1.5 text-xs text-slate-900 shadow-sm focus:border-[#172965] focus:outline-none focus:ring-1 focus:ring-[#172965]"
                    placeholder="e.g. enterprise sales, stakeholder management"
                  />
                </label>
                <p className="mt-1 text-[10px] text-slate-500">
                  These appear as skill chips under Requirements.
                </p>
              </div>

              <div className="space-y-2">
                <label className="block text-[11px] font-medium text-slate-700">
                  Education requirement
                  <input
                    type="text"
                    name="educationRequired"
                    className="mt-1 w-full rounded-md border border-slate-200 px-2 py-1.5 text-xs text-slate-900 shadow-sm focus:border-[#172965] focus:outline-none focus:ring-1 focus:ring-[#172965]"
                    placeholder="e.g. BSc or equivalent experience"
                  />
                </label>
                <label className="block text-[11px] font-medium text-slate-700">
                  Field of study (optional)
                  <input
                    type="text"
                    name="educationField"
                    className="mt-1 w-full rounded-md border border-slate-200 px-2 py-1.5 text-xs text-slate-900 shadow-sm focus:border-[#172965] focus:outline-none focus:ring-1 focus:ring-[#172965]"
                    placeholder="e.g. Engineering, Business, Finance"
                  />
                </label>
              </div>
            </div>
          </div>
        </section>

        {/* 5. Publishing controls */}
        <section className="flex flex-col gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[10px] text-slate-500">
            This role will be created under your tenant and available in the
            ATS. Publishing will also push it to the public jobs page if
            visibility is set to <span className="font-semibold">Public</span>{" "}
            or <span className="font-semibold">Confidential</span>.
          </p>

          <div className="flex flex-wrap gap-2">
            <button
              type="submit"
              onClick={() => setSubmitMode("draft")}
              disabled={disabled}
              className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting && submitMode === "draft"
                ? "Saving draft…"
                : "Save as draft"}
            </button>
            <button
              type="submit"
              onClick={() => setSubmitMode("publish")}
              disabled={disabled}
              className="inline-flex items-center justify-center rounded-full bg-[#172965] px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-[#111c4c] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting && submitMode === "publish"
                ? "Publishing…"
                : "Publish role"}
            </button>
          </div>
        </section>
      </form>
    </main>
  );
}
