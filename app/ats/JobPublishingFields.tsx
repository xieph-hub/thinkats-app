import React from "react";

export type JobPublishingFormValues = {
  title: string;
  description: string;
  department?: string | null;
  location: string;
  workMode?: string | null;          // UI-only, map to location/tags on server
  employment_type: string;
  seniority?: string | null;
  tags?: string[];                   // skills, etc. (handled in API)
  visibility: "public" | "internal" | "confidential";
  status: "open" | "draft" | "on_hold" | "closed";
};

type Props = {
  defaultValues?: Partial<JobPublishingFormValues>;
};

export function JobPublishingFields({ defaultValues = {} }: Props) {
  return (
    <div className="space-y-6">
      {/* SECTION 1 – BASIC INFO */}
      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
          Basic information
        </h2>
        <p className="mt-1 text-[11px] text-slate-500">
          Title and description of the role candidates will see on the careers
          page.
        </p>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="space-y-1 sm:col-span-2">
            <label className="text-xs font-medium text-slate-800">
              Job title *
            </label>
            <input
              required
              name="title"
              defaultValue={defaultValues.title ?? ""}
              placeholder="Senior Product Manager"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none focus:border-[#172965] focus:ring-1 focus:ring-[#172965]/80"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-800">
              Department / function
            </label>
            <input
              name="department"
              defaultValue={defaultValues.department ?? ""}
              placeholder="Product, Engineering, Sales..."
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none focus:border-[#172965] focus:ring-1 focus:ring-[#172965]/80"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-800">
              Location *
            </label>
            <input
              required
              name="location"
              defaultValue={defaultValues.location ?? ""}
              placeholder="Lagos, Nigeria"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none focus:border-[#172965] focus:ring-1 focus:ring-[#172965]/80"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-800">
              Work mode
            </label>
            <select
              name="work_mode"
              defaultValue={defaultValues.workMode ?? ""}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-[#172965] focus:ring-1 focus:ring-[#172965]/80"
            >
              <option value="">Select work mode</option>
              <option value="remote">Remote</option>
              <option value="hybrid">Hybrid</option>
              <option value="onsite">On-site</option>
              <option value="flexible">Flexible</option>
            </select>
            <p className="text-[10px] text-slate-500">
              On the public page, this shows as “Remote / Hybrid / On-site”
              next to the job.
            </p>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-800">
              Employment type *
            </label>
            <select
              required
              name="employment_type"
              defaultValue={defaultValues.employment_type ?? ""}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-[#172965] focus:ring-1 focus:ring-[#172965]/80"
            >
              <option value="">Select type</option>
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
              name="seniority"
              defaultValue={defaultValues.seniority ?? ""}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-[#172965] focus:ring-1 focus:ring-[#172965]/80"
            >
              <option value="">Select level</option>
              <option value="entry">Entry level (0–2 yrs)</option>
              <option value="mid">Mid level (3–5 yrs)</option>
              <option value="senior">Senior level (6–10 yrs)</option>
              <option value="lead">Lead / Principal</option>
              <option value="executive">Executive</option>
            </select>
          </div>
        </div>

        <div className="mt-4 space-y-1">
          <label className="text-xs font-medium text-slate-800">
            Full job description *
          </label>
          <textarea
            required
            name="description"
            defaultValue={defaultValues.description ?? ""}
            rows={8}
            placeholder={`Include:
• Overview of the role
• Key responsibilities
• Required qualifications
• Nice-to-have skills
• What the company offers`}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none focus:border-[#172965] focus:ring-1 focus:ring-[#172965]/80"
          />
        </div>
      </section>

      {/* SECTION 2 – REQUIREMENTS & SKILLS */}
      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
          Requirements & skills
        </h2>
        <p className="mt-1 text-[11px] text-slate-500">
          Optional, but helps candidates self-select before applying.
        </p>

        <div className="mt-4 space-y-1">
          <label className="text-xs font-medium text-slate-800">
            Skills / keywords
          </label>
          <input
            name="tags_raw"
            defaultValue={
              Array.isArray(defaultValues.tags)
                ? defaultValues.tags.join(", ")
                : ""
            }
            placeholder="E.g. Product discovery, Stakeholder management, SQL, Figma"
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none focus:border-[#172965] focus:ring-1 focus:ring-[#172965]/80"
          />
          <p className="text-[10px] text-slate-500">
            Comma-separated list. Your API can parse this into the{" "}
            <code className="rounded bg-slate-100 px-1 text-[10px]">
              tags[]
            </code>{" "}
            column.
          </p>
        </div>
      </section>

      {/* SECTION 3 – VISIBILITY & STATUS */}
      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
          Visibility & status
        </h2>
        <p className="mt-1 text-[11px] text-slate-500">
          Control who can see this role and whether it&apos;s live on the public
          jobs page.
        </p>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-800">
              Visibility *
            </label>
            <select
              required
              name="visibility"
              defaultValue={defaultValues.visibility ?? "public"}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-[#172965] focus:ring-1 focus:ring-[#172965]/80"
            >
              <option value="public">Public – show on careers page</option>
              <option value="internal">
                Internal only – hide from public site
              </option>
              <option value="confidential">
                Confidential – anonymise client on public site
              </option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-800">
              Job status *
            </label>
            <select
              required
              name="status"
              defaultValue={defaultValues.status ?? "open"}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-[#172965] focus:ring-1 focus:ring-[#172965]/80"
            >
              <option value="open">Open – actively accepting applications</option>
              <option value="draft">Draft – not visible externally</option>
              <option value="on_hold">On hold – pause pipeline</option>
              <option value="closed">Closed – not accepting applications</option>
            </select>
          </div>
        </div>
      </section>
    </div>
  );
}
