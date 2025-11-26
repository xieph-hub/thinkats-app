// app/jobs/[jobIdOrSlug]/page.tsx
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import JobApplyForm from "./JobApplyForm";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Role details | Resourcin",
  description:
    "Detailed view of an open mandate managed by Resourcin and its clients.",
};

const BASE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://www.resourcin.com";

const DEFAULT_TENANT_SLUG =
  process.env.RESOURCIN_TENANT_SLUG || "resourcin";

async function getDefaultTenant() {
  if (process.env.RESOURCIN_TENANT_ID) {
    const tenant = await prisma.tenant.findUnique({
      where: { id: process.env.RESOURCIN_TENANT_ID },
    });
    return tenant;
  }

  return prisma.tenant.findFirst({
    where: { slug: DEFAULT_TENANT_SLUG },
  });
}

async function getPublicJob(jobIdOrSlug: string) {
  const tenant = await getDefaultTenant();
  if (!tenant) return null;

  const job = await prisma.job.findFirst({
    where: {
      tenantId: tenant.id,
      AND: [
        {
          OR: [
            { id: jobIdOrSlug },
            { slug: jobIdOrSlug },
          ],
        },
        { status: "open" },
        { visibility: "public" },
        { internalOnly: false },
      ],
    },
    include: {
      clientCompany: true,
    },
  });

  if (!job) return null;

  return { tenant, job };
}

function formatDate(date: Date | null | undefined) {
  if (!date) return "";
  return date.toLocaleDateString("en-GB", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatSalary(
  min: any,
  max: any,
  currency?: string | null,
): string | null {
  if (!min && !max) return null;

  const cur = currency || "NGN";

  const asNumber = (v: any) =>
    typeof v === "number" ? v : v ? Number(v) : NaN;

  const minNum = asNumber(min);
  const maxNum = asNumber(max);

  const fmt = new Intl.NumberFormat("en-NG", {
    maximumFractionDigits: 0,
  });

  if (!isNaN(minNum) && !isNaN(maxNum)) {
    return `${cur} ${fmt.format(minNum)} – ${fmt.format(maxNum)}`;
  }
  if (!isNaN(minNum)) {
    return `${cur} ${fmt.format(minNum)}+`;
  }
  if (!isNaN(maxNum)) {
    return `Up to ${cur} ${fmt.format(maxNum)}`;
  }

  return null;
}

export default async function JobDetailPage({
  params,
}: {
  params: { jobIdOrSlug: string };
}) {
  const { jobIdOrSlug } = params;

  const data = await getPublicJob(jobIdOrSlug);

  if (!data) {
    notFound();
  }

  const { job } = data;

  const isConfidential = !!job.confidential;
  const client = job.clientCompany;

  const clientLabel = (() => {
    if (!client) return "Resourcin client";
    if (isConfidential) return "Confidential client";
    return client.name;
  })();

  const postedDate = formatDate(job.createdAt);
  const salaryLabel =
    job.salaryVisible === true
      ? formatSalary(job.salaryMin, job.salaryMax, job.salaryCurrency)
      : null;

  const shareUrl = `${BASE_URL}/jobs/${job.slug ?? job.id}`;

  return (
    <div className="mx-auto max-w-5xl space-y-10 px-4 py-8 sm:px-6 lg:px-0">
      {/* Back link + meta */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <Link
            href="/jobs"
            className="inline-flex items-center text-xs font-medium text-slate-500 hover:text-slate-800"
          >
            <span className="mr-1.5">←</span>
            Back to all jobs
          </Link>

          <h1 className="mt-3 text-2xl font-semibold text-slate-900 sm:text-3xl">
            {job.title}
          </h1>

          <div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-600">
            <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2 py-1">
              {clientLabel}
            </span>

            {job.location && (
              <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2 py-1">
                {job.location}
              </span>
            )}

            {job.locationType && (
              <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2 py-1">
                {job.locationType}
              </span>
            )}

            {job.employmentType && (
              <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2 py-1">
                {job.employmentType}
              </span>
            )}

            {job.experienceLevel && (
              <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2 py-1 capitalize">
                {job.experienceLevel}
              </span>
            )}

            {postedDate && (
              <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2 py-1">
                Posted {postedDate}
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-col items-end gap-2 text-right">
          {salaryLabel && (
            <div className="rounded-md bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-800">
              {salaryLabel}
            </div>
          )}
          <Link
            href="#apply"
            className="mt-1 inline-flex items-center rounded-md bg-[#0B1320] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#111827]"
          >
            Apply for this role
          </Link>
          <a
            href={shareUrl}
            className="text-[11px] text-slate-500 hover:text-slate-700"
            target="_blank"
            rel="noreferrer"
          >
            Copy/share link
          </a>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,2fr)_minmax(280px,1fr)]">
        {/* Left: job narrative */}
        <div className="space-y-6">
          {job.shortDescription && (
            <p className="text-sm text-slate-700">
              {job.shortDescription}
            </p>
          )}

          {job.overview && (
            <section className="space-y-2">
              <h2 className="text-sm font-semibold text-slate-900">
                Role overview
              </h2>
              <p className="whitespace-pre-line text-sm text-slate-700">
                {job.overview}
              </p>
            </section>
          )}

          {job.aboutClient && (
            <section className="space-y-2">
              <h2 className="text-sm font-semibold text-slate-900">
                About the client
              </h2>
              <p className="whitespace-pre-line text-sm text-slate-700">
                {job.aboutClient}
              </p>
            </section>
          )}

          {job.responsibilities && (
            <section className="space-y-2">
              <h2 className="text-sm font-semibold text-slate-900">
                Responsibilities
              </h2>
              <div className="prose prose-sm max-w-none text-slate-700">
                <pre className="whitespace-pre-wrap rounded-md bg-slate-50 p-3 text-xs text-slate-800">
                  {job.responsibilities}
                </pre>
              </div>
            </section>
          )}

          {job.requirements && (
            <section className="space-y-2">
              <h2 className="text-sm font-semibold text-slate-900">
                Requirements
              </h2>
              <div className="prose prose-sm max-w-none text-slate-700">
                <pre className="whitespace-pre-wrap rounded-md bg-slate-50 p-3 text-xs text-slate-800">
                  {job.requirements}
                </pre>
              </div>
            </section>
          )}

          {job.benefits && (
            <section className="space-y-2">
              <h2 className="text-sm font-semibold text-slate-900">
                Benefits
              </h2>
              <div className="prose prose-sm max-w-none text-slate-700">
                <pre className="whitespace-pre-wrap rounded-md bg-slate-50 p-3 text-xs text-slate-800">
                  {job.benefits}
                </pre>
              </div>
            </section>
          )}
        </div>

        {/* Right: application box */}
        <aside
          id="apply"
          className="space-y-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
        >
          <h2 className="text-sm font-semibold text-slate-900">
            Apply for this role
          </h2>
          <p className="text-xs text-slate-600">
            Share your details and CV. If you’re a good match, the Resourcin
            team will be in touch to walk you through next steps.
          </p>

          <JobApplyForm jobId={job.id} />

          <p className="mt-2 text-[11px] text-slate-500">
            By submitting an application, you agree that Resourcin may contact
            you about this and similar roles. You can ask to be removed from our
            talent network at any time.
          </p>
        </aside>
      </div>
    </div>
  );
}
