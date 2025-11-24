// components/ats/JobPublishingForm.tsx
import React from "react";

export function JobPublishingForm() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <header className="border-b border-slate-100 pb-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
          Job publishing
        </p>
        <h1 className="mt-1 text-2xl font-semibold text-slate-900">
          Post a new role
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-600">
          Create a candidate-facing job that flows into your ATS pipeline. Title,
          location, work mode, employment type and tags feed directly into the
          public jobs page on resourcin.com.
        </p>
      </header>

      <form
        action="/api/jobs"
        method="POST"
        className="mt-6 space-y-8 text-sm text-slate-800"
      >
        {/* SECTION 1 – BASIC INFORMATION */}
        <section>
          <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
            1. Basic information
          </h2>
          <p className="mt-1 text-[11px] text-slate-500">
            These fields power the headline and description on the candidate
            job page.
          </p>

          <div className="mt-3 space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-800">
                Job title <span className="text-red-500">*</span>
              </label>
              <input
                name="title"
                required
                placeholder="e.g. Senior Human Resources Manager"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none focus:border-[#172965] focus:ring-1 focus:ring-[#172965]/80"
              />
              <p className="text-[11px] text-slate-500">
                This shows as the primary title on the public job card.
              </p>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-800">
                Short summary (optional)
              </label>
              <input
                name="short_description"
                placeholder="One–line teaser for candidates (not yet visible on cards, but stored for future use)"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none focus:border-[#172965] focus:ring-1 focus:ring-[#172965]/80"
              />
              <p className="text-[11px] text-slate-500">
                Keep it under 150 characters. Eventually this can appear on the
                jobs listing card.
              </p>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-800">
                Full job description <span className="text-red-500">*</span>
              </label>
              <textarea
                name="description"
                required
                rows={8}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none focus:border-[#172965] focus:ring-1 focus:ring-[#172965]/80"
                placeholder={[
                  "Use clear sections like:",
                  "",
                  "About the role",
                  "Key responsibilities",
                  "Requirements",
                  "Nice-to-have",
                  "What the company offers",
                ].join("\n")}
              />
              <p className="text-[11px] text-slate-500">
                This is rendered on the public job details page under “Overview
                of the role”, “Key responsibilities” and “Requirements”.
              </p>
            </div>
          </div>
        </section>

        {/* SECTION 2 – JOB CLASSIFICATION */}
        <section>
          <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
            2. Job classification
          </h2>
          <p className="mt-1 text-[11px] text-slate-500">
            Define how this role appears in your internal views and on the
            public page.
          </p>

          <div className="mt-3 grid gap-4 md:grid-cols-2">
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-800">
                Function / Department
              </label>
              <input
                name="department"
                placeholder="e.g. People & Culture, Engineering, Sales"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none focus:border-[#172965] focus:ring-1 focus:ring-[#172965]/80"
              />
              <p className="text-[11px] text-slate-500">
                Appears as the subtle line under the job title on the public
                jobs page.
              </p>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-800">
                Location <span className="text-red-500">*</span>
              </label>
              <input
                name="location"
                required
                placeholder="e.g. Lagos, Nigeria (Remote–friendly)"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none focus:border-[#172965] focus:ring-1 focus:ring-[#172965]/80"
              />
              <p className="text-[11px] text-slate-500">
                Add keywords like “Remote”, “Hybrid” or “On–site” – the public
                jobs page uses this to compute a Work mode pill.
              </p>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-800">
                Work mode (for internal reporting)
              </label>
              <select
                name="work_mode"
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-[#172965] focus:ring-1 focus:ring-[#172965]/80"
              >
                <option value="">Not specified</option>
                <option value="onsite">On-site</option>
                <option value="remote">Remote</option>
                <option value="hybrid">Hybrid</option>
                <option value="flexible">Flexible</option>
              </select>
              <p className="text-[11px] text-slate-500">
                For now this is primarily for your ATS views; public work mode
                is still derived from the location and tags.
              </p>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-800">
                Employment type <span className="text-red-500">*</span>
              </label>
              <select
                name="employment_type"
                required
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-[#172965] focus:ring-1 focus:ring-[#172965]/80"
              >
                <option value="">Select one</option>
                <option value="full-time">Full-time</option>
                <option value="part-time">Part-time</option>
                <option value="contract">Contract</option>
                <option value="internship">Internship</option>
              </select>
              <p className="text-[11px] text-slate-500">
                Shown with the briefcase icon on the public jobs page.
              </p>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-800">
                Seniority
              </label>
              <select
                name="seniority"
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-[#172965] focus:ring-1 focus:ring-[#172965]/80"
              >
                <option value="">Not specified</option>
                <option value="entry">Entry level</option>
                <option value="mid">Mid level</option>
                <option value="senior">Senior</option>
                <option value="lead">Lead / Principal</option>
                <option value="executive">Executive</option>
              </select>
              <p className="text-[11px] text-slate-500">
                Appears as a small pill on the card (e.g. SENIOR, LEAD).
              </p>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-800">
                Experience range (years)
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  name="experience_min_years"
                  min={0}
                  placeholder="Min"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none focus:border-[#172965] focus:ring-1 focus:ring-[#172965]/80"
                />
                <input
                  type="number"
                  name="experience_max_years"
                  min={0}
                  placeholder="Max"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none focus:border-[#172965] focus:ring-1 focus:ring-[#172965]/80"
                />
              </div>
              <p className="text-[11px] text-slate-500">
                For internal reporting and future filtering.
              </p>
            </div>
          </div>
        </section>

        {/* SECTION 3 – COMPENSATION (optional) */}
        <section>
          <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
            3. Compensation (optional)
          </h2>
          <p className="mt-1 text-[11px] text-slate-500">
            Share salary ranges internally, and optionally on the public job
            page.
          </p>

          <div className="mt-3 grid gap-4 md:grid-cols-[minmax(0,1.4fr)_minmax(0,0.6fr)]">
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-800">
                Salary range
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  name="salary_min"
                  min={0}
                  placeholder="Min (e.g. 3000000)"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none focus:border-[#172965] focus:ring-1 focus:ring-[#172965]/80"
                />
                <input
                  type="number"
                  name="salary_max"
                  min={0}
                  placeholder="Max (e.g. 5000000)"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none focus:border-[#172965] focus:ring-1 focus:ring-[#172965]/80"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-800">
                Currency
              </label>
              <select
                name="salary_currency"
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-[#172965] focus:ring-1 focus:ring-[#172965]/80"
              >
                <option value="">Default (NGN)</option>
                <option value="NGN">NGN – Nigerian Naira</option>
                <option value="USD">USD – US Dollar</option>
                <option value="GBP">GBP – Pound Sterling</option>
                <option value="EUR">EUR – Euro</option>
              </select>
              <div className="mt-2 flex items-center gap-2">
                <input
                  id="show_salary_public"
                  type="checkbox"
                  name="show_salary_public"
                  className="h-3 w-3 rounded border-slate-300 text-[#172965] focus:ring-[#172965]"
                />
                <label
                  htmlFor="show_salary_public"
                  className="text-[11px] text-slate-600"
                >
                  Show salary range on the public job page
                </label>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 4 – REQUIREMENTS & SKILLS */}
        <section>
          <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
            4. Requirements & skills
          </h2>
          <p className="mt-1 text-[11px] text-slate-500">
            Skills power the small tags on the candidate-facing job card.
          </p>

          <div className="mt-3 space-y-4">
