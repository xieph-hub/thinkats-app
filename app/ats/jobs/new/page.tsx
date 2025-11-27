// app/ats/jobs/new/page.tsx
import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getResourcinTenant } from "@/lib/tenant";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Create role | ThinkATS | Resourcin",
  description:
    "Create a new mandate in ThinkATS, assign an owner and publish it to your careers page.",
};

function classNames(...values: (string | false | null | undefined)[]) {
  return values.filter(Boolean).join(" ");
}

export default async function NewJobPage() {
  const tenant = await getResourcinTenant();

  if (!tenant) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-10">
        <h1 className="text-xl font-semibold text-slate-900">
          Create role
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          No default tenant configured. Please ensure{" "}
          <code className="rounded bg-slate-100 px-1 py-0.5 text-[11px]">
            RESOURCIN_TENANT_ID
          </code>{" "}
          or{" "}
          <code className="rounded bg-slate-100 px-1 py-0.5 text-[11px]">
            RESOURCIN_TENANT_SLUG
          </code>{" "}
          are set.
        </p>
      </div>
    );
  }

  const [clientCompanies, users] = await Promise.all([
    prisma.clientCompany.findMany({
      where: { tenantId: tenant.id },
      orderBy: { name: "asc" },
    }),
    prisma.user.findMany({
      // Your User model doesn't have `name`, so we sort by email
      orderBy: { email: "asc" },
      select: {
        id: true,
        email: true,
      },
    }),
  ]);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 lg:px-0">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="mb-1">
            <Link
              href="/ats/jobs"
              className="inline-flex items-center text-[11px] font-medium text-slate-500 hover:text-slate-800"
            >
              <span className="mr-1.5">←</span>
              Back to roles
            </Link>
          </div>
          <h1 className="text-2xl font-semibold text-slate-900">
            Create new role
          </h1>
          <p className="mt-1 text-xs text-slate-600">
            Capture the basics, assign an owner and optionally publish to
            your careers page.
          </p>
        </div>

        <div className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] text-slate-700">
          Tenant:{" "}
          <span className="font-medium">
            {tenant.name ?? tenant.slug ?? "Resourcin"}
          </span>
        </div>
      </div>

      {/* Form */}
      <form
        method="POST"
        action="/api/ats/jobs"
        className="space-y-6 rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
      >
        {/* Row: Title + Client + Owner */}
        <div className="grid gap-4 md:grid-cols-3">
          <div className="md:col-span-1">
            <label className="block text-[11px] font-medium uppercase tracking-wide text-slate-500">
              Job title<span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="title"
              required
              placeholder="e.g. Deputy Medical Director"
              className="mt-1 block w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-0 placeholder:text-slate-400 focus:border-[#172965] focus:ring-1 focus:ring-[#172965]"
            />
          </div>

          <div>
            <label className="block text-[11px] font-medium uppercase tracking-wide text-slate-500">
              Client company
            </label>
            <select
              name="clientCompanyId"
              className="mt-1 block w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-0 focus:border-[#172965] focus:ring-1 focus:ring-[#172965]"
              defaultValue=""
            >
              <option value="">
                Direct mandate (Resourcin / in-house)
              </option>
              {clientCompanies.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-medium uppercase tracking-wide text-slate-500">
              Owner / Recruiter
            </label>
            <select
              name="hiringManagerId"
              className="mt-1 block w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-0 focus:border-[#172965] focus:ring-1 focus:ring-[#172965]"
              defaultValue=""
            >
              <option value="">Unassigned</option>
              {users.map((user) => {
                const label =
                  user.email || `User ${user.id}`;
                return (
                  <option key={user.id} value={user.id}>
                    {label}
                  </option>
                );
              })}
            </select>
            <p className="mt-1 text-[11px] text-slate-500">
              Used for recruiter / owner analytics in ThinkATS.
            </p>
          </div>
        </div>

        {/* Row: Location + Type + Level */}
        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <label className="block text-[11px] font-medium uppercase tracking-wide text-slate-500">
              Location
            </label>
            <input
              type="text"
              name="location"
              placeholder="e.g. Lagos · Hybrid"
              className="mt-1 block w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-0 placeholder:text-slate-400 focus:border-[#172965] focus:ring-1 focus:ring-[#172965]"
            />
          </div>

          <div>
            <label className="block text-[11px] font-medium uppercase tracking-wide text-slate-500">
              Location type
            </label>
            <select
              name="locationType"
              className="mt-1 block w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-0 focus:border-[#172965] focus:ring-1 focus:ring-[#172965]"
              defaultValue=""
            >
              <option value="">Not specified</option>
              <option value="On-site">On-site</option>
              <option value="Hybrid">Hybrid</option>
              <option value="Remote">Remote</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-medium uppercase tracking-wide text-slate-500">
              Employment type
            </label>
            <select
              name="employmentType"
              className="mt-1 block w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-0 focus:border-[#172965] focus:ring-1 focus:ring-[#172965]"
              defaultValue=""
            >
              <option value="">Not specified</option>
              <option value="Full time">Full time</option>
              <option value="Part time">Part time</option>
              <option value="Contract">Contract</option>
              <option value="Consulting">Consulting</option>
            </select>
          </div>
        </div>

        {/* Row: Experience + Status + Visibility */}
        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <label className="block text-[11px] font-medium uppercase tracking-wide text-slate-500">
              Experience level
            </label>
            <select
              name="experienceLevel"
              className="mt-1 block w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-0 focus:border-[#172965] focus:ring-1 focus:ring-[#172965]"
              defaultValue=""
            >
              <option value="">Not specified</option>
              <option value="junior">Junior</option>
              <option value="mid">Mid-level</option>
              <option value="senior">Senior</option>
              <option value="lead">Lead</option>
              <option value="director">Director</option>
              <option value="executive">Executive</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-medium uppercase tracking-wide text-slate-500">
              Status
            </label>
            <select
              name="status"
              className="mt-1 block w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-0 focus:border-[#172965] focus:ring-1 focus:ring-[#172965]"
              defaultValue="draft"
            >
              <option value="draft">Draft (not live)</option>
              <option value="open">Open (actively hiring)</option>
              <option value="closed">Closed</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-medium uppercase tracking-wide text-slate-500">
              Visibility
            </label>
            <select
              name="visibility"
              className="mt-1 block w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-0 focus:border-[#172965] focus:ring-1 focus:ring-[#172965]"
              defaultValue="public"
            >
              <option value="public">
                Public (show on /jobs careers page)
              </option>
              <option value="internal">
                Internal only (ATS, no careers page)
              </option>
            </select>
          </div>
        </div>

        {/* Salary & flags */}
        <div className="grid gap-4 md:grid-cols-4">
          <div>
            <label className="block text-[11px] font-medium uppercase tracking-wide text-slate-500">
              Salary min
            </label>
            <input
              type="number"
              name="salaryMin"
              min={0}
              step={1000}
              placeholder="e.g. 15000000"
              className="mt-1 block w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-0 placeholder:text-slate-400 focus:border-[#172965] focus:ring-1 focus:ring-[#172965]"
            />
          </div>
          <div>
            <label className="block text-[11px] font-medium uppercase tracking-wide text-slate-500">
              Salary max
            </label>
            <input
              type="number"
              name="salaryMax"
              min={0}
              step={1000}
              placeholder="e.g. 22000000"
              className="mt-1 block w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-0 placeholder:text-slate-400 focus:border-[#172965] focus:ring-1 focus:ring-[#172965]"
            />
          </div>
          <div>
            <label className="block text-[11px] font-medium uppercase tracking-wide text-slate-500">
              Currency
            </label>
            <input
              type="text"
              name="salaryCurrency"
              defaultValue="NGN"
              className="mt-1 block w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-0 placeholder:text-slate-400 focus:border-[#172965] focus:ring-1 focus:ring-[#172965]"
            />
          </div>
          <div className="flex flex-col justify-end gap-1">
            <label className="inline-flex items-center gap-2 text-[11px] text-slate-600">
              <input
                type="checkbox"
                name="salaryVisible"
                defaultChecked={false}
                className="h-4 w-4 rounded border-slate-300 text-[#172965] focus:ring-[#172965]"
              />
              <span>Show salary range on careers page</span>
            </label>
            <label className="inline-flex items-center gap-2 text-[11px] text-slate-600">
              <input
                type="checkbox"
                name="confidential"
                className="h-4 w-4 rounded border-slate-300 text-[#172965] focus:ring-[#172965]"
              />
              <span>Mark client as confidential</span>
            </label>
            <label className="inline-flex items-center gap-2 text-[11px] text-slate-600">
              <input
                type="checkbox"
                name="internalOnly"
                className="h-4 w-4 rounded border-slate-300 text-[#172965] focus:ring-[#172965]"
              />
              <span>Internal mandate only</span>
            </label>
          </div>
        </div>

        {/* Short description */}
        <div>
          <label className="block text-[11px] font-medium uppercase tracking-wide text-slate-500">
            Short description
          </label>
          <textarea
            name="shortDescription"
            rows={2}
            placeholder="2–3 lines that describe the role and why it matters."
            className="mt-1 block w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-0 placeholder:text-slate-400 focus:border-[#172965] focus:ring-1 focus:ring-[#172965]"
          />
        </div>

        {/* Overview & About client */}
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="block text-[11px] font-medium uppercase tracking-wide text-slate-500">
              Role overview
            </label>
            <textarea
              name="overview"
              rows={5}
              placeholder="Context, mandate and what success looks like in 12–18 months."
              className="mt-1 block w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-0 placeholder:text-slate-400 focus:border-[#172965] focus:ring-1 focus:ring-[#172965]"
            />
          </div>
          <div>
            <label className="block text-[11px] font-medium uppercase tracking-wide text-slate-500">
              About the client
            </label>
            <textarea
              name="aboutClient"
              rows={5}
              placeholder="Short profile on the client, team structure and culture."
              className="mt-1 block w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-0 placeholder:text-slate-400 focus:border-[#172965] focus:ring-1 focus:ring-[#172965]"
            />
          </div>
        </div>

        {/* Responsibilities / Requirements / Benefits */}
        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <label className="block text-[11px] font-medium uppercase tracking-wide text-slate-500">
              Responsibilities
            </label>
            <textarea
              name="responsibilities"
              rows={8}
              placeholder="One bullet per line. These will render as a formatted list on the public job page."
              className="mt-1 block w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-[11px] text-slate-900 outline-none ring-0 placeholder:text-slate-400 focus:border-[#172965] focus:ring-1 focus:ring-[#172965]"
            />
          </div>
          <div>
            <label className="block text-[11px] font-medium uppercase tracking-wide text-slate-500">
              Requirements
            </label>
            <textarea
              name="requirements"
              rows={8}
              placeholder="One bullet per line for must-haves / nice-to-haves."
              className="mt-1 block w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-[11px] text-slate-900 outline-none ring-0 placeholder:text-slate-400 focus:border-[#172965] focus:ring-1 focus:ring-[#172965]"
            />
          </div>
          <div>
            <label className="block text-[11px] font-medium uppercase tracking-wide text-slate-500">
              Benefits
            </label>
            <textarea
              name="benefits"
              rows={8}
              placeholder="Comp, perks, extras – one item per line."
              className="mt-1 block w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-[11px] text-slate-900 outline-none ring-0 placeholder:text-slate-400 focus:border-[#172965] focus:ring-1 focus:ring-[#172965]"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col items-start justify-between gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-center">
          <p className="text-[11px] text-slate-500">
            You can always edit this role later from the ATS jobs list.
          </p>
          <div className="flex gap-2">
            <Link
              href="/ats/jobs"
              className="inline-flex items-center rounded-md border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:border-slate-300"
            >
              Cancel
            </Link>
            <button
              type="submit"
              className="inline-flex items-center rounded-md bg-[#172965] px-4 py-2 text-xs font-medium text-white shadow-sm hover:bg-[#0f1c45]"
            >
              Create role
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
