// app/ats/candidates/page.tsx
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getResourcinTenant } from "@/lib/tenant";

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

function formatStageName(value?: string | null) {
  if (!value) return "";
  const key = value.toUpperCase();
  const map: Record<string, string> = {
    APPLIED: "Applied",
    SCREEN: "Screen",
    SCREENING: "Screening",
    SHORTLISTED: "Shortlisted",
    INTERVIEW: "Interview",
    INTERVIEWING: "Interviewing",
    OFFER: "Offer",
    OFFERED: "Offered",
    HIRED: "Hired",
    REJECTED: "Rejected",
    WITHDRAWN: "Withdrawn",
  };
  if (map[key]) return map[key];
  return titleCaseFromEnum(value);
}

// ---------- Plan / engine helpers ----------

type PlanKey = "free" | "trial_pro" | "pro" | "enterprise" | string;

function resolveEffectivePlan(
  plan: string | null | undefined,
  trialEndsAt: Date | null | undefined,
): PlanKey {
  const base = (plan || "free").toLowerCase();
  const now = new Date();

  if (base === "free" && trialEndsAt && trialEndsAt.getTime() > now.getTime()) {
    return "trial_pro";
  }
  return base;
}

function formatPlanLabel(
  rawPlan: string | null | undefined,
  trialEndsAt: Date | null | undefined,
): string {
  const base = (rawPlan || "free").toLowerCase();
  const now = new Date();

  if (base === "free" && trialEndsAt && trialEndsAt.getTime() > now.getTime()) {
    return "Free · Trial Pro active";
  }
  if (base === "pro") return "Pro";
  if (base === "enterprise") return "Enterprise";
  return "Free";
}

function getEngineLabel(effectivePlan: PlanKey): string {
  const p = (effectivePlan || "free").toLowerCase();
  if (p === "enterprise") return "Enterprise scoring engine";
  if (p === "pro" || p === "trial_pro") return "Pro scoring engine";
  return "Standard scoring engine";
}

function getMatchScoreMeta(score?: number | null) {
  if (score == null) {
    return {
      label: "No score",
      className: "border-slate-200 bg-slate-50 text-slate-500",
    };
  }

  if (score >= 80) {
    return {
      label: `${score}/100 · High match`,
      className: "border-emerald-100 bg-emerald-50 text-emerald-700",
    };
  }

  if (score >= 60) {
    return {
      label: `${score}/100 · Medium match`,
      className: "border-amber-100 bg-amber-50 text-amber-800",
    };
  }

  return {
    label: `${score}/100 · Low match`,
    className: "border-slate-200 bg-slate-50 text-slate-600",
  };
}

export default async function AtsCandidatesPage() {
  const tenant = await getResourcinTenant();
  if (!tenant) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-10">
        <h1 className="text-xl font-semibold text-slate-900">
          ATS candidates not available
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          No default tenant configured. Check{" "}
          <code className="rounded bg-slate-100 px-1 py-0.5 text-[11px]">
            RESOURCIN_TENANT_ID
          </code>{" "}
          or{" "}
          <code className="rounded bg-slate-100 px-1 py-0.5 text-[11px]">
            RESOURCIN_TENANT_SLUG
          </code>{" "}
          in your environment.
        </p>
      </div>
    );
  }

  // Load tenant plan for header
  const fullTenant = await prisma.tenant.findUnique({
    where: { id: tenant.id },
    select: {
      name: true,
      plan: true,
      trialEndsAt: true,
    },
  });

  const rawPlan = fullTenant?.plan ?? "free";
  const trialEndsAt = fullTenant?.trialEndsAt ?? null;
  const effectivePlan = resolveEffectivePlan(rawPlan, trialEndsAt);
  const planLabel = formatPlanLabel(rawPlan, trialEndsAt);
  const engineLabel = getEngineLabel(effectivePlan);

  // Candidates + their applications for this tenant
  const candidates = await prisma.candidate.findMany({
    where: {
      tenantId: tenant.id,
    },
    include: {
      applications: {
        include: {
          job: {
            include: {
              clientCompany: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  const totalCandidates = candidates.length;
  const allApplications = candidates.flatMap((c) => c.applications);
  const totalApplications = allApplications.length;

  const scoredApps = allApplications.filter(
    (app: any) => app.matchScore != null,
  );
  const avgScore =
    scoredApps.length > 0
      ? Math.round(
          scoredApps.reduce((sum, app: any) => sum + Number(app.matchScore), 0) /
            scoredApps.length,
        )
      : null;

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-6 lg:px-8">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link
            href="/ats/dashboard"
            className="inline-flex items-center text-xs font-medium text-slate-500 hover:text-slate-800"
          >
            <span className="mr-1.5">←</span>
            Back to ATS dashboard
          </Link>

          <div className="mt-3 space-y-1">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
              ATS · Talent pool
            </p>
            <h1 className="text-2xl font-semibold text-slate-900 sm:text-3xl">
              Candidates
            </h1>
            <p className="text-xs text-slate-600">
              All candidates associated with{" "}
              <span className="font-medium">
                {fullTenant?.name || tenant.slug || "this tenant"}
              </span>
              .
            </p>
          </div>
        </div>

        <div className="flex flex-col items-end gap-2">
          <div className="flex flex-wrap justify-end gap-2">
            <span className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-medium text-slate-700">
              Plan: {planLabel}
            </span>
          </div>

          <div className="flex flex-wrap justify-end gap-2 text-[11px] text-slate-600">
            <span>
              {totalCandidates}{" "}
              {totalCandidates === 1 ? "candidate" : "candidates"}
            </span>
            <span className="text-slate-300">•</span>
            <span>
              {totalApplications}{" "}
              {totalApplications === 1 ? "application" : "applications"}
            </span>
            {avgScore != null && (
              <>
                <span className="text-slate-300">•</span>
                <span>Avg match score: {avgScore}/100</span>
              </>
            )}
          </div>

          <p className="text-right text-[11px] text-slate-500">
            Candidates are auto-ranked by match score (0–100), using the{" "}
            <span className="font-medium text-slate-700">{engineLabel}</span>.
          </p>
        </div>
      </div>

      {/* Empty state */}
      {totalCandidates === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm text-slate-500">
          No candidates in your talent pool yet. Once applications start coming
          in, you&apos;ll see candidates and their best-matching roles here.
        </div>
      ) : (
        <div className="space-y-3">
          {candidates.map((candidate) => {
            const apps = candidate.applications || [];
            const totalApps = apps.length;

            let bestApp: any = null;
            let bestScore: number | null = null;

            for (const app of apps as any[]) {
              const s =
                app.matchScore != null ? Number(app.matchScore) : null;
              if (s == null) continue;
              if (bestScore == null || s > bestScore) {
                bestScore = s;
                bestApp = app;
              }
            }

            const latestApp = apps[0] || null;
            const lastAppliedAt = latestApp?.createdAt || null;

            const { label: scoreLabel, className: scoreClassName } =
              getMatchScoreMeta(bestScore);

            const bestJob = bestApp?.job;
            const bestJobTitle =
              bestJob?.title || (bestApp && bestApp.fullName) || null;
            const bestClientName =
              bestJob?.clientCompany?.name || "Resourcin client";

            const primaryStage = bestApp?.stage || latestApp?.stage || "APPLIED";
            const primaryStatus =
              bestApp?.status || latestApp?.status || "PENDING";

            return (
              <div
                key={candidate.id}
                className="flex items-stretch justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm"
              >
                {/* Left: avatar + identity */}
                <div className="flex min-w-0 flex-1 gap-3">
                  <div className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-700">
                    {candidate.fullName
                      .split(" ")
                      .filter(Boolean)
                      .slice(0, 2)
                      .map((part) => part[0]?.toUpperCase())
                      .join("") || "C"}
                  </div>

                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        href={`/ats/candidates/${candidate.id}`}
                        className="truncate text-sm font-semibold text-slate-900 hover:text-[#172965] hover:underline"
                      >
                        {candidate.fullName}
                      </Link>
                      {candidate.email && (
                        <span className="truncate text-[11px] text-slate-500">
                          {candidate.email}
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-600">
                      <span className="font-medium text-slate-800">
                        {candidate.location || "Location not set"}
                      </span>
                      {lastAppliedAt && (
                        <>
                          <span className="text-slate-300">•</span>
                          <span>
                            Last applied {formatDate(lastAppliedAt)}
                          </span>
                        </>
                      )}
                      {totalApps > 0 && (
                        <>
                          <span className="text-slate-300">•</span>
                          <span>
                            {totalApps}{" "}
                            {totalApps === 1
                              ? "application"
                              : "applications"}
                          </span>
                        </>
                      )}
                    </div>

                    {bestJob && (
                      <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
                        <span className="font-medium text-slate-800">
                          Best match:
                        </span>
                        <span className="truncate">
                          {bestJobTitle || "Untitled role"}
                        </span>
                        <span className="text-slate-300">•</span>
                        <span>{bestClientName}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right: match + stage/status */}
                <div className="flex shrink-0 flex-col items-end justify-between gap-2 text-right text-[11px] text-slate-600">
                  <div className="flex flex-wrap justify-end gap-2">
                    <span
                      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-medium ${scoreClassName}`}
                    >
                      {scoreLabel}
                    </span>
                    {totalApps > 0 && (
                      <>
                        <span className="inline-flex items-center rounded-full bg-slate-50 px-2.5 py-0.5 text-[10px] font-medium text-slate-700">
                          {formatStageName(primaryStage)}
                        </span>
                        <span className="inline-flex items-center rounded-full bg-slate-50 px-2.5 py-0.5 text-[10px] font-medium text-slate-700">
                          {titleCaseFromEnum(primaryStatus)}
                        </span>
                      </>
                    )}
                  </div>

                  <Link
                    href={`/ats/candidates/${candidate.id}`}
                    className="text-[10px] font-medium text-[#172965] hover:underline"
                  >
                    Open candidate profile ↗
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
