// app/jobs/page.tsx
import { prisma } from "@/lib/prisma";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function JobsPage() {
  const jobs = await prisma.job.findMany({
    where: { isPublished: true },
    orderBy: { postedAt: "desc" },
  });

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <div className="max-w-4xl mx-auto px-4 py-10 space-y-8">
        <header className="space-y-2">
          <p className="text-[11px] uppercase tracking-[0.15em] text-[#172965] font-semibold">
            Opportunities
          </p>
          <h1 className="text-2xl font-semibold text-slate-900">
            Open roles with Resourcin.
          </h1>
          <p className="text-sm text-slate-600 max-w-2xl">
            Mandates we&apos;re actively hiring for — within the Garden ecosystem
            and with external partners.
          </p>
        </header>

        {jobs.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-200 bg-white px-6 py-10 text-center text-sm text-slate-500">
            No active roles at the moment. Check back soon or send a speculative
            CV to{" "}
            <a
              href="mailto:hello@resourcin.com"
              className="text-[#172965] underline"
            >
              hello@resourcin.com
            </a>
            .
          </div>
        ) : (
          <div className="space-y-4">
            {jobs.map((job) => {
              const posted =
                job.postedAt instanceof Date
                  ? job.postedAt.toLocaleDateString("en-NG", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })
                  : "";

              return (
                <Link
                  key={job.id}
                  href={`/jobs/${job.slug}`}
                  className="block rounded-xl border border-slate-200 bg-white px-5 py-4 hover:border-[#172965] hover:shadow-sm transition"
                >
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between gap-3">
                      <h2 className="text-sm font-semibold text-slate-900">
                        {job.title}
                      </h2>
                      {posted && (
                        <span className="text-[11px] text-slate-400">
                          Posted {posted}
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-2 text-[11px] text-slate-500">
                      {job.location && (
                        <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1">
                          {job.location}
                        </span>
                      )}
                      {job.type && (
                        <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1">
                          {job.type}
                        </span>
                      )}
                      {job.department && (
                        <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1">
                          {job.department}
                        </span>
                      )}
                    </div>

                    {job.excerpt && (
                      <p className="text-xs text-slate-600 line-clamp-2">
                        {job.excerpt}
                      </p>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
