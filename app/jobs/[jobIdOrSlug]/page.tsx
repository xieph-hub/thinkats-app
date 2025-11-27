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

// ✅ Only treat the param as an ID if it actually looks like a UUID
function looksLikeUuid(value: string) {
  return /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(
    value,
  );
}

async function getPublicJob(jobIdOrSlug: string) {
  const tenant = await getDefaultTenant();
  if (!tenant) return null;

  const where: any = {
    tenantId: tenant.id,
    status: "open",
    visibility: "public",
    internalOnly: false,
  };

  if (looksLikeUuid(jobIdOrSlug)) {
    // If it looks like a UUID, allow match by id OR slug
    where.OR = [{ id: jobIdOrSlug }, { slug: jobIdOrSlug }];
  } else {
    // If it's clearly a slug, don't even touch the UUID column
    where.slug = jobIdOrSlug;
  }

  const job = await prisma.job.findFirst({
    where,
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

/**
 * Lightweight rich-text renderer:
 * - Splits on newlines
 * - If lines look like bullets ( - / * / • / 1. ), render as a list
 * - Otherwise renders clean paragraphs
 */
function RichTextBlock({ value }: { value?: string | null }) {
  if (!value || !value.trim()) return null;

  const text = value.replace(/\r\n/g, "\n");
  const rawLines = text.split("\n").map((line) => line.trim());
  const lines = rawLines.filter((l) => l.length > 0);

  if (lines.length === 0) return null;

  const bulletPattern = /^([-*•]|\d+\.)\s*/;
  const hasBullets = lines.some((line) => bulletPattern.test(line));

  if (hasBullets) {
    const items = lines
      .map((line) => line.replace(bulletPattern, "").trim())
      .filter(Boolean);

    return (
      <ul className="list-disc space-y-1 pl-5 text-sm text-slate-700">
        {items.map((item, idx) => (
          <li key={idx}>{item}</li>
        ))}
      </ul>
    );
  }

  // Fallback: normal paragraphs
  return (
    <div className="space-y-2">
      {lines.map((line, idx) => (
        <p key={idx} className="text-sm text-slate-700">
          {line}
        </p>
      ))}
    </div>
  );
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

  const tags =
    Array.isArray((job as any).tags) && (job as any).tags.length > 0
      ? ((job as any).tags as string[])
      : [];

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

          {/* Tags / skills chips */}
          {tags.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center rounded-full bg-[#172965]/5 px-2 py-0.5 text-[11px] font-medium text-[#172965]"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
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
              <RichTextBlock value={job.overview as any} />
            </section>
          )}

          {job.aboutClient && (
            <section className="space-y-2">
              <h2 className="text-sm font-semibold text-slate-900">
                About the client
              </h2>
              <RichTextBlock value={job.aboutClient as any} />
            </section>
          )}

          {job.responsibilities && (
            <section className="space-y-2">
              <h2 className="text-sm font-semibold text-slate-900">
                Responsibilities
              </h2>
              <RichTextBlock value={job.responsibilities as any} />
            </section>
          )}

          {job.requirements && (
            <section className="space-y-2">
              <h2 className="text-sm font-semibold text-slate-900">
                Requirements
              </h2>
              <RichTextBlock value={job.requirements as any} />
            </section>
          )}

          {job.benefits && (
            <section className="space-y-2">
              <h2 className="text-sm font-semibold text-slate-900">
                Benefits
              </h2>
              <RichTextBlock value={job.benefits as any} />
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
            Share your details and CV. If you’re a good match, the
            Resourcin team will be in touch to walk you through next
            steps.
          </p>

          <JobApplyForm jobId={job.id} />

          <p className="mt-2 text-[11px] text-slate-500">
            By submitting an application, you agree that Resourcin may
            contact you about this and similar roles. You can ask to be
            removed from our talent network at any time.
          </p>
        </aside>
      </div>
    </div>
  );
}
