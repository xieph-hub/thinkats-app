// app/ats/jobs/new/NewJobForm.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type NewJobFormProps = {
  tenantId: string;
};

type Intent = "draft" | "publish";

export default function NewJobForm({ tenantId }: NewJobFormProps) {
  const router = useRouter();

  // SECTION 1: BASIC INFORMATION
  const [title, setTitle] = useState("");
  const [shortDescription, setShortDescription] = useState("");
  const [description, setDescription] = useState("");

  // SECTION 2: JOB CLASSIFICATION
  const [department, setDepartment] = useState("");
  const [location, setLocation] = useState("");
  const [locationType, setLocationType] = useState("");
  const [employmentType, setEmploymentType] = useState("full-time");
  const [experienceLevel, setExperienceLevel] = useState("");
  const [yearsMin, setYearsMin] = useState("");
  const [yearsMax, setYearsMax] = useState("");

  // SECTION 3: COMPENSATION
  const [salaryMin, setSalaryMin] = useState("");
  const [salaryMax, setSalaryMax] = useState("");
  const [salaryCurrency, setSalaryCurrency] = useState("NGN");
  const [salaryVisible, setSalaryVisible] = useState(false);

  // SECTION 4: REQUIREMENTS & SKILLS
  const [requiredSkills, setRequiredSkills] = useState("");
  const [educationRequired, setEducationRequired] = useState("");
  const [educationField, setEducationField] = useState("");

  // SECTION 5: VISIBILITY & SETTINGS
  const [internalOnly, setInternalOnly] = useState(false);
  const [confidential, setConfidential] = useState(false);

  // UX state
  const [currentIntent, setCurrentIntent] = useState<Intent>("publish");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasSalary =
    (salaryMin && salaryMin.trim() !== "") ||
    (salaryMax && salaryMax.trim() !== "");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!title.trim() || !description.trim() || !location.trim()) {
      setError("Job title, location and full description are required.");
      return;
    }

    if (!employmentType) {
      setError("Employment type is required.");
      return;
    }

    if (hasSalary && !salaryCurrency) {
      setError("Please select a currency for the salary range.");
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch("/api/ats/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenantId,
          intent: currentIntent,
          // Section 1
          title: title.trim(),
          shortDescription: shortDescription.trim() || null,
          description: description.trim(),
          // Section 2
          department: department.trim() || null,
          location: location.trim(),
          locationType: locationType || null,
          employmentType,
          experienceLevel: experienceLevel || null,
          yearsExperienceMin: yearsMin || null,
          yearsExperienceMax: yearsMax || null,
          // Section 3
          salaryMin: salaryMin || null,
          salaryMax: salaryMax || null,
          salaryCurrency: hasSalary ? salaryCurrency : null,
          salaryVisible: hasSalary ? salaryVisible : false,
          // Section 4
          requiredSkills: requiredSkills,
          educationRequired: educationRequired || null,
          educationField: educationField || null,
          // Section 5
          internalOnly,
          confidential,
        }),
      });

      if (!res.ok) {
        const text = await res.text();
        console.error("Create job failed:", text);
        setError("Could not create job. Please try again.");
        return;
      }

      const data = (await res.json()) as {
        jobId: string;
        slug: string | null;
      };

      // Redirect to ATS job pipeline; from there you can add a "View public posting" button.
      router.push(`/ats/jobs/${encodeURIComponent(data.jobId)}`);
    } catch (err) {
      console.error("Unexpected error creating job", err);
      setError("Unexpected error creating job. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
    >
      {/* Error banner */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[11px] text-red-900">
          {error}
        </div>
      )}

      {/* SECTION 1: BASIC INFORMATION */}
      <section className="space-y-3 border-b border-slate-100 pb-4">
        <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
          1 · Basic information
        </h2>

        <div className="space-y-1">
          <label className="text-xs font-medium text-slate-800">
            Job title <span className="text-red-500">*</span>
          </label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder='e.g. "Senior Software Engineer"'
            required
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none focus:border-[#172965] focus:ring-1 focus:ring-[#172965]/80"
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium text-slate-800">
            Short description (optional)
          </label>
          <input
            value={shortDescription}
            onChange={(e) => setShortDescription(e.target.value)}
            maxLength={150}
            placeholder="One-line summary shown in job cards (max 150 characters)"
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none focus:border-[#172965] focus:ring-1 focus:ring-[#172965]/80"
          />
          <p className="text-[11px] text-slate-500">
            {shortDescription.length}/150 characters
          </p>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium text-slate-800">
            Full job description <span className="text-red-500">*</span>
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={10}
            minLength={50}
            placeholder={`Include:
• About the role
• Key responsibilities
• Required qualifications
• Nice-to-have skills
• What the company offers`}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none focus:border-[#172965] focus:ring-1 focus:ring-[#172965]/80"
          />
          <p className="text-[11px] text-slate-500">
            Aim for a detailed, scannable description. Minimum 50 characters.
          </p>
        </div>
      </section>

      {/* SECTION 2: JOB CLASSIFICATION */}
      <section className="space-y-3 border-b border-slate-100 pb-4">
        <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
          2 · Job classification
        </h2>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-800">
              Function / team (optional)
            </label>
            <input
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              placeholder="e.g. Engineering, Product, Sales, Marketing"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none focus:border-[#172965] focus:ring-1 focus:ring-[#172965]/80"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-800">
              Location <span className="text-red-500">*</span>
            </label>
            <input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder='e.g. "Lagos", "Abuja", "Remote", "London, UK"'
              required
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none focus:border-[#172965] focus:ring-1 focus:ring-[#172965]/80"
            />
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-800">
              Location type (optional)
            </label>
            <select
              value={locationType}
              onChange={(e) => setLocationType(e.target.value)}
              className="h-9 w-full rounded-lg border border-slate-200 bg-white px-2 text-xs text-slate-900 focus:border-[#172965] focus:outline-none focus:ring-1 focus:ring-[#172965]/60"
            >
              <option value="">Not specified</option>
              <option value="onsite">On-site</option>
              <option value="remote">Remote</option>
              <option value="hybrid">Hybrid</option>
              <option value="flexible">Flexible</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-800">
              Employment type <span className="text-red-500">*</span>
            </label>
            <select
              value={employmentType}
              onChange={(e) => setEmploymentType(e.target.value)}
              required
              className="h-9 w-full rounded-lg border border-slate-200 bg-white px-2 text-xs text-slate-900 focus:border-[#172965] focus:outline-none focus:ring-1 focus:ring-[#172965]/60"
            >
              <option value="full-time">Full-time</option>
              <option value="part-time">Part-time</option>
              <option value="contract">Contract</option>
              <option value="internship">Internship</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-800">
              Experience level (optional)
            </label>
            <select
              value={experienceLevel}
              onChange={(e) => setExperienceLevel(e.target.value)}
              className="h-9 w-full rounded-lg border border-slate-200 bg-white px-2 text-xs text-slate-900 focus:border-[#172965] focus:outline-none focus:ring-1 focus:ring-[#172965]/60"
            >
              <option value="">Not specified</option>
              <option value="entry">Entry level (0–2 yrs)</option>
              <option value="mid">Mid level (3–5 yrs)</option>
              <option value="senior">Senior (6–10 yrs)</option>
              <option value="lead">Lead / Principal (10+ yrs)</option>
              <option value="executive">Executive (C-level, VP)</option>
            </select>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-800">
              Minimum years of experience (optional)
            </label>
            <input
              type="number"
              min={0}
              value={yearsMin}
              onChange={(e) => setYearsMin(e.target.value)}
              placeholder="e.g. 3"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none focus:border-[#172965] focus:ring-1 focus:ring-[#172965]/80"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-800">
              Maximum years of experience (optional)
            </label>
            <input
              type="number"
              min={0}
              value={yearsMax}
              onChange={(e) => setYearsMax(e.target.value)}
              placeholder="e.g. 5"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none focus:border-[#172965] focus:ring-1 focus:ring-[#172965]/80"
            />
          </div>
        </div>
      </section>

      {/* SECTION 3: COMPENSATION */}
      <section className="space-y-3 border-b border-slate-100 pb-4">
        <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
          3 · Compensation
        </h2>

        <div className="grid gap-3 sm:grid-cols-3">
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-800">
              Min salary (optional)
            </label>
            <input
              type="number"
              min={0}
              value={salaryMin}
              onChange={(e) => setSalaryMin(e.target.value)}
              placeholder="₦3,000,000"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none focus:border-[#172965] focus:ring-1 focus:ring-[#172965]/80"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-800">
              Max salary (optional)
            </label>
            <input
              type="number"
              min={0}
              value={salaryMax}
              onChange={(e) => setSalaryMax(e.target.value)}
              placeholder="₦5,000,000"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none focus:border-[#172965] focus:ring-1 focus:ring-[#172965]/80"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-800">
              Currency {hasSalary && <span className="text-red-500">*</span>}
            </label>
            <select
              value={salaryCurrency}
              onChange={(e) => setSalaryCurrency(e.target.value)}
              className="h-9 w-full rounded-lg border border-slate-200 bg-white px-2 text-xs text-slate-900 focus:border-[#172965] focus:outline-none focus:ring-1 focus:ring-[#172965]/60"
            >
              <option value="NGN">NGN (₦)</option>
              <option value="USD">USD ($)</option>
              <option value="GBP">GBP (£)</option>
              <option value="EUR">EUR (€)</option>
            </select>
          </div>
        </div>

        <label className="flex items-center gap-2 text-[11px] text-slate-700">
          <input
            type="checkbox"
            checked={salaryVisible}
            onChange={(e) => setSalaryVisible(e.target.checked)}
            className="h-3 w-3 border-slate-300 text-[#172965] focus:ring-[#172965]"
          />
          <span>Show salary range publicly on the careers site</span>
        </label>
        <p className="text-[11px] text-slate-500">
          Internal users will always see compensation details.
        </p>
      </section>

      {/* SECTION 4: REQUIREMENTS & SKILLS */}
      <section className="space-y-3 border-b border-slate-100 pb-4">
        <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
          4 · Requirements &amp; skills
        </h2>

        <div className="space-y-1">
          <label className="text-xs font-medium text-slate-800">
            Required skills (optional)
          </label>
          <textarea
            value={requiredSkills}
            onChange={(e) => setRequiredSkills(e.target.value)}
            rows={2}
            placeholder="Comma-separated: JavaScript, React, Project Management, Excel, Communication"
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none focus:border-[#172965] focus:ring-1 focus:ring-[#172965]/80"
          />
          <p className="text-[11px] text-slate-500">
            Use comma-separated values. We&apos;ll store these as skill tags in
            the ATS (max ~20 recommended).
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-800">
              Education required (optional)
            </label>
            <select
              value={educationRequired}
              onChange={(e) => setEducationRequired(e.target.value)}
              className="h-9 w-full rounded-lg border border-slate-200 bg-white px-2 text-xs text-slate-900 focus:border-[#172965] focus:outline-none focus:ring-1 focus:ring-[#172965]/60"
            >
              <option value="">Not specified</option>
              <option value="high_school">High School Diploma</option>
              <option value="bachelors">Bachelor&apos;s Degree</option>
              <option value="masters">Master&apos;s Degree</option>
              <option value="phd">PhD</option>
              <option value="professional_cert">
                Professional certification
              </option>
              <option value="no_formal">No formal education required</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-800">
              Field of study (optional)
            </label>
            <input
              value={educationField}
              onChange={(e) => setEducationField(e.target.value)}
              placeholder='e.g. "Bachelor&apos;s in Computer Science"'
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none focus:border-[#172965] focus:ring-1 focus:ring-[#172965]/80"
            />
          </div>
        </div>
      </section>

      {/* SECTION 5: VISIBILITY & SETTINGS */}
      <section className="space-y-3">
        <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
          5 · Visibility &amp; settings
        </h2>

        <div className="space-y-2 text-[11px] text-slate-700">
          <label className="flex items-start gap-2">
            <input
              type="checkbox"
              checked={internalOnly}
              onChange={(e) => setInternalOnly(e.target.checked)}
              className="mt-0.5 h-3 w-3 border-slate-300 text-[#172965] focus:ring-[#172965]"
            />
            <span>
              Internal only – only visible to current employees and invited
              candidates.
            </span>
          </label>
          <label className="flex items-start gap-2">
            <input
              type="checkbox"
              checked={confidential}
              onChange={(e) => setConfidential(e.target.checked)}
              className="mt-0.5 h-3 w-3 border-slate-300 text-[#172965] focus:ring-[#172965]"
            />
            <span>
              Confidential – hide the company name on the public posting (useful
              for replacements or stealth hiring).
            </span>
          </label>
        </div>
      </section>

      {/* ACTION BUTTONS */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
        <div className="flex flex-wrap gap-2">
          <button
            type="submit"
            onClick={() => setCurrentIntent("draft")}
            disabled={submitting}
            className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting && currentIntent === "draft"
              ? "Saving..."
              : "Save as draft"}
          </button>
          <button
            type="submit"
            onClick={() => setCurrentIntent("publish")}
            disabled={submitting}
            className="inline-flex items-center justify-center rounded-full bg-[#172965] px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#111c4c] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting && currentIntent === "publish"
              ? "Publishing..."
              : "Publish job"}
          </button>
        </div>

        <button
          type="button"
          onClick={() => router.push("/ats/jobs")}
          className="text-[11px] font-medium text-slate-500 hover:text-slate-800"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
