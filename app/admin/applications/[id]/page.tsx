// app/admin/applications/[id]/page.tsx

import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { updateApplicationStage } from "../actions";

const STAGES = [
  "APPLIED",
  "SCREENING",
  "HM_INTERVIEW",
  "PANEL",
  "OFFER",
  "HIRED",
  "REJECTED",
];

export default async function ApplicationDetailPage({
  params,
}: {
  params: { id: string };
}) {
  // Cast result to any so we don't fight TypeScript over exact field names
  const application = (await prisma.application.findUnique({
    where: { id: params.id },
    include: {
      job: true,
    },
  })) as any;

  if (!application) return notFound();

  const job = application.job;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 p-6">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header: candidate basic info */}
        <header className="flex flex-col gap-2">
          <h1 className="text-2xl font-semibold">
            {application.fullName ??
              application.fullname ??
              application.name ??
              "Candidate"}
          </h1>
          <p className="text-sm text-slate-400">
            {application.email}
            {application.phone ? ` · ${application.phone}` : ""}
          </p>
          <p className="text-sm text-slate-400">
            Applied for{" "}
            <span className="font-medium text-slate-100">
              {job?.title ?? "—"}
            </span>
          </p>
        </header>

        {/* Stage & meta */}
        <section className="grid gap-6 md:grid-cols-[2fr,1.5fr]">
          {/* Stage card */}
          <div className="space-y-4 rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">
              Stage
            </h2>
            <form action={updateApplicationStage} className="space-y-3">
              <input type="hidden" name="id" value={application.id} />
              <select
                name="stage"
                defaultValue={application.stage}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
              >
                {STAGES.map((stage) => (
                  <option key={stage} value={stage}>
                    {stage}
                  </option>
                ))}
              </select>
              <button
                type="submit"
                className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-medium text-slate-950 hover:bg-emerald-400"
              >
                Update stage
              </button>
            </form>

            <div className="pt-4 border-t border-slate-800 mt-4">
              <p className="text-xs text-slate-500">
                Created:{" "}
                {application.createdAt?.toLocaleString?.("en-GB", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
              <p className="text-xs text-slate-500">
                Last updated:{" "}
                {application.updatedAt?.toLocaleString?.("en-GB", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
          </div>

          {/* Quick metadata */}
          <div className="space-y-3 rounded-2xl border border-slate-800 bg-slate-900/70 p-4 text-sm">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">
              Application details
            </h2>
            <div className="space-y-1">
              <p className="text-slate-300">
                <span className="text-slate-500">Job:</span>{" "}
                {job?.title ?? "—"}
              </p>
              {job?.department && (
                <p className="text-slate-300">
                  <span className="text-slate-500">Department:</span>{" "}
                  {job.department}
                </p>
              )}
              {job?.location && (
                <p className="text-slate-300">
                  <span className="text-slate-500">Location:</span>{" "}
                  {job.location}
                </p>
              )}
              {application.source && (
                <p className="text-slate-300">
                  <span className="text-slate-500">Source:</span>{" "}
                  {application.source}
                </p>
              )}
              {application.resumeUrl && (
                <p className="text-slate-300">
                  <a
                    href={application.resumeUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-emerald-400 hover:text-emerald-300 text-xs"
                  >
                    View resume
                  </a>
                </p>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
