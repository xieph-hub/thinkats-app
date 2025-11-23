// app/jobs/page.tsx
import type { Metadata } from "next";
import Link from "next/link";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Jobs | Resourcin",
  description:
    "Open roles managed by Resourcin across Africa and beyond. Browse and apply without creating an account.",
};

type PublicJob = {
  id: string;
  slug: string | null;
  title: string;
  location: string | null;
  employment_type: string | null;
  seniority: string | null;
  created_at: string;
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

export default async function JobsPage() {
  const { data, error } = await supabaseAdmin
    .from("jobs")
    .select(
      `
      id,
      slug,
      title,
      location,
      employment_type,
      seniority,
      status,
      visibility,
      created_at
    `
    )
    .eq("status", "open")
    .eq("visibility", "public")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error loading public jobs:", error);
  }

  const jobs = (data ?? []) as PublicJob[];

  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <header className="mb-6">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
          For candidates
        </p>
        <h1 className="mt-1 text-2xl font-semibold text-slate-900">
          Open roles
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          Browse currently open roles with Resourcin and our clients. You can
          apply without creating an account; we&apos;ll only reach out when
          there&apos;s a strong match.
        </p>
      </header>

      {jobs.length === 0 ? (
        <p className="mt-8 text-sm text-slate-500">
          No open roles right now. You can{" "}
          <Link
            href="/talent-network"
            className="font-semibold text-[#172965] hover:underline"
          >
            join the talent network
          </Link>{" "}
          so we can reach out when there&apos;s a strong match.
        </p>
      ) : (
        <ul className="mt-6 space-y-4">
          {jobs.map((job) => {
            const slugOrId = job.slug ?? job.id;
            return (
              <li
                key={job.id}
                className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm hover:border-[#172965]/70 hover:shadow-md transition"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="text-sm font-semibold text-slate-900">
                      <Link
                        href={`/jobs/${encodeURIComponent(slugOrId)}`}
                        className="hover:underline"
                      >
                        {job.title}
                      </Link>
                    </h2>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-slate-600">
                      <span>{job.location || "Location flexible"}</span>
                      {job.employment_type && (
                        <>
                          <span className="text-slate-300">•</span>
                          <span>{job.employment_type}</span>
                        </>
                      )}
                      {job.seniority && (
                        <>
                          <span className="text-slate-300">•</span>
                          <span className="uppercase tracking-wide">
                            {job.seniority}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col items-start gap-1 text-[11px] text-slate-500 sm:items-end">
                    <span>Posted {formatDate(job.created_at)}</span>
                    <Link
                      href={`/jobs/${encodeURIComponent(slugOrId)}`}
                      className="inline-flex items-center rounded-full bg-[#172965] px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-[#111c4c] transition"
                    >
                      View role
                    </Link>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
