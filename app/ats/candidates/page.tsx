// app/ats/candidates/page.tsx
import type { Metadata } from "next";
import Link from "next/link";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Candidates | Resourcin ATS",
  description:
    "All candidates across open and historical mandates managed by Resourcin.",
};

type CandidateRow = {
  id: string;
  job_id: string;
  full_name: string;
  email: string;
  phone: string | null;
  location: string | null;
  stage: string;
  status: string;
  created_at: string;
  cv_url: string | null;
  job: {
    id: string;
    title: string;
    slug: string | null;
  } | null;
};

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
  });
}

export default async function CandidatesPage() {
  const { data, error } = await supabaseAdmin
    .from("job_applications")
    .select(
      `
      id,
      job_id,
      full_name,
      email,
      phone,
      location,
      stage,
      status,
      created_at,
      cv_url,
      job:jobs (
        id,
        title,
        slug
      )
    `
    )
    .order("created_at", { ascending: false })
    .limit(300);

  if (error) {
    console.error("ATS candidates – error loading candidates:", error);
  }

  const rows = (data ?? []) as CandidateRow[];

  return (
    <main className="mx-auto max-w-6xl px-4 py-6">
      <header className="mb-6 border-b border-slate-100 pb-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
          ATS
        </p>
        <div className="mt-1 flex items-center justify-between gap-2">
          <h1 className="text-xl font-semibold text-slate-900">
            Candidates
          </h1>
          <p className="text-[11px] text-slate-500">
            {rows.length} application
            {rows.length === 1 ? "" : "s"} in view.
          </p>
        </div>
      </header>

      {rows.length === 0 ? (
        <p className="text-[12px] text-slate-500">
          No candidates yet. Once candidates apply for roles, they will appear
          here automatically.
        </p>
      ) : (
        <section className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full border-separate border-spacing-y-1 text-left text-[12px]">
              <thead>
                <tr className="text-[11px] uppercase tracking-[0.12em] text-slate-500">
                  <th className="px-2 py-1">Candidate</th>
                  <th className="px-2 py-1">Role</th>
                  <th className="px-2 py-1">Location</th>
                  <th className="px-2 py-1">Stage / Status</th>
                  <th className="px-2 py-1">Applied</th>
                  <th className="px-2 py-1">CV</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr
                    key={row.id}
                    className="rounded-lg bg-slate-50/60 align-top text-[12px] text-slate-800"
                  >
                    <td className="px-2 py-2">
                      <div className="font-semibold">{row.full_name}</div>
                      <div className="text-[11px] text-slate-600">
                        {row.email}
                      </div>
                      {row.phone && (
                        <div className="text-[10px] text-slate-500">
                          {row.phone}
                        </div>
                      )}
                    </td>
                    <td className="px-2 py-2">
                      {row.job ? (
                        <div className="flex flex-col gap-0.5">
                          <span className="font-medium text-slate-800">
                            {row.job.title}
                          </span>
                          <Link
                            href={`/ats/jobs/${row.job.id}`}
                            className="text-[10px] text-[#172965] hover:underline"
                          >
                            View pipeline
                          </Link>
                        </div>
                      ) : (
                        <span className="text-[11px] text-slate-400">
                          Role not found
                        </span>
                      )}
                    </td>
                    <td className="px-2 py-2">
                      {row.location || (
                        <span className="text-[11px] text-slate-400">—</span>
                      )}
                    </td>
                    <td className="px-2 py-2">
                      <div className="inline-flex flex-col gap-0.5">
                        <span className="inline-flex w-fit rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-700">
                          {row.stage}
                        </span>
                        <span className="text-[10px] text-slate-500">
                          {row.status}
                        </span>
                      </div>
                    </td>
                    <td className="px-2 py-2 text-[11px] text-slate-600">
                      {formatDate(row.created_at)}
                    </td>
                    <td className="px-2 py-2">
                      {row.cv_url ? (
                        <a
                          href={row.cv_url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center rounded-full bg-[#172965] px-3 py-1 text-[10px] font-semibold text-white shadow-sm hover:bg-[#111c4c]"
                        >
                          View CV
                        </a>
                      ) : (
                        <span className="text-[11px] text-slate-400">
                          No CV
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </main>
  );
}
