// app/ats/dashboard/page.tsx
import type { Metadata } from "next";
import Container from "@/components/Container";
import Link from "next/link";

export const metadata: Metadata = {
  title: "ATS dashboard | ThinkATS",
  description:
    "Overview of your jobs, candidates and hiring activity inside ThinkATS.",
};

export default function AtsDashboardPage() {
  return (
    <main className="bg-slate-50 py-12 md:py-16">
      <Container>
        <div className="mb-6 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
              ATS
            </p>
            <h1 className="mt-2 text-2xl font-semibold text-slate-900 md:text-3xl">
              Dashboard
            </h1>
            <p className="mt-2 max-w-xl text-sm text-slate-600">
              High-level view of your open jobs, active candidates and recent
              activity. We&apos;ll wire this up to live metrics as the product
              evolves.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link
              href="/ats/jobs/new"
              className="rounded-full bg-[#1E40AF] px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-[#1D4ED8]"
            >
              Post a new job
            </Link>
            <Link
              href="/ats/jobs"
              className="rounded-full border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-800 hover:bg-white"
            >
              View all jobs
            </Link>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold text-slate-500">
              Open jobs (placeholder)
            </p>
            <p className="mt-2 text-2xl font-bold text-slate-900">0</p>
            <p className="mt-1 text-[11px] text-slate-500">
              Once wired, this will show how many live roles your team is
              managing across tenants.
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold text-slate-500">
              Active candidates (placeholder)
            </p>
            <p className="mt-2 text-2xl font-bold text-slate-900">0</p>
            <p className="mt-1 text-[11px] text-slate-500">
              This will track candidates currently in process across all jobs.
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold text-slate-500">
              New applications (last 7 days)
            </p>
            <p className="mt-2 text-2xl font-bold text-slate-900">0</p>
            <p className="mt-1 text-[11px] text-slate-500">
              As we hook into your data, this card will surface recent inbound
              volume.
            </p>
          </div>
        </div>

        <div className="mt-8 rounded-2xl border border-dashed border-slate-300 bg-white/60 p-5 text-xs text-slate-600">
          <p className="font-semibold text-slate-800">
            Implementation note (safe to leave in for now)
          </p>
          <p className="mt-2">
            This page is currently a static shell so we can stabilise navigation
            and flows. When you&apos;re ready, we can replace these placeholders
            with real queries against your{" "}
            <code className="rounded bg-slate-100 px-1 py-0.5 text-[10px]">
              Job
            </code>{" "}
            and{" "}
            <code className="rounded bg-slate-100 px-1 py-0.5 text-[10px]">
              JobApplication
            </code>{" "}
            tables (via Prisma) and any tenant-aware metrics you care about.
          </p>
        </div>
      </Container>
    </main>
  );
}
