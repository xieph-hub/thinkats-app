import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function JobsPage() {
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
