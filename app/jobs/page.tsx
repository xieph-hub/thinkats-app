import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function JobsPage() {
  // Fetch only open jobs – using only fields/columns we know exist in the DB
  const jobs = await prisma.job.findMany({
    where: {
      status: "open",
    },
    select: {
      slug: true,
      title: true,
      location: true,
      summary: true,
      salaryCurrency: true,
      salaryMin: true,
      salaryMax: true,
      remoteOption: true,
      function: true,
    },
  });

  return (
    <div className="bg-slate-50 min-h-screen">
      <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
        <header className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold tracking-wide uppercase text-[#306B34]">
              Opportunities
            </p>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
              Open roles curated by Resourcin
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              High-signal roles across Africa and global teams hiring in the
              region.
            </p>
          </div>
          <div className="text-xs text-slate-500">
            Powered by{" "}
            <span className="font-semibold text-[#172965]">
              Resourcin Talent Network
            </span>
          </div>
        </header>

        {jobs.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white/70 p-8 text-center">
            <p className="text-sm font-medium text-slate-800">
              No open roles yet.
            </p>
            <p className="mt-1 text-sm text-slate-500">
              Join the Resourcin Talent Network so we can match you when new
              roles go live.
            </p>
            <div className="mt-4 flex justify-center">
              <Link
                href="/candidates/join"
                className="inline-flex items-center justify-center rounded-full bg-[#172965] px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-slate-900 transition"
              >
                Join Talent Network
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid gap-4 md:gap-5">
            {jobs.map((job) => {
              const salary =
                job.salaryMin && job.salaryMax
                  ? `${job.salaryCurrency} ${job.salaryMin.toLocaleString()} – ${job.salaryMax.toLocaleString()}`
                  : job.salaryMin
                  ? `${job.salaryCurrency} ${job.salaryMin.toLocaleString()}+`
                  : null;

              return (
                <Link
                  key={job.slug}
                  href={`/jobs/${job.slug}`}
                  className="group block cursor-pointer rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-[#172965] hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-[#172965] focus-visible:ring-offset-2"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-base font-semibold tracking-tight text-slate-900 group-hover:text-[#172965]">
                          {job.title}
                        </h2>
                        {job.function && (
                          <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-slate-600">
                            {job.function}
                          </span>
                        )}
                      </div>
                      {job.summary && (
                        <p className="mt-1 text-sm text-slate-600 line-clamp-2">
                          {job.summary}
                        </p>
                      )}
                      <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                        {job.location && (
                          <span className="inline-flex items-center rounded-full bg-slate-50 px-2.5 py-1">
                            📍 {job.location}
                          </span>
                        )}
                        {job.remoteOption && (
                          <span className="inline-flex items-center rounded-full bg-slate-50 px-2.5 py-1">
                            🌐{" "}
                            {job.remoteOption === "hybrid"
                              ? "Hybrid"
                              : job.remoteOption}
                          </span>
                        )}
                        {salary && (
                          <span className="inline-flex items-center rounded-full bg-slate-50 px-2.5 py-1">
                            💰 {salary}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-end justify-between sm:flex-col sm:items-end sm:justify-between">
                      <span className="text-xs font-medium uppercase tracking-wide text-[#306B34]">
                        Actively hiring
                      </span>
                      <span className="mt-2 inline-flex items-center text-xs font-medium text-[#172965] group-hover:underline">
                        View role
                        <span className="ml-1 translate-y-px transition group-hover:translate-x-0.5">
                          →
                        </span>
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
