// app/jobs/page.tsx
import Link from "next/link";
import Image from "next/image";
import ApplicationSuccessBanner from "@/components/jobs/ApplicationSuccessBanner";
import { listPublicJobsForResourcin } from "@/lib/jobs";

export const dynamic = "force-dynamic";

type JobsPageSearchParams = {
  [key: string]: string | string[] | undefined;
};

type PublicJob = {
  id: string;
  title: string;
  location: string | null;
  employmentType: string | null;
  slug: string | null;
  confidential: boolean;
  client: {
    name: string;
    logoUrl: string | null;
  } | null;
};

function titleCaseFromEnum(value?: string | null) {
  if (!value) return "";
  return value
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatEmploymentType(value?: string | null) {
  if (!value) return "";
  const key = value.toLowerCase();
  const map: Record<string, string> = {
    full_time: "Full Time",
    "full-time": "Full Time",
    "full time": "Full Time",
    fulltime: "Full Time",
    part_time: "Part Time",
    "part-time": "Part Time",
    "part time": "Part Time",
    internship: "Internship",
    contract: "Contract",
    temporary: "Temporary",
    consulting: "Consulting / Advisory",
  };
  return map[key] || titleCaseFromEnum(value);
}

export default async function JobsPage({
  searchParams,
}: {
  searchParams?: JobsPageSearchParams;
}) {
  // Check if we just came back from an application submit
  const appliedParam = searchParams?.applied;
  const applied =
    (Array.isArray(appliedParam) ? appliedParam[0] : appliedParam) === "1";

  const rawJobs = await listPublicJobsForResourcin();

  // Map Prisma rows → clean view model
  const jobs: PublicJob[] = rawJobs.map((job: any) => ({
    id: job.id,
    title: job.title,
    location: job.location ?? null,
    employmentType: job.employmentType ?? null,
    slug: job.slug ?? null,
    confidential: !!job.confidential,
    client: job.clientCompany
      ? {
          name: job.clientCompany.name as string,
          logoUrl: (job.clientCompany.logoUrl ?? null) as string | null,
        }
      : null,
  }));

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      {/* World-class success banner after application */}
      {applied && <ApplicationSuccessBanner />}

      <header className="mb-8">
        <h1 className="text-3xl font-semibold text-slate-900">
          Open roles
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-600">
          Roles managed by Resourcin and our clients across Nigeria, Africa
          and beyond.
        </p>
      </header>

      {jobs.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm text-slate-500">
          No open roles right now. Check back soon or join our talent
          network.
        </div>
      ) : (
        <div className="space-y-3">
          {jobs.map((job) => {
            const isConfidential = job.confidential;
            const client = job.client;

            const clientLabel = (() => {
              if (!client) return "Resourcin";
              if (isConfidential) return "Confidential client";
              return client.name;
            })();

            const href = `/jobs/${job.slug || job.id}`;
            const employmentTypeLabel = job.employmentType
              ? formatEmploymentType(job.employmentType)
              : "";

            return (
              <Link
                key={job.id}
                href={href}
                className="block rounded-lg border border-slate-200 bg-white px-4 py-4 shadow-sm transition hover:border-resourcin-blue/70 hover:shadow-md"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <h2 className="truncate text-base font-semibold text-slate-900">
                      {job.title}
                    </h2>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-600">
                      <span>{clientLabel}</span>
                      {job.location && (
                        <>
                          <span className="text-slate-300">•</span>
                          <span className="inline-flex items-center gap-1">
                            <span aria-hidden="true">📍</span>
                            <span>{job.location}</span>
                          </span>
                        </>
                      )}
                      {employmentTypeLabel && (
                        <>
                          <span className="text-slate-300">•</span>
                          <span>{employmentTypeLabel}</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Logo (only if non-confidential and logo exists) */}
                  {client && !isConfidential && client.logoUrl && (
                    <div className="shrink-0">
                      <Image
                        src={client.logoUrl}
                        alt={client.name}
                        width={48}
                        height={48}
                        className="h-10 w-10 rounded-md object-contain"
                      />
                    </div>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
