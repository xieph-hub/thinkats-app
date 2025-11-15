// app/admin/applications/[id]/page.tsx
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { notFound } from "next/navigation";

export const runtime = "nodejs";

type PageProps = {
  params: {
    id: string;
  };
};

export default async function ApplicationDetailPage({ params }: PageProps) {
  const application = await prisma.application.findUnique({
    where: { id: params.id },
    include: {
      job: {
        select: {
          id: true,
          title: true,
          slug: true,
          location: true,
          type: true,
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
        },
      },
    },
  });

  if (!application) {
    notFound();
  }

  const candidate = application.candidate;
  const job = application.job;

  return (
    <main className="mx-auto max-w-3xl px-4 py-10 space-y-8">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs text-slate-500 mb-2">
            <Link
              href="/admin/applications"
              className="text-[#172965] underline underline-offset-2 hover:text-[#101c44]"
            >
              ← Back to applications
            </Link>
          </p>
          <h1 className="text-2xl font-semibold text-[#172965]">
            {candidate?.fullname || "Candidate"}
          </h1>
          <p className="mt-1 text-xs text-slate-500">
            {candidate?.email || "No email"}
            {candidate?.phone ? ` · ${candidate.phone}` : ""}
          </p>
        </div>

        <div className="text-right text-xs">
          <p className="mb-1 text-slate-500">Stage</p>
          <span className="inline-flex rounded-full bg-[#172965]/8 px-3 py-1 text-[11px] font-medium text-[#172965]">
            {application.stage}
          </span>
        </div>
      </div>

      {/* Job info */}
      <section className="rounded-2xl border border-slate-200 bg-white/80 p-4 space-y-2 text-sm shadow-sm">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Job
        </h2>
        <p className="text-slate-900 font-medium">
          {job?.title || "Unknown job"}
        </p>
        <p className="text-xs text-slate-500">
          {job?.location || ""}
          {job?.type ? ` · ${job.type}` : ""}
        </p>
      </section>

      {/* Candidate info */}
      <section className="rounded-2xl border border-slate-200 bg-white/80 p-4 space-y-3 text-sm shadow-sm">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Candidate details
        </h2>
        <dl className="space-y-2 text-xs">
          <div className="flex justify-between gap-4">
            <dt className="text-slate-500">Full name</dt>
            <dd className="text-slate-900 text-right">
              {candidate?.fullname || "—"}
            </dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-slate-500">Email</dt>
            <dd className="text-slate-900 text-right">
              {candidate?.email || "—"}
            </dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-slate-500">Phone</dt>
            <dd className="text-slate-900 text-right">
              {candidate?.phone || "—"}
            </dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-slate-500">Location</dt>
            <dd className="text-slate-900 text-right">
              {candidate?.location || "—"}
            </dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-slate-500">Resume</dt>
            <dd className="text-right">
              {candidate?.resumeUrl ? (
                <a
                  href={candidate.resumeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#172965] underline underline-offset-2 hover:text-[#101c44]"
                >
                  View resume
                </a>
              ) : (
                <span className="text-slate-900">—</span>
              )}
            </dd>
          </div>
        </dl>
      </section>

      {/* Meta */}
      <section className="rounded-2xl border border-slate-200 bg-white/80 p-4 text-xs text-slate-500 shadow-sm">
        <p>
          Application ID:{" "}
          <span className="font-mono text-slate-700">{application.id}</span>
        </p>
        <p className="mt-1">
          Created:{" "}
          {application.createdAt
            ? new Date(application.createdAt).toLocaleString("en-GB", {
                day: "2-digit",
                month: "short",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })
            : "—"}
        </p>
      </section>
    </main>
  );
}
