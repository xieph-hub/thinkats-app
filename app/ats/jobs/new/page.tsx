import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getResourcinTenant } from "@/lib/tenant";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "ThinkATS | Create job",
  description:
    "Create a new role, attach it to a client and control how it appears across your ATS and career sites.",
};

export default async function NewJobPage() {
  const tenant = await getResourcinTenant();
  if (!tenant) notFound();

  const clientCompanies = await prisma.clientCompany.findMany({
    where: { tenantId: tenant.id },
    orderBy: { name: "asc" },
  });

  const hasClients = clientCompanies.length > 0;

  return (
    <div className="flex h-full flex-1 flex-col">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white px-5 py-4">
        <div className="mb-2 flex items-center gap-2 text-xs text-slate-500">
          <Link href="/ats/jobs" className="hover:underline">
            ATS
          </Link>
          <span>/</span>
          <Link href="/ats/jobs" className="hover:underline">
            Jobs
          </Link>
          <span>/</span>
          <span className="font-medium text-slate-700">New job</span>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-base font-semibold text-slate-900">
              Create new job
            </h1>
            <p className="mt-0.5 text-[11px] text-slate-500">
              Set up a new mandate, attach it to a client and decide whether it
              goes live on your career site or stays internal.
            </p>
          </div>

          <div className="flex flex-col items-end text-right text-[11px] text-slate-500">
            <span className="font-medium text-slate-800">
              {tenant.name}
            </span>
            <span className="text-[10px] text-slate-400">
              New role · ATS workspace
            </span>
            <Link
              href="/ats/jobs"
              className="mt-2 inline-flex h-8 items-center rounded-full border border-slate-200 bg-white px-4 text-[11px] font-semibold text-slate-700 hover:bg-slate-50"
            >
              Cancel &amp; go back
            </Link>
          </div>
        </div>
      </header>

      {/* Main form */}
      <main className="flex flex-1 flex-col bg-slate-50 px-5 py-4">
        <form
          action="/api/ats/jobs"
          method="POST"
          encType="multipart/form-data"
          className="grid gap-4 lg:grid-cols-[minmax(0,2.2fr)_minmax(0,1.4fr)]"
        >
          {/* Left column – role definition */}
          <div className="space-y-4">
            {/* Role basics & client */}
            <section className="rounded-2xl border border-slate-200 bg-white p-4 text-xs text-slate-700">
              <div className="mb-3 flex items-center justify-between gap-2">
                <h2 className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  Role basics
                </h2>
                <span className="text-[10px] text-slate-400">
                  Title is required · everything else can be refined later
                </span>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="mb-1 block text-[11px] font-medium text-slate-600">
                    Job title <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="title"
                    required
                    placeholder="e.g. Head of Growth, Senior Product Manager"
                    className="h-9 w-full rounded-xl border border-slate-200 bg-white px-3 text-[11px] text-slate-900 placeholder:text-slate-400"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-[11px] font-medium text-slate-600">
                    Client company
                  </label>
                  <select
                    name="clientCompanyId"
                    className="h-9 w-full rounded-xl border border-slate-200 bg-white px-3 text-[11px] text-slate-900"
                    defaultValue=""
                  >
                    <option value="">
                      {hasClients
                        ? "Unassigned / internal role"
                        : "No clients yet – internal role"}
                    </option>
                    {clientCompanies.map((client) => (
                      <option key={client.id} value={client.id}>
                        {client.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-[11px] font-medium text-slate-600">
                    Department / function
                  </label>
                  <input
                    type="text"
                    name="department"
                    placeholder="e.g. Product, Engineering, Finance"
                    className="h-9 w-full rounded-xl border border-slate-200 bg-white px-3 text-[11px] text-slate-900 placeholder:text-slate-400"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-[11px] font-medium text-slate-600">
                    Employment type
                  </label>
                  <select
                    name="employmentType"
                    className="h-9 w-full rounded-xl border border-slate-200 bg-white px-3 text-[11px] text-slate-900"
                    defaultValue=""
                  >
                    <option value="">Not specified</option>
                    <option value="Full-time">Full-time</option>
                    <option value="Part-time">Part-time</option>
                    <option value="Contract">Contract</option>
                    <option value="Temporary">Temporary</option>
                    <option value="Internship">Internship</option>
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-[11px] font-medium text-slate-600">
                    Experience level
                  </label>
                  <select
                    name="experienceLevel"
                    className="h-9 w-full rounded-xl border border-slate-200 bg-white px-3 text-[11px] text-slate-900"
                    defaultValue=""
                  >
                    <option value="">Not specified</option>
                    <option value="Junior">Junior</option>
                    <option value="Mid-level">Mid-level</option>
                    <option value="Senior">Senior</option>
                    <option value="Lead">Lead</option>
                    <option value="Director+">Director+</option>
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-[11px] font-medium text-slate-600">
                    Location
                  </label>
                  <input
                    type="text"
                    name="location"
                    placeholder="e.g. Lagos, Nigeria · London, UK"
                    className="h-9 w-full rounded-xl border border-slate-200 bg-white px-3 text-[11px] text-slate-900 placeholder:text-slate-400"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-[11px] font-medium text-slate-600">
                    Work mode
                  </label>
                  <select
                    name="workMode"
                    className="h-9 w-full rounded-xl border border-slate-200 bg-white px-3 text-[11px] text-slate-900"
                    defaultValue=""
                  >
                    <option value="">Not specified</option>
                    <option value="Onsite">Onsite</option>
                    <option value="Hybrid">Hybrid</option>
                    <option value="Remote">Remote</option>
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-[11px] font-medium text-slate-600">
                    Min. years of experience
                  </label>
                  <input
                    type="number"
                    name="yearsExperienceMin"
                    min={0}
                    className="h-9 w-full rounded-xl border border-slate-200 bg-white px-3 text-[11px] text-slate-900"
                    placeholder="e.g. 3"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-[11px] font-medium text-slate-600">
                    Max. years of experience
                  </label>
                  <input
                    type="number"
                    name="yearsExperienceMax"
                    min={0}
                    className="h-9 w-full rounded-xl border border-slate-200 bg-white px-3 text-[11px] text-slate-900"
                    placeholder="e.g. 7"
                  />
                </div>
              </div>
            </section>

            {/* Narrative & requirements */}
            <section className="rounded-2xl border border-slate-200 bg-white p-4 text-xs text-slate-700">
              <div className="mb-3 flex items-center justify-between gap-2">
                <h2 className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  Description &amp; requirements
                </h2>
                <span className="text-[10px] text-slate-400">
                  Use clear headings and bullet points – we&apos;ll render this
                  on the public job page.
                </span>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="mb-1 block text-[11px] font-medium text-slate-600">
                    Short summary
                  </label>
                  <textarea
                    name="shortDescription"
                    rows={2}
                    placeholder="One or two lines that capture the essence of the role."
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-[11px] text-slate-900 placeholder:text-slate-400"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-[11px] font-medium text-slate-600">
                    Role overview
                  </label>
                  <textarea
                    name="overview"
                    rows={4}
                    placeholder="High-level narrative: what this team does, where this role fits, what success looks like in 12–18 months."
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-[11px] text-slate-900 placeholder:text-slate-400"
                  />
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-[11px] font-medium text-slate-600">
                      Key responsibilities
                    </label>
                    <textarea
                      name="responsibilities"
                      rows={4}
                      placeholder="- Own X\n- Lead Y\n- Partner with Z"
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-[11px] text-slate-900 placeholder:text-slate-400"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-[11px] font-medium text-slate-600">
                      Requirements / experience
                    </label>
                    <textarea
                      name="requirements"
                      rows={4}
                      placeholder="- X+ years in...\n- Strong experience with...\n- Comfortable working in..."
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-[11px] text-slate-900 placeholder:text-slate-400"
                    />
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-[11px] font-medium text-slate-600">
                      Benefits &amp; perks
                    </label>
                    <textarea
                      name="benefits"
                      rows={3}
                      placeholder="- Competitive salary\n- Health insurance\n- Hybrid work..."
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-[11px] text-slate-900 placeholder:text-slate-400"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-[11px] font-medium text-slate-600">
                      About the client
                    </label>
                    <textarea
                      name="aboutClient"
                      rows={3}
                      placeholder="One paragraph describing the company, market and mission."
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-[11px] text-slate-900 placeholder:text-slate-400"
                    />
                  </div>
                </div>
              </div>
            </section>

            {/* Skills, tags & education */}
            <section className="rounded-2xl border border-slate-200 bg-white p-4 text-xs text-slate-700">
              <div className="mb-3 flex items-center justify-between gap-2">
                <h2 className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  Skills, tags &amp; education
                </h2>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-[11px] font-medium text-slate-600">
                    Tags
                  </label>
                  <textarea
                    name="tags"
                    rows={3}
                    placeholder="Comma or line separated labels. e.g. fintech, Nigeria, remote, exec-search"
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-[11px] text-slate-900 placeholder:text-slate-400"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[11px] font-medium text-slate-600">
                    Required skills
                  </label>
                  <textarea
                    name="requiredSkills"
                    rows={3}
                    placeholder="Comma or line separated. e.g. SQL, stakeholder management, B2B SaaS..."
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-[11px] text-slate-900 placeholder:text-slate-400"
                  />
                </div>
              </div>

              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-[11px] font-medium text-slate-600">
                    Education (level)
                  </label>
                  <input
                    type="text"
                    name="educationRequired"
                    placeholder="e.g. Bachelor&apos;s, Master&apos;s, not required"
                    className="h-9 w-full rounded-xl border border-slate-200 bg-white px-3 text-[11px] text-slate-900 placeholder:text-slate-400"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[11px] font-medium text-slate-600">
                    Field of study
                  </label>
                  <input
                    type="text"
                    name="educationField"
                    placeholder="e.g. Computer Science, Business, any relevant field"
                    className="h-9 w-full rounded-xl border border-slate-200 bg-white px-3 text-[11px] text-slate-900 placeholder:text-slate-400"
                  />
                </div>
              </div>
            </section>
          </div>

          {/* Right column – compensation & visibility */}
          <div className="space-y-4">
            {/* Compensation */}
            <section className="rounded-2xl border border-slate-200 bg-white p-4 text-xs text-slate-700">
              <div className="mb-3 flex items-center justify-between gap-2">
                <h2 className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  Compensation
                </h2>
                <span className="text-[10px] text-slate-400">
                  Optional but useful for candidate trust
                </span>
              </div>

              <div className="space-y-3">
                <div className="grid grid-cols-[0.9fr_1.1fr] gap-3">
                  <div>
                    <label className="mb-1 block text-[11px] font-medium text-slate-600">
                      Currency
                    </label>
                    <select
                      name="salaryCurrency"
                      defaultValue="NGN"
                      className="h-9 w-full rounded-xl border border-slate-200 bg-white px-3 text-[11px] text-slate-900"
                    >
                      <option value="NGN">NGN</option>
                      <option value="USD">USD</option>
                      <option value="KES">KES</option>
                      <option value="ZAR">ZAR</option>
                      <option value="GBP">GBP</option>
                      <option value="EUR">EUR</option>
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="mb-1 block text-[11px] font-medium text-slate-600">
                        Salary min
                      </label>
                      <input
                        type="text"
                        name="salaryMin"
                        inputMode="numeric"
                        placeholder="e.g. 10,000,000"
                        className="h-9 w-full rounded-xl border border-slate-200 bg-white px-3 text-[11px] text-slate-900 placeholder:text-slate-400"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-[11px] font-medium text-slate-600">
                        Salary max
                      </label>
                      <input
                        type="text"
                        name="salaryMax"
                        inputMode="numeric"
                        placeholder="e.g. 15,000,000"
                        className="h-9 w-full rounded-xl border border-slate-200 bg-white px-3 text-[11px] text-slate-900 placeholder:text-slate-400"
                      />
                    </div>
                  </div>
                </div>

                <label className="mt-1 inline-flex items-center gap-2 text-[11px] text-slate-600">
                  <input
                    type="checkbox"
                    name="salaryVisible"
                    className="h-3.5 w-3.5 rounded border-slate-300 text-slate-900 focus:ring-slate-500"
                  />
                  <span>
                    Show this salary range on public job pages and career
                    sites.
                  </span>
                </label>
              </div>
            </section>

            {/* Visibility & publishing */}
            <section className="rounded-2xl border border-slate-200 bg-white p-4 text-xs text-slate-700">
              <div className="mb-3 flex items-center justify-between gap-2">
                <h2 className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  Visibility &amp; publishing
                </h2>
              </div>

              <div className="space-y-4">
                {/* Status */}
                <div>
                  <div className="mb-1 text-[11px] font-medium text-slate-600">
                    Status
                  </div>
                  <div className="space-y-1.5">
                    <label className="flex items-start gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                      <input
                        type="radio"
                        name="status"
                        value="draft"
                        defaultChecked
                        className="mt-0.5 h-3.5 w-3.5 border-slate-300 text-slate-900 focus:ring-slate-500"
                      />
                      <div>
                        <div className="text-[11px] font-semibold text-slate-800">
                          Draft
                        </div>
                        <div className="text-[10px] text-slate-500">
                          Save the role for internal review. Not visible on
                          career sites yet.
                        </div>
                      </div>
                    </label>

                    <label className="flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2">
                      <input
                        type="radio"
                        name="status"
                        value="open"
                        className="mt-0.5 h-3.5 w-3.5 border-emerald-500 text-emerald-700 focus:ring-emerald-500"
                      />
                      <div>
                        <div className="text-[11px] font-semibold text-emerald-800">
                          Open
                        </div>
                        <div className="text-[10px] text-emerald-700/80">
                          Actively hiring. When combined with public visibility,
                          candidates can apply.
                        </div>
                      </div>
                    </label>

                    <label className="flex items-start gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                      <input
                        type="radio"
                        name="status"
                        value="closed"
                        className="mt-0.5 h-3.5 w-3.5 border-slate-300 text-slate-900 focus:ring-slate-500"
                      />
                      <div>
                        <div className="text-[11px] font-semibold text-slate-800">
                          Closed
                        </div>
                        <div className="text-[10px] text-slate-500">
                          Role is no longer active but pipelines and history are
                          kept in the ATS.
                        </div>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Visibility */}
                <div>
                  <div className="mb-1 text-[11px] font-medium text-slate-600">
                    Candidate-facing visibility
                  </div>
                  <div className="space-y-1.5">
                    <label className="flex items-start gap-2 rounded-xl border border-indigo-200 bg-indigo-50 px-3 py-2">
                      <input
                        type="radio"
                        name="visibility"
                        value="public"
                        defaultChecked
                        className="mt-0.5 h-3.5 w-3.5 border-indigo-500 text-indigo-700 focus:ring-indigo-500"
                      />
                      <div>
                        <div className="text-[11px] font-semibold text-indigo-800">
                          Public
                        </div>
                        <div className="text-[10px] text-indigo-700/80">
                          Role appears on your career site (where enabled) and
                          can receive applications.
                        </div>
                      </div>
                    </label>

                    <label className="flex items-start gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                      <input
                        type="radio"
                        name="visibility"
                        value="internal"
                        className="mt-0.5 h-3.5 w-3.5 border-slate-300 text-slate-900 focus:ring-slate-500"
                      />
                      <div>
                        <div className="text-[11px] font-semibold text-slate-800">
                          Internal
                        </div>
                        <div className="text-[10px] text-slate-500">
                          Only visible inside ThinkATS. Useful for stealth or
                          confidential searches.
                        </div>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Optional manual slug */}
                <div>
                  <label className="mb-1 block text-[11px] font-medium text-slate-600">
                    Internal slug (optional)
                  </label>
                  <input
                    type="text"
                    name="slug"
                    placeholder="If left blank, we&apos;ll generate one from the title."
                    className="h-9 w-full rounded-xl border border-slate-200 bg-white px-3 text-[11px] text-slate-900 placeholder:text-slate-400"
                  />
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
                <p className="max-w-xs text-[10px] text-slate-500">
                  You can always change status, visibility and copy later from
                  the job&apos;s ATS view.
                </p>
                <button
                  type="submit"
                  className="inline-flex h-9 items-center rounded-full bg-slate-900 px-5 text-[11px] font-semibold text-white hover:bg-slate-800"
                >
                  Create job
                </button>
              </div>
            </section>
          </div>
        </form>
      </main>
    </div>
  );
}
