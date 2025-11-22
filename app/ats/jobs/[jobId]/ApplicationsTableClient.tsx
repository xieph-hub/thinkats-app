// app/ats/jobs/[jobId]/ApplicationsTableClient.tsx
"use client";

type Application = {
  id: string;
  fullName: string;
  email: string;
  phone: string | null;
  location: string | null;
  linkedinUrl: string | null;
  portfolioUrl: string | null;
  cvUrl: string | null;
  coverLetter: string | null;
  source: string | null;
  stage: string;
  status: string;
  createdAt: string; // ISO string
};

type ApplicationsTableClientProps = {
  applications: Application[];
};

export default function ApplicationsTableClient({
  applications,
}: ApplicationsTableClientProps) {
  if (!applications || applications.length === 0) {
    return (
      <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-600 shadow-sm">
        No applications yet for this role.
      </div>
    );
  }

  const supabaseUrl =
    typeof process !== "undefined"
      ? process.env.NEXT_PUBLIC_SUPABASE_URL
      : undefined;

  return (
    <div className="mt-6 overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
      <table className="min-w-full divide-y divide-slate-200 text-sm">
        <thead className="bg-slate-50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              Candidate
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              Contact
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              Profile
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              CV
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              Stage
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              Status
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              Applied
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200 bg-white">
          {applications.map((application) => {
            // Build a safe CV URL:
            // 1) If cvUrl is already full http(s), use it as-is
            // 2) If it's a relative path (legacy rows), prefix with Supabase storage URL
            let cvHref: string | null = null;

            if (application.cvUrl) {
              const raw = application.cvUrl.trim();
              if (raw.startsWith("http://") || raw.startsWith("https://")) {
                cvHref = raw;
              } else if (supabaseUrl) {
                cvHref = `${supabaseUrl.replace(
                  /\/$/,
                  ""
                )}/storage/v1/object/public/resourcin-uploads/${raw.replace(
                  /^\/+/,
                  ""
                )}`;
              }
            }

            const appliedAtLabel = application.createdAt
              ? new Date(application.createdAt).toLocaleString(undefined, {
                  year: "numeric",
                  month: "short",
                  day: "2-digit",
                  hour: "2-digit",
                  minute: "2-digit",
                })
              : "";

            return (
              <tr key={application.id} className="hover:bg-slate-50/70">
                {/* Candidate */}
                <td className="whitespace-nowrap px-4 py-3 align-top">
                  <div className="font-medium text-slate-900">
                    {application.fullName}
                  </div>
                  {application.source && (
                    <div className="mt-0.5 text-[11px] uppercase tracking-wide text-slate-400">
                      {application.source}
                    </div>
                  )}
                </td>

                {/* Contact */}
                <td className="whitespace-nowrap px-4 py-3 align-top text-xs text-slate-600">
                  <div>{application.email}</div>
                  {application.phone && (
                    <div className="mt-0.5 text-[11px] text-slate-500">
                      {application.phone}
                    </div>
                  )}
                  {application.location && (
                    <div className="mt-0.5 text-[11px] text-slate-500">
                      {application.location}
                    </div>
                  )}
                </td>

                {/* Profile links */}
                <td className="whitespace-nowrap px-4 py-3 align-top text-xs text-slate-600">
                  {application.linkedinUrl && (
                    <div>
                      <a
                        href={application.linkedinUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs font-medium text-[#172965] hover:underline"
                      >
                        LinkedIn
                      </a>
                    </div>
                  )}
                  {application.portfolioUrl && (
                    <div className="mt-1">
                      <a
                        href={application.portfolioUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-[#172965] hover:underline"
                      >
                        Portfolio
                      </a>
                    </div>
                  )}
                </td>

                {/* CV */}
                <td className="whitespace-nowrap px-4 py-3 align-top text-xs text-slate-600">
                  {cvHref ? (
                    <a
                      href={cvHref}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center rounded-full border border-slate-200 px-3 py-1 text-xs font-medium text-[#172965] hover:border-[#172965] hover:bg-slate-50"
                    >
                      Open CV
                    </a>
                  ) : (
                    <span className="text-[11px] text-slate-400">
                      No CV on file
                    </span>
                  )}
                </td>

                {/* Stage */}
                <td className="whitespace-nowrap px-4 py-3 align-top text-xs">
                  <span className="inline-flex rounded-full bg-slate-50 px-2.5 py-1 text-[11px] font-medium uppercase tracking-wide text-slate-600">
                    {application.stage}
                  </span>
                </td>

                {/* Status */}
                <td className="whitespace-nowrap px-4 py-3 align-top text-xs">
                  <span
                    className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-medium uppercase tracking-wide ${
                      application.status === "PENDING"
                        ? "bg-amber-50 text-amber-700"
                        : application.status === "REVIEWING"
                        ? "bg-sky-50 text-sky-700"
                        : application.status === "REJECTED"
                        ? "bg-rose-50 text-rose-700"
                        : application.status === "HIRED"
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-slate-50 text-slate-600"
                    }`}
                  >
                    {application.status}
                  </span>
                </td>

                {/* Applied at */}
                <td className="whitespace-nowrap px-4 py-3 align-top text-xs text-slate-500">
                  {appliedAtLabel}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
