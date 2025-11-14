// app/admin/jobs/page.tsx

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin – Jobs | Resourcin",
  description:
    "Internal jobs admin panel for Resourcin Human Capital Advisors.",
};

interface AdminJobsPageProps {
  searchParams?: { key?: string };
}

export default function AdminJobsPage({ searchParams }: AdminJobsPageProps) {
  const keyFromUrl = searchParams?.key;
  const adminSecret = process.env.ADMIN_SECRET;

  // 1) If ADMIN_SECRET is not set in Vercel, show a clear message
  if (!adminSecret) {
    return (
      <main className="min-h-screen bg-slate-50 px-6 py-16">
        <div className="mx-auto max-w-2xl rounded-xl bg-white p-8 shadow-md border border-slate-100">
          <h1 className="text-2xl font-semibold text-slate-900 mb-4">
            Admin Jobs – Config Issue
          </h1>
          <p className="text-sm text-slate-600">
            The <code className="px-1 py-0.5 rounded bg-slate-100">ADMIN_SECRET</code>{" "}
            environment variable is not set in production.
          </p>
          <ol className="mt-4 list-decimal list-inside text-sm text-slate-700 space-y-1">
            <li>Go to Vercel → Project Settings → Environment Variables.</li>
            <li>Add a variable named <strong>ADMIN_SECRET</strong> in the Production environment.</li>
            <li>Redeploy the project.</li>
          </ol>
        </div>
      </main>
    );
  }

  // 2) If key is missing or wrong, show an "invalid key" screen – not a 404
  if (process.env.NODE_ENV === "production" && keyFromUrl !== adminSecret) {
    return (
      <main className="min-h-screen bg-slate-50 px-6 py-16">
        <div className="mx-auto max-w-md rounded-xl bg-white p-8 shadow-md border border-slate-100">
          <h1 className="text-xl font-semibold text-slate-900 mb-3">
            Admin access required
          </h1>
          <p className="text-sm text-slate-600 mb-4">
            The admin key in the URL is missing or incorrect.
          </p>
          <p className="text-sm text-slate-600">
            Open this page as:
          </p>
          <pre className="mt-2 rounded-lg bg-slate-900 px-3 py-2 text-xs text-slate-50 overflow-x-auto">
            https://www.resourcin.com/admin/jobs?key=YOUR_ADMIN_SECRET
          </pre>
          <p className="mt-3 text-xs text-slate-500">
            Make sure <code>YOUR_ADMIN_SECRET</code> exactly matches the{" "}
            <code>ADMIN_SECRET</code> value configured in Vercel.
          </p>
        </div>
      </main>
    );
  }

  // 3) If key matches, show a simple admin dashboard placeholder
  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10">
      <div className="mx-auto max-w-5xl">
        <header className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">
              Jobs Admin
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              Internal view for managing open roles on the Resourcin job board.
            </p>
          </div>
          <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 border border-emerald-100">
            Admin access granted
          </span>
        </header>

        <section className="rounded-xl bg-white p-6 shadow-sm border border-slate-100">
          <h2 className="text-lg font-semibold text-slate-900 mb-2">
            Next steps
          </h2>
          <p className="text-sm text-slate-600 mb-3">
            The database is wired (Supabase + Prisma). For now, you can:
          </p>
          <ol className="list-decimal list-inside text-sm text-slate-700 space-y-1">
            <li>
              Use <strong>Supabase → Table Editor</strong> to add rows in the{" "}
              <code>Job</code> table (title, slug, description, isPublished, etc.).
            </li>
            <li>
              Visit <code>/jobs</code> on the live site to confirm they appear on
              the public job board.
            </li>
            <li>
              When candidates apply, their data lands in the{" "}
              <code>Candidate</code> and <code>Application</code> tables.
            </li>
          </ol>
          <p className="mt-4 text-xs text-slate-500">
            We can extend this page into a full CRUD dashboard (create/edit
            jobs, view applications) once access is working reliably.
          </p>
        </section>
      </div>
    </main>
  );
}
