// app/ats/jobs/[jobId]/page.tsx
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "ATS job pipeline | Resourcin",
  description:
    "Internal pipeline view for a specific mandate managed in the Resourcin ATS.",
};

type ClientCompanyRow = {
  name: string;
  logo_url: string | null;
  slug: string | null;
};

type JobRow = {
  id: string;
  slug: string | null;
  title: string;
  department: string | null;
  location: string | null;
  employment_type: string | null;
  status: string | null;
  visibility: string | null;
  created_at: string;
  client_company: ClientCompanyRow[] | null;
};

type ApplicationRow = {
  id: string;
  job_id: string;
  full_name: string;
  email: string;
  phone: string | null;
  location: string | null;
  linkedin_url: string | null;
  portfolio_url: string | null;
  cv_url: string | null;
  cover_letter: string | null;
  source: string | null;
  stage: string;
  status: string;
  created_at: string;
  reference_code: string | null;
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

export default async function AtsJobDetailPage({
  params,
}: {
  params: { jobId: string };
}) {
  const jobId = params.jobId;

  // 1) Load job
  const { data: job, error: jobError } = await supabaseAdmin
    .from("jobs")
    .select(
      `
      id,
      slug,
      title,
      department,
      location,
      employment_type,
      status,
      visibility,
      created_at,
      client_company:client_companies (
        name,
        logo_url,
        slug
      )
    `
    )
    .eq("id", jobId)
    .single();

  if (jobError) {
    console.error("ATS job detail – job query error:", jobError);
  }

  if (!job) {
    notFound();
  }

  // 2) Load applications for this job (NO extra filters)
  const { data: applications, error: appsError } = await supabaseAdmin
    .from("job_applications")
    .select(
      `
      id,
      job_id,
      full_name,
      email,
      phone,
      location,
      linkedin_url,
      portfolio_url,
      cv_url,
      cover_letter,
      source,
      stage,
      status,
      created_at,
      reference_code
    `
    )
    .eq("job_id", jobId)
    .order("created_at", { ascending: false });

  if (appsError) {
    console.error("ATS job detail – applications query error:", appsError);
  }

  const apps = (applications ?? []) as ApplicationRow[];
  const client = (job as JobRow).client_company?.[0] ?? null;

  return (
    <main className="mx-auto max-w-6xl px-4 py-6">
      {/* Breadcrumb */}
      <div className="mb-4 text-[11px] text-slate-500">
        <Link
          href="/ats/jobs"
          className="inline-flex items-center gap-1 text-slate-500 hover:text-[#172965]"
        >
          <span aria-hidden="true">←</span>
          <span>Back to ATS jobs</span>
        </Link>
      </div>

      {/* Header */}
      <header className="mb-6 border-b border-slate-100 pb-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
          ATS pipeline
        </p>
        <div className="mt-1 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold text-slate-900">
              {(job as JobRow).title}
            </h1>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-slate-600">
              {(job as JobRow).department && (
                <span className="rounded-full bg-slate-50 px-2 py-0.5 font-medium text-slate-700">
                  {(job as JobRow).department}
                </span>
              )}
              {(job as JobRow).location && (
                <span className="rounded-full bg-slate-50 px-2 py-0.5 font-medium text-slate-700">
                  {(job as JobRow).location}
                </span>
              )}
              {(job as JobRow).employment_type && (
                <span className="rounded-full bg-slate-50 px-2 py-0.5 text-[10px] uppercase tracking-wide text-slate-600">
                  {(job as JobRow).employment_type}
                </span>
              )}
              {(job as JobRow).status && (
                <span className="rounded-full bg-slate-50 px-2 py-0.5 text-[10px] uppercase tracking-wide text-slate-600">
                  {(job as JobRow).status}
                  {(job as JobRow).visibility
                    ? ` · ${(job as JobRow).visibility}`
                    : ""}
                </span>
              )}
            </div>
          </div>

          <div className="text-right text-[11px] text-slate-500">
            <p>Created {formatDate((job as JobRow).created_at)}</p>
            <p>
              Applicants:{" "}
              <span className="font-semibold text-slate-800">
                {apps.length}
              </span>
            </p>
          </div>
        </div>

        {client && (
          <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-slate-50 px-3 py-1 text-[11px] text-slate-700">
            {client.logo_url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={client.logo_url}
                alt={client.name}
                className="h-5 w-5 rounded-sm object-contain"
              />
            )}
            <span className="font-medium">{client.name}</span>
          </div>
        )}
      </header>

      {/* Applications table */}
      <section className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            Applications
          </h2>
          <p className="text-[11px] text-slate-500">
            Showing {apps.length} application
            {apps.length === 1 ? "" : "s"} for this role.
          </p>
        </div>

        {apps.length === 0 ? (
          <p className="text-[12px] text-slate-500">
            No applications yet. Once candidates apply via the public job page,
            they will appear here automatically.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full border-separate border-spacing-y-1 text-left text-[12px]">
              <thead>
                <tr className="text-[11px] uppercase tracking-[0.12em] text-slate-500">
                  <th className="px-2 py-1">Candidate</th>
                  <th className="px-2 py-1">Contact</th>
                  <th className="px-2 py-1">Location</th>
                  <th className="px-2 py-1">Stage / Status</th>
                  <th className="px-2 py-1">Applied</th>
                  <th className="px-2 py-1">CV</th>
                </tr>
              </thead>
              <tbody>
                {apps.map((app) => (
                  <tr
                    key={app.id}
                    className="rounded-lg bg-slate-50/60 align-top text-[12px] text-slate-800"
                  >
                    <td className="px-2 py-2">
                      <div className="font-semibold">{app.full_name}</div>
                      {app.reference_code && (
                        <div className="text-[10px] text-slate-500">
                          Ref: {app.reference_code}
                        </div>
                      )}
                    </td>
                    <td className="px-2 py-2">
                      <div>{app.email}</div>
                      {app.phone && (
                        <div className="text-[10px] text-slate-500">
                          {app.phone}
                        </div>
                      )}
                      {app.linkedin_url && (
                        <a
                          href={app.linkedin_url}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-1 block text-[10px] text-[#0A66C2] hover:underline"
                        >
                          LinkedIn profile
                        </a>
                      )}
                      {app.portfolio_url && (
                        <a
                          href={app.portfolio_url}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-1 block text-[10px] text-[#172965] hover:underline"
                        >
                          Portfolio
                        </a>
                      )}
                    </td>
                    <td className="px-2 py-2">
                      {app.location || (
                        <span className="text-[11px] text-slate-400">—</span>
                      )}
                    </td>
                    <td className="px-2 py-2">
                      <div className="inline-flex flex-col gap-0.5">
                        <span className="inline-flex w-fit rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-700">
                          {app.stage}
                        </span>
                        <span className="text-[10px] text-slate-500">
                          {app.status}
                        </span>
                      </div>
                    </td>
                    <td className="px-2 py-2 text-[11px] text-slate-600">
                      {formatDate(app.created_at)}
                    </td>
                    <td className="px-2 py-2">
                      {app.cv_url ? (
                        <a
                          href={app.cv_url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center rounded-full bg-[#172965] px-3 py-1 text-[10px] font-semibold text-white shadow-sm hover:bg-[#111c4c]"
                        >
                          View CV
                        </a>
                      ) : (
                        <span className="text-[11px] text-slate-400">
                          No CV on file
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}
