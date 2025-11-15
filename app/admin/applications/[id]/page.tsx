// app/admin/applications/[id]/page.tsx

import { prisma } from "@/lib/db";
import Link from "next/link";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

async function getApplicationSafe(id: string) {
  try {
    const application = await prisma.application.findUnique({
      where: { id },
      include: {
        job: true,
        candidate: true,
        notes: {
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!application) {
      return { application: null, error: "Application not found." };
    }

    return { application, error: null as string | null };
  } catch (err) {
    console.error("Application detail error:", err);
    return {
      application: null,
      error: "Could not load this application from the database.",
    };
  }
}

export default async function ApplicationDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const { id } = params;
  const { application, error } = await getApplicationSafe(id);

  if (!application && !error) {
    // Truly not found, let Next.js show 404
    notFound();
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50">
      <div className="max-w-5xl mx-auto px-4 py-10 space-y-8">
        {/* Top bar */}
        <header className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              {application?.candidate?.name || "Application"}
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              {application?.job?.title
                ? `Applied for ${application.job.title}`
                : "Role information not available."}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/admin/applications"
              className="text-xs sm:text-sm text-slate-400 hover:text-slate-200 underline underline-offset-4"
            >
              ← Back to applications
            </Link>
          </div>
        </header>

        {/* Error state */}
        {error && (
          <div className="rounded-2xl border border-red-500/40 bg-red-950/20 px-4 py-3 text-sm text-red-200">
            <div className="font-medium mb-1">We couldn&apos;t load this application.</div>
            <div className="text-xs text-red-200/80">
              {error} Please confirm your database connection and try again.
            </div>
          </div>
        )}

        {!error && application && (
          <div className="space-y-6">
            {/* Candidate + Job summary */}
            <section className="grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                <h2 className="text-sm font-semibold text-slate-200 mb-3">
                  Candidate
                </h2>
                <div className="space-y-1 text-sm">
                  <div>
                    <span className="text-slate-400">Name:</span>{" "}
                    <span className="text-slate-100">
                      {application.candidate?.name || "—"}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400">Email:</span>{" "}
                    <span className="text-slate-100">
                      {application.candidate?.email || "—"}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400">Phone:</span>{" "}
                    <span className="text-slate-100">
                      {application.candidate?.phone || "—"}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400">Location:</span>{" "}
                    <span className="text-slate-100">
                      {application.candidate?.location || "—"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                <h2 className="text-sm font-semibold text-slate-200 mb-3">
                  Role & Application
                </h2>
                <div className="space-y-1 text-sm">
                  <div>
                    <span className="text-slate-400">Role:</span>{" "}
                    <span className="text-slate-100">
                      {application.job?.title || "—"}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400">Location:</span>{" "}
                    <span className="text-slate-100">
                      {application.job?.location || "—"}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400">Stage:</span>{" "}
                    <span className="inline-flex items-center rounded-full border border-slate-700 bg-slate-950/80 px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-slate-200">
                      {application.stage}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400">Source:</span>{" "}
                    <span className="text-slate-100">
                      {application.source || "Website"}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400">Applied:</span>{" "}
                    <span className="text-slate-100">
                      {new Date(
                        application.createdAt as unknown as string
                      )
                        .toISOString()
                        .slice(0, 16)
                        .replace("T", " ")}
                    </span>
                  </div>
                </div>
              </div>
            </section>

            {/* Resume + Notes placeholder */}
            <section className="grid gap-4 md:grid-cols-[2fr,1.3fr]">
              {/* Resume / raw text */}
              <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-sm font-semibold text-slate-200">
                    Resume / Profile
                  </h2>
                  {application.candidate?.resumeUrl && (
                    <a
                      href={application.candidate.resumeUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-amber-400 hover:text-amber-300 underline underline-offset-4"
                    >
                      Open original resume
                    </a>
                  )}
                </div>
                {application.candidate?.rawText ? (
                  <pre className="whitespace-pre-wrap text-xs text-slate-200 bg-slate-950/40 rounded-xl p-3 max-h-[320px] overflow-auto">
                    {application.candidate.rawText}
                  </pre>
                ) : (
                  <p className="text-xs text-slate-400">
                    No parsed resume text stored yet. In a later phase, we&apos;ll
                    plug in a parser here.
                  </p>
                )}
              </div>

              {/* Notes (read-only for now) */}
              <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                <h2 className="text-sm font-semibold text-slate-200 mb-3">
                  Notes
                </h2>
                {application.notes.length === 0 ? (
                  <p className="text-xs text-slate-400">
                    No notes yet. In the next iteration, we&apos;ll add the ability
                    to leave recruiter / HM notes against this application.
                  </p>
                ) : (
                  <div className="space-y-3 max-h-[320px] overflow-auto pr-1">
                    {application.notes.map((note) => (
                      <div
                        key={note.id}
                        className="rounded-xl border border-slate-800 bg-slate-950/60 px-3 py-2 text-xs"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium text-slate-100">
                            {note.author || "System"}
                          </span>
                          <span className="text-[10px] text-slate-500">
                            {new Date(
                              note.createdAt as unknown as string
                            )
                              .toISOString()
                              .slice(0, 16)
                              .replace("T", " ")}
                          </span>
                        </div>
                        <p className="text-slate-200 whitespace-pre-wrap">
                          {note.body}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>
          </div>
        )}
      </div>
    </main>
  );
}
