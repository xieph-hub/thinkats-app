// app/admin/applications/[id]/page.tsx
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { notFound } from "next/navigation";
import { revalidatePath } from "next/cache";
import { updateApplicationStage } from "../actions";

export const dynamic = "force-dynamic";

const STAGES = [
  "APPLIED",
  "SCREENING",
  "INTERVIEW",
  "OFFER",
  "HIRED",
  "REJECTED",
];

type PageProps = {
  params: {
    id: string;
  };
};

// Server action to add a note to this application
async function addApplicationNote(formData: FormData) {
  "use server";

  const applicationId = String(formData.get("applicationId") || "").trim();
  const body = String(formData.get("body") || "").trim();
  const authorRaw = String(formData.get("author") || "").trim();
  const author = authorRaw || "Admin";

  if (!applicationId || !body) {
    return;
  }

  // Use the relation on Application so we don't care about the underlying model name
  await prisma.application.update({
    where: { id: applicationId },
    data: {
      notes: {
        create: {
          body,
          author,
        },
      },
    },
  });

  revalidatePath(`/admin/applications/${applicationId}`);
}

export default async function ApplicationDetailPage({ params }: PageProps) {
  const id = params.id;

  const application = await prisma.application.findUnique({
    where: { id },
    include: {
      job: {
        select: {
          id: true,
          title: true,
          slug: true,
          location: true,
          type: true,
          department: true,
        },
      },
      candidate: {
        select: {
          id: true,
          fullname: true,
          email: true,
          phone: true,
          location: true,
          resumeUrl: true,
          source: true,
          createdAt: true,
        },
      },
      notes: {
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          body: true,
          author: true,
          createdAt: true,
        },
      },
    },
  });

  if (!application) {
    notFound();
  }

  const candidate = application.candidate;
  const job = application.job;

  const appliedAt =
    application.createdAt instanceof Date
      ? application.createdAt.toLocaleString("en-NG", {
          year: "numeric",
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })
      : "";

  const candidateFirstSeen =
    candidate?.createdAt instanceof Date
      ? candidate.createdAt.toLocaleDateString("en-NG", {
          year: "numeric",
          month: "short",
          day: "numeric",
        })
      : "";

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50">
      <div className="max-w-5xl mx-auto px-4 py-10 space-y-8">
        {/* Breadcrumb */}
        <nav className="text-[11px] text-slate-400 flex items-center gap-2">
          <Link
            href="/admin"
            className="hover:text-slate-100 hover:underline"
          >
            Admin
          </Link>
          <span>/</span>
          <Link
            href="/admin/applications"
            className="hover:text-slate-100 hover:underline"
          >
            Applications
          </Link>
          <span>/</span>
          <span className="text-slate-200">
            {candidate?.fullname || candidate?.email || "Application"}
          </span>
        </nav>

        {/* Header summary */}
        <header className="space-y-3">
          <p className="text-[11px] uppercase tracking-[0.15em] text-[#FFB703] font-semibold">
            Application detail
          </p>
          <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <div className="space-y-1">
              <h1 className="text-2xl font-semibold">
                {candidate?.fullname || candidate?.email || "Candidate"}
              </h1>
              {job && (
                <p className="text-sm text-slate-300">
                  Applied for{" "}
                  <span className="font-medium text-slate-50">
                    {job.title}
                  </span>
                  {job.location ? ` · ${job.location}` : ""}
                </p>
              )}
              {appliedAt && (
                <p className="text-[11px] text-slate-400">
                  Application received: {appliedAt}
                </p>
              )}
            </div>

            {/* Stage control */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 px-4 py-3 space-y-2 w-full md:w-auto">
              <p className="text-[11px] font-medium text-slate-400">
                Stage
              </p>
              <form
                action={updateApplicationStage}
                className="flex flex-wrap items-center gap-2"
              >
                <input type="hidden" name="id" value={application.id} />
                <select
                  name="stage"
                  defaultValue={application.stage}
                  className="rounded-full border border-slate-700 bg-slate-950 px-3 py-1.5 text-[11px] outline-none focus:border-[#FFB703] focus:ring-1 focus:ring-[#FFB703]"
                >
                  {STAGES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
                <button
                  type="submit"
                  className="rounded-full bg-[#FFB703] px-3 py-1.5 text-[11px] font-semibold text-slate-950 hover:bg-[#ffca3a] transition"
                >
                  Update stage
                </button>
              </form>
            </div>
          </div>
        </header>

        {/* Main layout */}
        <div className="grid gap-6 md:grid-cols-[minmax(0,2fr)_minmax(0,1.6fr)]">
          {/* Left: Candidate + Job */}
          <section className="space-y-4">
            {/* Candidate card */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 space-y-3">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-sm font-semibold">Candidate</h2>
                {candidateFirstSeen && (
                  <p className="text-[11px] text-slate-400">
                    First seen: {candidateFirstSeen}
                  </p>
                )}
              </div>

              <div className="space-y-2 text-xs text-slate-200">
                {candidate?.fullname && (
                  <p>
                    <span className="text-slate-400">Name:</span>{" "}
                    {candidate.fullname}
                  </p>
                )}

                {candidate?.email && (
                  <p>
                    <span className="text-slate-400">Email:</span>{" "}
                    <a
                      href={`mailto:${candidate.email}`}
                      className="underline hover:text-slate-50"
                    >
                      {candidate.email}
                    </a>
                  </p>
                )}

                {candidate?.phone && (
                  <p>
                    <span className="text-slate-400">Phone:</span>{" "}
                    <a
                      href={`tel:${candidate.phone}`}
                      className="hover:text-slate-50"
                    >
                      {candidate.phone}
                    </a>
                  </p>
                )}

                {candidate?.location && (
                  <p>
                    <span className="text-slate-400">Location:</span>{" "}
                    {candidate.location}
                  </p>
                )}

                {candidate?.source && (
                  <p>
                    <span className="text-slate-400">Source:</span>{" "}
                    {candidate.source}
                  </p>
                )}

                <div className="pt-2">
                  <p className="text-[11px] text-slate-400 mb-1">
                    CV / Resume
                  </p>
                  {candidate?.resumeUrl ? (
                    <a
                      href={candidate.resumeUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center rounded-full border border-slate-600 px-3 py-1.5 text-[11px] hover:border-[#FFB703] hover:text-[#FFB703] transition"
                    >
                      Open CV in new tab
                    </a>
                  ) : (
                    <span className="text-[11px] text-slate-500">
                      No CV URL stored for this candidate.
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Job card */}
            {job && (
              <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="text-sm font-semibold">Job</h2>
                  {job.slug && (
                    <Link
                      href={`/jobs/${job.slug}`}
                      className="text-[11px] text-[#FFB703] underline hover:text-[#ffca3a]"
                    >
                      View public posting
                    </Link>
                  )}
                </div>

                <div className="space-y-2 text-xs text-slate-200">
                  <p className="text-sm font-medium text-slate-50">
                    {job.title}
                  </p>

                  <div className="flex flex-wrap gap-2 text-[11px] text-slate-300">
                    {job.department && (
                      <span className="inline-flex items-center rounded-full border border-slate-700 px-2 py-1">
                        {job.department}
                      </span>
                    )}
                    {job.type && (
                      <span className="inline-flex items-center rounded-full border border-slate-700 px-2 py-1">
                        {job.type}
                      </span>
                    )}
                    {job.location && (
                      <span className="inline-flex items-center rounded-full border border-slate-700 px-2 py-1">
                        {job.location}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}
          </section>

          {/* Right: Timeline + Notes */}
          <section className="space-y-4">
            {/* Timeline */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 space-y-3">
              <h2 className="text-sm font-semibold mb-1">Timeline</h2>
              <ol className="relative border-l border-slate-700/70 ml-2 space-y-4 text-xs">
                {/* Application created */}
                <li className="ml-4">
                  <div className="absolute -left-[9px] mt-1 h-2 w-2 rounded-full bg-[#FFB703]" />
                  <p className="font-medium text-slate-100">
                    Application received
                  </p>
                  {appliedAt && (
                    <p className="text-[11px] text-slate-400">{appliedAt}</p>
                  )}
                  <p className="text-[11px] text-slate-400 mt-1">
                    Current stage:{" "}
                    <span className="font-semibold">
                      {application.stage}
                    </span>
                  </p>
                </li>

                {/* Notes events */}
                {application.notes.map((note) => {
                  const noteTime =
                    note.createdAt instanceof Date
                      ? note.createdAt.toLocaleString("en-NG", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "";

                  return (
                    <li key={note.id} className="ml-4">
                      <div className="absolute -left-[9px] mt-1 h-2 w-2 rounded-full bg-slate-500" />
                      <p className="font-medium text-slate-100">
                        {note.author || "Note"}
                      </p>
                      <p className="text-[11px] text-slate-400">
                        {noteTime}
                      </p>
                      <p className="mt-1 text-[11px] text-slate-200 whitespace-pre-wrap">
                        {note.body}
                      </p>
                    </li>
                  );
                })}
              </ol>
            </div>

            {/* Add note */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 space-y-3">
              <h2 className="text-sm font-semibold">Add internal note</h2>
              <p className="text-[11px] text-slate-400">
                Notes are only visible inside{" "}
                <span className="font-medium text-slate-200">Resourcin</span>.
                Use this for interview feedback, red flags, and next steps.
              </p>

              <form action={addApplicationNote} className="space-y-3">
                <input
                  type="hidden"
                  name="applicationId"
                  value={application.id}
                />

                <div className="space-y-1">
                  <label className="block text-[11px] font-medium text-slate-400">
                    Note
                  </label>
                  <textarea
                    name="body"
                    rows={4}
                    required
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs outline-none focus:border-[#FFB703] focus:ring-1 focus:ring-[#FFB703]"
                    placeholder="E.g. Strong on stakeholder management, needs support on technical depth. Recommended for panel."
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[11px] font-medium text-slate-400">
                    Your name (optional)
                  </label>
                  <input
                    name="author"
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs outline-none focus:border-[#FFB703] focus:ring-1 focus:ring-[#FFB703]"
                    placeholder="E.g. Victor"
                  />
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="inline-flex items-center rounded-full bg-[#FFB703] px-4 py-2 text-[11px] font-semibold text-slate-950 hover:bg-[#ffca3a] transition"
                  >
                    Save note
                  </button>
                </div>
              </form>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
