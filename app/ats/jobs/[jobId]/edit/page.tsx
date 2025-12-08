// app/ats/jobs/[jobId]/edit/page.tsx
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getResourcinTenant, requireTenantMembership } from "@/lib/tenant";
import CareerLinks from "./CareerLinks";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Edit role | ATS | Resourcin",
  description:
    "Edit an existing mandate managed by Resourcin and its clients.",
};

function normaliseStatus(status: string | null | undefined) {
  return (status || "").toLowerCase();
}

function statusLabel(status: string | null | undefined): string {
  const s = normaliseStatus(status);
  if (s === "open") return "Open";
  if (s === "draft") return "Draft";
  if (s === "on_hold" || s === "on-hold") return "On hold";
  if (s === "closed") return "Closed";
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : "Unknown";
}

function statusBadgeClass(status: string | null | undefined): string {
  const s = normaliseStatus(status);
  if (s === "open") {
    return "bg-emerald-50 text-emerald-700 border-emerald-100";
  }
  if (s === "draft") {
    return "bg-slate-50 text-slate-600 border-slate-200";
  }
  if (s === "on_hold" || s === "on-hold") {
    return "bg-amber-50 text-amber-700 border-amber-100";
  }
  if (s === "closed") {
    return "bg-red-50 text-red-700 border-red-100";
  }
  return "bg-slate-50 text-slate-600 border-slate-200";
}

function buildTenantCareerUrl(tenant: any): string {
  const base =
    process.env.NEXT_PUBLIC_CAREERS_BASE_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    "https://www.resourcin.com/jobs";

  const slug = tenant?.slug || tenant?.id || "careers";

  if (base.includes("{tenant}")) {
    return base.replace("{tenant}", slug);
  }

  const trimmed = base.replace(/\/$/, "");

  if (trimmed.endsWith("/jobs")) {
    return `${trimmed}?tenant=${encodeURIComponent(slug)}`;
  }

  return `${trimmed}/jobs?tenant=${encodeURIComponent(slug)}`;
}

function buildJobPublicUrl(tenant: any, job: any): string {
  const root = buildTenantCareerUrl(tenant);
  const slugOrId = job.slug || job.id;

  if (root.includes("?")) {
    const [base, query] = root.split("?");
    const trimmedBase = base.replace(/\/$/, "");
    return `${trimmedBase}/${slugOrId}?${query}`;
  }

  const trimmed = root.replace(/\/$/, "");
  if (trimmed.endsWith("/jobs")) {
    return `${trimmed}/${slugOrId}`;
  }

  return `${trimmed}/jobs/${slugOrId}`;
}

export default async function EditJobPage({
  params,
}: {
  params: { jobId: string };
}) {
  const jobId = params.jobId;

  const currentTenant = await getResourcinTenant();
  if (!currentTenant) {
    notFound();
  }

  // 🔐 Only allowed roles can edit jobs
  await requireTenantMembership(currentTenant.id, {
    allowedRoles: ["OWNER", "ADMIN", "RECRUITER"],
  });

  const job = await prisma.job.findUnique({
    where: { id: jobId, tenantId: currentTenant.id },
    include: {
      tenant: true,
      clientCompany: true,
    },
  });

  if (!job) {
    notFound();
  }

  const clientCompanies = await prisma.clientCompany.findMany({
    where: { tenantId: job.tenantId },
    orderBy: { name: "asc" },
  });

  const statusText = statusLabel(job.status as any);
  const statusBadge = statusBadgeClass(job.status as any);
  const visibilityMode =
    job.internalOnly || job.visibility === "internal"
      ? "internal"
      : "public";

  const tenant = job.tenant as any;
  const careerSiteUrl = buildTenantCareerUrl(tenant);
  const jobPublicUrl = buildJobPublicUrl(tenant, job);

  const createdAt =
    job.createdAt &&
    new Date(job.createdAt).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

  const isPublic =
    job.visibility === "public" && job.internalOnly === false;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 lg:px-0">
      <div className="mb-6 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <Link
            href="/ats/jobs"
            className="inline-flex items-center text-xs font-medium text-slate-500 hover:text-slate-800"
          >
            <span className="mr-1.5">←</span>
            Back to all jobs
          </Link>

          <h1 className="mt-3 text-2xl font-semibold text-slate-900">
            Edit role
          </h1>
          <p className="mt-1 text-xs text-slate-600">
            Fine-tune details, visibility and salary for{" "}
            <span className="font-medium text-slate-900">
              {job.title}
            </span>
            .
          </p>

          <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-slate-600">
            <span
              className={`inline-flex items-center rounded-full border px-2 py-0.5 font-medium ${statusBadge}`}
            >
              {statusText}
            </span>
            <span className="text-slate-300">•</span>
            <span>
              Tenant:{" "}
              <span className="font-medium text-slate-900">
                {tenant?.name || tenant?.slug || tenant?.id}
              </span>
            </span>
            {createdAt && (
              <>
                <span className="text-slate-300">•</span>
                <span>Created {createdAt}</span>
              </>
            )}
          </div>
        </div>

        <div className="flex flex-col items-end gap-2 text-right">
          {isPublic && (
            <Link
              href={`/jobs/${job.slug ?? job.id}`}
              className="inline-flex items-center rounded-md border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-[11px] font-medium text-emerald-800 hover:border-emerald-300"
              target="_blank"
            >
              View public page
              <span className="ml-1 text-xs">↗</span>
            </Link>
          )}

          <p className="max-w-xs text-[10px] text-slate-500">
            Changes here update the job in the ATS and, if public,
            on the careers site.
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(260px,1fr)]">
        {/* MAIN EDIT FORM */}
        <form
          method="POST"
          action={`/api/ats/jobs/${job.id}/edit`}
          className="space-y-5 rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
        >
          {/* Core details */}
          <section className="space-y-3">
            <h2 className="text-sm font-semibold text-slate-900">
              Core details
            </h2>
            <p className="text-[11px] text-slate-500">
              Title, client, location and structure. These appear
              on the careers site and in internal views.
            </p>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="block text-[11px] font-medium text-slate-700">
                  Job title
                </label>
                <input
                  name="title"
                  type="text"
                  defaultValue={job.title}
                  required
                  className="mt-1 block w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 outline-none ring-0 placeholder:text-slate-400 focus:border-slate-900 focus:bg-white focus:ring-1 focus:ring-slate-900"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-700">
                  Client company
                </label>
                <select
                  name="clientCompanyId"
                  defaultValue={job.clientCompanyId ?? ""}
                  className="mt-1 block w-full rounded-md border border-slate-200 bg-slate-50 px-2 py-2 text-xs text-slate-900 outline-none ring-0 focus:border-slate-900 focus:bg-white focus:ring-1 focus:ring-slate-900"
                >
                  <option value="">Resourcin (no client)</option>
                  {clientCompanies.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-700">
                  Department / function
                </label>
                <input
                  name="department"
                  type="text"
                  defaultValue={job.department ?? ""}
                  placeholder="e.g. Operations, Product, Finance"
                  className="mt-1 block w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 outline-none ring-0 placeholder:text-slate-400 focus:border-slate-900 focus:bg-white focus:ring-1 focus:ring-slate-900"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-700">
                  Location
                </label>
                <input
                  name="location"
                  type="text"
                  defaultValue={job.location ?? ""}
                  placeholder="e.g. Lagos, Nairobi, Remote"
                  className="mt-1 block w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 outline-none ring-0 placeholder:text-slate-400 focus:border-slate-900 focus:bg-white focus:ring-1 focus:ring-slate-900"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-700">
                  Location type
                </label>
                <input
                  name="locationType"
                  type="text"
                  defaultValue={job.locationType ?? ""}
                  placeholder="On-site, Hybrid, Remote"
                  className="mt-1 block w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 outline-none ring-0 placeholder:text-slate-400 focus:border-slate-900 focus:bg-white focus:ring-1 focus:ring-slate-900"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-700">
                  Employment type
                </label>
                <input
                  name="employmentType"
                  type="text"
                  defaultValue={job.employmentType ?? ""}
                  placeholder="Full time, Contract, Interim"
                  className="mt-1 block w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 outline-none ring-0 placeholder:text-slate-400 focus:border-slate-900 focus:bg-white focus:ring-1 focus:ring-slate-900"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-700">
                  Experience level
                </label>
                <input
                  name="experienceLevel"
                  type="text"
                  defaultValue={job.experienceLevel ?? ""}
                  placeholder="Mid, Senior, Lead, Exec"
                  className="mt-1 block w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 outline-none ring-0 placeholder:text-slate-400 focus:border-slate-900 focus:bg-white focus:ring-1 focus:ring-slate-900"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-700">
                  Work mode
                </label>
                <input
                  name="workMode"
                  type="text"
                  defaultValue={job.workMode ?? ""}
                  placeholder="In-office, Hybrid, Remote"
                  className="mt-1 block w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 outline-none ring-0 placeholder:text-slate-400 focus:border-slate-900 focus:bg-white focus:ring-1 focus:ring-slate-900"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-slate-700">
                Short description
              </label>
              <textarea
                name="shortDescription"
                defaultValue={job.shortDescription ?? ""}
                rows={3}
                placeholder="One or two paragraphs summarising the mandate."
                className="mt-1 block w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 outline-none ring-0 placeholder:text-slate-400 focus:border-slate-900 focus:bg-white focus:ring-1 focus:ring-slate-900"
              />
            </div>
          </section>

          {/* Narrative */}
          <section className="space-y-3">
            <h2 className="text-sm font-semibold text-slate-900">
              Narrative & responsibilities
            </h2>
            <p className="text-[11px] text-slate-500">
              These fields show up on the public job page and help
              candidates self-select.
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-medium text-slate-700">
                  Role overview
                </label>
                <textarea
                  name="overview"
                  defaultValue={job.overview ?? ""}
                  rows={4}
                  className="mt-1 block w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 outline-none ring-0 placeholder:text-slate-400 focus:border-slate-900 focus:bg-white focus:ring-1 focus:ring-slate-900"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-700">
                  About the client
                </label>
                <textarea
                  name="aboutClient"
                  defaultValue={job.aboutClient ?? ""}
                  rows={4}
                  className="mt-1 block w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 outline-none ring-0 placeholder:text-slate-400 focus:border-slate-900 focus:bg-white focus:ring-1 focus:ring-slate-900"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-700">
                  Responsibilities
                </label>
                <textarea
                  name="responsibilities"
                  defaultValue={job.responsibilities ?? ""}
                  rows={6}
                  placeholder="Use bullet-style text. You can paste from your working doc."
                  className="mt-1 block w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 outline-none ring-0 placeholder:text-slate-400 focus:border-slate-900 focus:bg-white focus:ring-1 focus:ring-slate-900"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-700">
                  Requirements
                </label>
                <textarea
                  name="requirements"
                  defaultValue={job.requirements ?? ""}
                  rows={6}
                  className="mt-1 block w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 outline-none ring-0 placeholder:text-slate-400 focus:border-slate-900 focus:bg-white focus:ring-1 focus:ring-slate-900"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-700">
                  Benefits
                </label>
                <textarea
                  name="benefits"
                  defaultValue={job.benefits ?? ""}
                  rows={4}
                  className="mt-1 block w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 outline-none ring-0 placeholder:text-slate-400 focus:border-slate-900 focus:bg-white focus:ring-1 focus:ring-slate-900"
                />
              </div>
            </div>
          </section>

          {/* Meta / salary / visibility */}
          <section className="space-y-4 rounded-lg bg-slate-50 p-3">
            <h2 className="text-sm font-semibold text-slate-900">
              Meta, salary & visibility
            </h2>

            <div className="grid gap-3 sm:grid-cols-3">
              <div>
                <label className="block text-[11px] font-medium text-slate-700">
                  Status
                </label>
                <select
                  name="status"
                  defaultValue={normaliseStatus(job.status as any) || "open"}
                  className="mt-1 block w-full rounded-md border border-slate-200 bg-white px-2 py-2 text-xs text-slate-900 outline-none ring-0 focus:border-slate-900 focus:ring-1 focus:ring-slate-900"
                >
                  <option value="draft">Draft</option>
                  <option value="open">Open</option>
                  <option value="on_hold">On hold</option>
                  <option value="closed">Closed</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-700">
                  Salary currency
                </label>
                <input
                  name="salaryCurrency"
                  type="text"
                  defaultValue={job.salaryCurrency ?? "NGN"}
                  className="mt-1 block w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 outline-none ring-0 focus:border-slate-900 focus:ring-1 focus:ring-slate-900"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-700">
                  External ID / reference
                </label>
                <input
                  name="externalId"
                  type="text"
                  defaultValue={job.externalId ?? ""}
                  placeholder="Optional reference ID"
                  className="mt-1 block w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 outline-none ring-0 focus:border-slate-900 focus:ring-1 focus:ring-slate-900"
                />
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div>
                <label className="block text-[11px] font-medium text-slate-700">
                  Salary min
                </label>
                <input
                  name="salaryMin"
                  type="text"
                  defaultValue={job.salaryMin ? job.salaryMin.toString() : ""}
                  placeholder="e.g. 15000000"
                  className="mt-1 block w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 outline-none ring-0 placeholder:text-slate-400 focus:border-slate-900 focus:ring-1 focus:ring-slate-900"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-700">
                  Salary max
                </label>
                <input
                  name="salaryMax"
                  type="text"
                  defaultValue={job.salaryMax ? job.salaryMax.toString() : ""}
                  placeholder="e.g. 25000000"
                  className="mt-1 block w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 outline-none ring-0 placeholder:text-slate-400 focus:border-slate-900 focus:ring-1 focus:ring-slate-900"
                />
              </div>

              <div className="flex items-center gap-2 pt-5">
                <input
                  id="salaryVisible"
                  name="salaryVisible"
                  type="checkbox"
                  defaultChecked={job.salaryVisible === true}
                  className="h-3.5 w-3.5 rounded border-slate-300 text-[#0B1320] focus:ring-[#0B1320]"
                />
                <label
                  htmlFor="salaryVisible"
                  className="text-[11px] text-slate-700"
                >
                  Show salary range on public job page
                </label>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="block text-[11px] font-medium text-slate-700">
                  Tags
                </label>
                <input
                  name="tags"
                  type="text"
                  defaultValue={
                    Array.isArray((job as any).tags)
                      ? (job as any).tags.join(", ")
                      : ""
                  }
                  placeholder="Comma-separated: e.g. fintech, Lagos, GM"
                  className="mt-1 block w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 outline-none ring-0 placeholder:text-slate-400 focus:border-slate-900 focus:ring-1 focus:ring-slate-900"
                />
                <p className="mt-1 text-[10px] text-slate-500">
                  Used for internal search and reporting.
                </p>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-700">
                  Required skills
                </label>
                <input
                  name="requiredSkills"
                  type="text"
                  defaultValue={
                    Array.isArray((job as any).requiredSkills)
                      ? (job as any).requiredSkills.join(", ")
                      : ""
                  }
                  placeholder="Comma-separated: e.g. P&L, stakeholder mgmt"
                  className="mt-1 block w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 outline-none ring-0 placeholder:text-slate-400 focus:border-slate-900 focus:ring-1 focus:ring-slate-900"
                />
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <p className="text-[11px] font-medium text-slate-700">
                  Visibility
                </p>
                <div className="mt-1 space-y-1.5 rounded-md border border-slate-200 bg-white p-2">
                  <label className="flex items-start gap-2 text-[11px] text-slate-700">
                    <input
                      type="radio"
                      name="visibilityMode"
                      value="public"
                      defaultChecked={visibilityMode === "public"}
                      className="mt-0.5 h-3.5 w-3.5 border-slate-300 text-[#0B1320] focus:ring-[#0B1320]"
                    />
                    <span>
                      <span className="font-medium">
                        Public careers site
                      </span>
                      <span className="block text-[10px] text-slate-500">
                        Role appears on the tenant&apos;s career site
                        and public listings.
                      </span>
                    </span>
                  </label>

                  <label className="flex items-start gap-2 text-[11px] text-slate-700">
                    <input
                      type="radio"
                      name="visibilityMode"
                      value="internal"
                      defaultChecked={visibilityMode === "internal"}
                      className="mt-0.5 h-3.5 w-3.5 border-slate-300 text-[#0B1320] focus:ring-[#0B1320]"
                    />
                    <span>
                      <span className="font-medium">
                        Internal / invite-only
                      </span>
                      <span className="block text-[10px] text-slate-500">
                        Hidden from public careers site. You can still
                        share direct application links.
                      </span>
                    </span>
                  </label>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <input
                    id="confidential"
                    name="confidential"
                    type="checkbox"
                    defaultChecked={job.confidential === true}
                    className="h-3.5 w-3.5 rounded border-slate-300 text-[#0B1320] focus:ring-[#0B1320]"
                  />
                  <label
                    htmlFor="confidential"
                    className="text-[11px] text-slate-700"
                  >
                    Confidential search (hide client name on public
                    pages)
                  </label>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-700">
                    Custom slug (optional)
                  </label>
                  <input
                    name="slug"
                    type="text"
                    defaultValue={job.slug ?? ""}
                    placeholder="e.g. gm-bpo-nairobi"
                    className="mt-1 block w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 outline-none ring-0 placeholder:text-slate-400 focus:border-slate-900 focus:ring-1 focus:ring-slate-900"
                  />
                  <p className="mt-1 text-[10px] text-slate-500">
                    Used in the job URL. We&apos;ll enforce
                    tenant-wide uniqueness.
                  </p>
                </div>
              </div>
            </div>
          </section>

          <div className="flex items-center justify-between border-t border-slate-200 pt-4">
            <p className="text-[10px] text-slate-500">
              Changes apply immediately after you save.
            </p>
            <div className="flex items-center gap-2">
              <Link
                href={`/ats/jobs/${job.id}`}
                className="rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </Link>
              <button
                type="submit"
                className="inline-flex items-center rounded-md bg-[#0B1320] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#111827]"
              >
                Save changes
              </button>
            </div>
          </div>
        </form>

        {/* RIGHT COLUMN */}
        <div className="space-y-4">
          <CareerLinks
            careerSiteUrl={careerSiteUrl}
            jobPublicUrl={jobPublicUrl}
          />

          <div className="rounded-xl border border-slate-200 bg-white p-3 text-[11px] text-slate-600 shadow-sm">
            <h3 className="text-xs font-semibold text-slate-900">
              Job metadata
            </h3>
            <dl className="mt-2 space-y-1.5">
              <div className="flex justify-between gap-2">
                <dt className="text-slate-500">Job ID</dt>
                <dd className="truncate font-mono text-slate-800">
                  {job.id}
                </dd>
              </div>
              {job.slug && (
                <div className="flex justify-between gap-2">
                  <dt className="text-slate-500">Slug</dt>
                  <dd className="truncate font-mono text-slate-800">
                    {job.slug}
                  </dd>
                </div>
              )}
              <div className="flex justify-between gap-2">
                <dt className="text-slate-500">Tenant</dt>
                <dd className="truncate text-slate-800">
                  {tenant?.name || tenant?.slug || tenant?.id}
                </dd>
              </div>
              {job.clientCompany && (
                <div className="flex justify-between gap-2">
                  <dt className="text-slate-500">Client</dt>
                  <dd className="truncate text-slate-800">
                    {job.clientCompany.name}
                  </dd>
                </div>
              )}
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
}
