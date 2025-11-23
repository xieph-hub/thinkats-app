"use client";

const SUPABASE_PUBLIC_URL =
  (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").replace(/\/$/, "");

/**
 * Turn whatever is stored in cvUrl into a usable href.
 *
 * - If it's already a full http/https URL → return as-is.
 * - If it's a relative storage path (e.g. "cvs/email/file.pdf") →
 *   build a Supabase public URL under the `resourcin-uploads` bucket.
 * - If env is missing or value is empty → return null.
 */
function resolveCvHref(raw?: string | null): string | null {
  if (!raw) return null;

  const trimmed = raw.trim();
  if (!trimmed) return null;

  // Already a full URL (Supabase, Drive, Dropbox, etc.)
  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }

  // We expect this to be a path inside the `resourcin-uploads` bucket
  if (!SUPABASE_PUBLIC_URL) {
    // Env misconfig – better to show "No CV" than a broken link
    return null;
  }

  const normalizedPath = trimmed.replace(/^\/+/, "");

  return `${SUPABASE_PUBLIC_URL}/storage/v1/object/public/resourcin-uploads/${normalizedPath}`;
}

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
  createdAt: string;
};

type ApplicationsTableClientProps = {
  applications: Application[];
};

function formatDate(value: string) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function ApplicationsTableClient({
  applications,
}: ApplicationsTableClientProps) {
  return (
    <section className="mt-6 rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 px-4 py-3">
        <h2 className="text-sm font-semibold text-slate-900">
          Applications ({applications.length})
        </h2>
      </div>

      {applications.length === 0 ? (
        <div className="px-4 py-8 text-center text-sm text-slate-500">
          No applications yet. As candidates apply, they’ll appear here.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-100 text-sm">
            <thead className="bg-slate-50">
              <tr className="text-xs uppercase tracking-wide text-slate-500">
                <th className="px-4 py-2 text-left">Candidate</th>
                <th className="px-4 py-2 text-left">Contact</th>
                <th className="px-4 py-2 text-left">Location</th>
                <th className="px-4 py-2 text-left">LinkedIn</th>
                <th className="px-4 py-2 text-left">CV</th>
                <th className="px-4 py-2 text-left">Source</th>
                <th className="px-4 py-2 text-left">Stage</th>
                <th className="px-4 py-2 text-left">Status</th>
                <th className="px-4 py-2 text-left">Applied</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {applications.map((application) => {
                const cvHref = resolveCvHref(application.cvUrl);

                return (
                  <tr key={application.id} className="hover:bg-slate-50/60">
                    <td className="px-4 py-2 align-top">
                      <div className="font-medium text-slate-900">
                        {application.fullName}
                      </div>
                      {application.coverLetter && (
                        <div className="mt-0.5 line-clamp-2 text-[11px] text-slate-500">
                          {application.coverLetter}
                        </div>
                      )}
                    </td>

                    <td className="px-4 py-2 align-top text-xs text-slate-600">
                      <div>{application.email}</div>
                      {application.phone && (
                        <div className="mt-0.5 text-slate-500">
                          {application.phone}
                        </div>
                      )}
                    </td>

                    <td className="px-4 py-2 align-top text-xs text-slate-600">
                      {application.location || (
                        <span className="text-slate-400">–</span>
                      )}
                    </td>

                    <td className="px-4 py-2 align-top text-xs">
                      {application.linkedinUrl ? (
                        <a
                          href={application.linkedinUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center text-[#172965] hover:underline"
                        >
                          View profile
                        </a>
                      ) : (
                        <span className="text-slate-400">–</span>
                      )}
                    </td>

                    <td className="px-4 py-2 align-top text-xs">
                      {cvHref ? (
                        <a
                          href={cvHref}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center rounded-full border border-slate-200 px-2 py-1 text-[11px] font-medium text-[#172965] hover:border-[#172965] hover:bg-slate-50"
                        >
                          Open CV
                        </a>
                      ) : (
                        <span className="text-slate-400">No CV</span>
                      )}
                    </td>

                    <td className="px-4 py-2 align-top text-xs text-slate-600">
                      {application.source || (
                        <span className="text-slate-400">–</span>
                      )}
                    </td>

                    <td className="px-4 py-2 align-top text-xs">
                      <span className="inline-flex rounded-full bg-slate-50 px-2 py-0.5 text-[11px] font-medium text-slate-700">
                        {application.stage}
                      </span>
                    </td>

                    <td className="px-4 py-2 align-top text-xs">
                      <span className="inline-flex rounded-full bg-slate-50 px-2 py-0.5 text-[11px] font-medium text-slate-700">
                        {application.status}
                      </span>
                    </td>

                    <td className="px-4 py-2 align-top text-xs text-slate-500">
                      {formatDate(application.createdAt)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
