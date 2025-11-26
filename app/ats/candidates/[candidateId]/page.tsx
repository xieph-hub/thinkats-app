// app/ats/candidates/[candidateId]/page.tsx
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getResourcinTenant } from "@/lib/tenant";

export const dynamic = "force-dynamic";

function formatDate(date: Date | null | undefined) {
  if (!date) return "";
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default async function CandidateDetailPage({
  params,
}: {
  params: { candidateId: string };
}) {
  const { candidateId } = params;

  const tenant = await getResourcinTenant();
  if (!tenant) {
    notFound();
  }

  const candidate = await prisma.candidate.findFirst({
    where: {
      id: candidateId,
      tenantId: tenant.id,
    },
  });

  if (!candidate) {
    notFound();
  }

  const applications = await prisma.jobApplication.findMany({
    where: {
      candidateId: candidate.id,
    },
    include: {
      job: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      {/* Header / breadcrumbs */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link
            href="/ats/candidates"
            className="inline-flex items-center text-[11px] font-medium text-slate-500 hover:text-slate-800"
          >
            <span className="mr-1.5">←</span>
            Back to candidates
          </Link>
          <h1 className="mt-3 text-2xl font-semibold text-slate-900">
            {candidate.fullName || candidate.email}
          </h1>
          <p className="mt-1 text-xs text-slate-600">
            Candidate profile in ThinkATS for{" "}
            <span className="font-medium text-slate-900">
              {tenant.name || "Resourcin"}
            </span>
            .
          </p>
        </div>

        <div className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] text-slate-700">
          Added {formatDate(candidate.createdAt as any)}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(260px,1fr)]">
        {/* Left: applications */}
        <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-900">
            Applications
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            All roles this candidate has applied for under this
            tenant.
          </p>

          {applications.length === 0 ? (
            <div className="mt-4 rounded-lg border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-xs text-slate-500">
              No applications recorded yet for this candidate.
            </div>
          ) : (
            <div className="mt-4 divide-y divide-slate-100">
              {applications.map((app) => (
                <div
                  key={app.id}
                  className="flex flex-col gap-2 py-3 text-xs text-slate-700 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        href={`/ats/jobs/${app.jobId}`}
                        className="truncate text-sm font-medium text-slate-900 hover:text-[#172965]"
                      >
                        {app.job?.title || "Unknown role"}
                      </Link>
                      <span className="rounded-full bg-slate-50 px-2 py-0.5 text-[10px] uppercase tracking-wide text-slate-500">
                        Applied {formatDate(app.createdAt)}
                      </span>
                    </div>

                    <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
                      {app.job?.location && (
                        <span>{app.job.location}</span>
                      )}
                      {app.source && (
                        <>
                          <span className="text-slate-300">
                            •
                          </span>
                          <span>Source: {app.source}</span>
                        </>
                      )}
                    </div>

                    {app.coverLetter && (
                      <p className="mt-2 line-clamp-3 whitespace-pre-line text-[11px] text-slate-600">
                        {app.coverLetter}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                    {app.cvUrl && (
                      <a
                        href={app.cvUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-full bg-slate-50 px-3 py-1 text-[11px] font-medium text-[#172965] hover:bg-slate-100"
                      >
                        View CV
                      </a>
                    )}
                    <Link
                      href={`/jobs/${app.job?.slug || app.jobId}`}
                      className="rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] text-slate-600 hover:border-[#172965] hover:text-[#172965]"
                    >
                      View public role
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Right: profile card */}
        <aside className="space-y-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-900">
            Profile
          </h2>

          <div className="space-y-2 text-xs text-slate-700">
            <div>
              <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
                Name
              </p>
              <p className="mt-0.5">
                {candidate.fullName || "—"}
              </p>
            </div>

            <div>
              <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
                Email
              </p>
              <p className="mt-0.5">
                {candidate.email || "—"}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
                  Phone
                </p>
                <p className="mt-0.5">
                  {candidate.phone || "—"}
                </p>
              </div>
              <div>
                <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
                  Location
                </p>
                <p className="mt-0.5">
                  {candidate.location || "—"}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
                  Current title
                </p>
                <p className="mt-0.5">
                  {candidate.currentTitle || "—"}
                </p>
              </div>
              <div>
                <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
                  Current company
                </p>
                <p className="mt-0.5">
                  {candidate.currentCompany || "—"}
                </p>
              </div>
            </div>

            <div>
              <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
                Source
              </p>
              <p className="mt-0.5">
                {candidate.source || "—"}
              </p>
            </div>

            <div className="space-y-1">
              {candidate.linkedinUrl && (
                <a
                  href={candidate.linkedinUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="block text-[11px] font-medium text-[#172965] hover:underline"
                >
                  LinkedIn profile
                </a>
              )}
              {candidate.cvUrl && (
                <a
                  href={candidate.cvUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="block text-[11px] font-medium text-[#172965] hover:underline"
                >
                  Download CV
                </a>
              )}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
