// app/ats/candidates/page.tsx
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getResourcinTenant } from "@/lib/tenant";
import { defaultScoringConfigForPlan } from "@/lib/scoring";

export const dynamic = "force-dynamic";

function formatDate(value: string | Date | null | undefined) {
  if (!value) return "";
  const d = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function titleCaseFromEnum(value?: string | null) {
  if (!value) return "";
  return value
    .toString()
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function applicationStatusBadgeClass(value?: string | null) {
  const key = (value || "").toUpperCase();
  if (key === "PENDING") {
    return "bg-slate-50 text-slate-700 border-slate-200";
  }
  if (key === "IN_PROGRESS") {
    return "bg-blue-50 text-blue-700 border-blue-100";
  }
  if (key === "ON_HOLD") {
    return "bg-amber-50 text-amber-800 border-amber-100";
  }
  if (key === "HIRED") {
    return "bg-emerald-50 text-emerald-700 border-emerald-100";
  }
  if (key === "REJECTED" || key === "ARCHIVED") {
    return "bg-rose-50 text-rose-700 border-rose-100";
  }
  return "bg-slate-50 text-slate-700 border-slate-200";
}

type Tier = "A" | "B" | "C" | "D";

function tierFromScore(
  score: number,
  thresholds: { A: number; B: number; C: number },
): Tier {
  if (score >= thresholds.A) return "A";
  if (score >= thresholds.B) return "B";
  if (score >= thresholds.C) return "C";
  return "D";
}

function tierBadgeClass(tier: Tier) {
  switch (tier) {
    case "A":
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    case "B":
      return "bg-sky-50 text-sky-700 border-sky-200";
    case "C":
      return "bg-amber-50 text-amber-800 border-amber-200";
    case "D":
    default:
      return "bg-slate-50 text-slate-500 border-slate-200";
  }
}

export default async function AtsCandidatesPage() {
  const tenant = await getResourcinTenant();

  if (!tenant) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-8">
        <h1 className="text-lg font-semibold text-slate-900">
          ATS candidates not available
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          No default tenant configured. Check your{" "}
          <code className="rounded bg-slate-100 px-1 py-0.5 text-[11px]">
            RESOURCIN_TENANT_ID
          </code>{" "}
          or{" "}
          <code className="rounded bg-slate-100 px-1 py-0.5 text-[11px]">
            RESOURCIN_TENANT_SLUG
          </code>
          .
        </p>
      </div>
    );
  }

  const plan = (tenant as any).plan || "free";
  const scoringConfig = defaultScoringConfigForPlan(plan);
  const thresholds = scoringConfig.tierThresholds;
  const engineLabel = scoringConfig.enableNlpBoost
    ? "Scored with Pro/Enterprise engine"
    : "Scored with Free engine";

  const applications = await prisma.jobApplication.findMany({
    where: {
      job: {
        tenantId: tenant.id,
      },
    },
    include: {
      candidate: true,
      job: {
        select: {
          id: true,
          title: true,
          clientCompany: {
            select: {
              name: true,
            },
          },
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 200,
  });

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-6 lg:px-8">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
            ATS · Candidates
          </p>
          <h1 className="mt-1 text-2xl font-semibold text-slate-900">
            Candidate universe
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            All applications across open and closed roles, with bias-reduced
            scoring and tiers.
          </p>
        </div>
        <div className="flex flex-col items-end gap-1 text-right">
          <span className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-medium text-slate-700">
            Plan:{" "}
            <span className="ml-1 capitalize">
              {(plan || "free").toLowerCase()}
            </span>
          </span>
          <span className="text-[10px] text-slate-500">{engineLabel}</span>
        </div>
      </div>

      {applications.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm text-slate-500">
          No applications yet. Once candidates apply to your roles, they will
          appear here with Tier scoring.
        </div>
      ) : (
        <div className="space-y-3">
          {applications.map((app) => {
            const candidate = app.candidate;
            const job = app.job;

            const name =
              candidate?.fullName || app.fullName || "Unnamed candidate";
            const email = candidate?.email || app.email || "";
            const location =
              candidate?.location ||
              app.location ||
              "Location not specified";
            const appliedAt = formatDate(app.createdAt);
            const jobTitle = job?.title || "Untitled role";
            const clientName = job?.clientCompany?.name || null;

            const stageLabel = titleCaseFromEnum(app.stage || "APPLIED");
            const statusLabel = titleCaseFromEnum(app.status || "PENDING");

            const matchScore =
              (app as any).matchScore ?? null; // Int? from Prisma
            const matchReason = (app as any).matchReason || "";

            let tier: Tier | null = null;
            if (typeof matchScore === "number") {
              tier = tierFromScore(matchScore, thresholds);
            }

            const candidateId = candidate?.id;

            return (
              <div
                key={app.id}
                className="flex items-stretch justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm"
              >
                {/* Left: name + job */}
                <div className="flex min-w-0 flex-1 gap-3">
                  <div className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-700">
                    {name
                      .split(" ")
                      .filter(Boolean)
                      .slice(0, 2)
                      .map((part) => part[0]?.toUpperCase())
                      .join("") || "C"}
                  </div>
                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="truncate text-sm font-semibold text-slate-900">
                        {name}
                      </span>
                      {email && (
                        <span className="truncate text-[11px] text-slate-500">
                          {email}
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-600">
                      <span className="font-medium text-slate-800">
                        {jobTitle}
                      </span>
                      {clientName && (
                        <>
                          <span className="text-slate-300">•</span>
                          <span>{clientName}</span>
                        </>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-600">
                      <span>{location}</span>
                      {appliedAt && (
                        <>
                          <span className="text-slate-300">•</span>
                          <span>Applied {appliedAt}</span>
                        </>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
                      <Link
                        href={`/ats/jobs/${job?.id ?? ""}`}
                        className="text-[#172965] hover:underline"
                      >
                        View job pipeline
                      </Link>
                      {candidateId && (
                        <>
                          <span className="text-slate-300">•</span>
                          <Link
                            href={`/ats/candidates/${candidateId}`}
                            className="text-[#172965] hover:underline"
                          >
                            View candidate profile
                          </Link>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right: stage/status + scoring */}
                <div className="flex shrink-0 flex-col items-end justify-between gap-2 text-right text-[11px] text-slate-600">
                  <div className="flex flex-col items-end gap-1">
                    <div className="flex flex-wrap justify-end gap-2">
                      <span className="inline-flex items-center rounded-full bg-slate-50 px-2.5 py-0.5 text-[10px] font-medium text-slate-700">
                        {stageLabel}
                      </span>
                      <span
                        className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-medium ${applicationStatusBadgeClass(
                          app.status,
                        )}`}
                      >
                        {statusLabel}
                      </span>
                    </div>

                    {typeof matchScore === "number" && tier && (
                      <div className="flex flex-wrap items-center justify-end gap-2">
                        <span
                          className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-medium ${tierBadgeClass(
                            tier,
                          )}`}
                        >
                          Tier {tier} · {matchScore}/100
                        </span>
                        <span className="text-[10px] text-slate-500">
                          {engineLabel}
                        </span>
                        {matchReason && (
                          <button
                            type="button"
                            className="inline-flex items-center rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[10px] text-slate-600 hover:bg-slate-50"
                            title={matchReason}
                          >
                            Score breakdown
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
