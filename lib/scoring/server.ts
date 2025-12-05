// lib/scoring/server.ts
import { prisma } from "@/lib/prisma";
import type {
  Candidate,
  Job,
  JobApplication,
  Tenant,
} from "@prisma/client";
import type {
  NormalizedScoringConfig,
  SemanticScoringResponse,
  ScoredApplicationView,
  Tier,
} from "./types";

const DEFAULT_SCORING_CONFIG: NormalizedScoringConfig = {
  hiringMode: "balanced",
  thresholds: {
    tierA: 80,
    tierB: 65,
    tierC: 50,
  },
  weights: {
    coreCompetencies: 30,
    experienceQuality: 25,
    education: 15,
    achievements: 15,
    culturalFit: 15,
  },
};

const DEFAULT_TIMEOUT_MS = 5000;

/* ------------------------------------------------------------------------ */
/* Helpers                                                                  */
/* ------------------------------------------------------------------------ */

function clampNumber(
  value: unknown,
  fallback: number,
  min: number,
  max: number,
): number {
  const n =
    typeof value === "number" && Number.isFinite(value) ? value : fallback;
  return Math.min(max, Math.max(min, n));
}

function normalizeScoringConfig(raw: any): NormalizedScoringConfig {
  const hiringModeRaw = raw?.hiringMode;
  const hiringMode: NormalizedScoringConfig["hiringMode"] =
    hiringModeRaw === "volume" ||
    hiringModeRaw === "executive" ||
    hiringModeRaw === "balanced"
      ? hiringModeRaw
      : "balanced";

  const thresholdsRaw = raw?.thresholds ?? {};
  const weightsRaw = raw?.weights ?? {};

  return {
    hiringMode,
    thresholds: {
      tierA: clampNumber(thresholdsRaw.tierA, 80, 1, 100),
      tierB: clampNumber(thresholdsRaw.tierB, 65, 1, 100),
      tierC: clampNumber(thresholdsRaw.tierC, 50, 1, 100),
    },
    weights: {
      coreCompetencies: clampNumber(
        weightsRaw.coreCompetencies,
        30,
        0,
        100,
      ),
      experienceQuality: clampNumber(
        weightsRaw.experienceQuality,
        25,
        0,
        100,
      ),
      education: clampNumber(weightsRaw.education, 15, 0, 100),
      achievements: clampNumber(weightsRaw.achievements, 15, 0, 100),
      culturalFit: clampNumber(weightsRaw.culturalFit, 15, 0, 100),
    },
  };
}

export function mergeScoringConfig(opts: {
  tenantConfig: any;
  jobOverrides: any;
  tenantHiringMode: string | null;
  jobHiringMode: string | null;
}: NormalizedScoringConfig): NormalizedScoringConfig {
  const base: any = {
    ...DEFAULT_SCORING_CONFIG,
    ...(opts.tenantConfig ?? {}),
    ...(opts.jobOverrides ?? {}),
  };

  // Let job override hiringMode > tenant > default
  const hiringMode =
    opts.jobHiringMode || opts.tenantHiringMode || base.hiringMode;

  return normalizeScoringConfig({
    ...base,
    hiringMode,
  });
}

export async function getScoringConfigForJob(jobId: string): Promise<{
  job: Job & { tenant: Tenant };
  tenant: Tenant;
  config: NormalizedScoringConfig;
}> {
  const job = await prisma.job.findUnique({
    where: { id: jobId },
    include: {
      tenant: true,
    },
  });

  if (!job) {
    throw new Error(`Job not found for scoring: ${jobId}`);
  }

  const tenant = job.tenant;

  const config = mergeScoringConfig({
    tenantConfig: (tenant.scoringConfig as any) ?? null,
    jobOverrides: (job.scoringOverrides as any) ?? null,
    tenantHiringMode: tenant.hiringMode ?? null,
    jobHiringMode: job.hiringMode ?? null,
  });

  return { job, tenant, config };
}

function tierFromScore(
  score: number,
  thresholds: NormalizedScoringConfig["thresholds"],
): Tier {
  if (score >= thresholds.tierA) return "A";
  if (score >= thresholds.tierB) return "B";
  if (score >= thresholds.tierC) return "C";
  return "D";
}

/* ------------------------------------------------------------------------ */
/* Scoring service wire types                                               */
/* ------------------------------------------------------------------------ */

type TenantPayload = {
  id: string;
  slug: string;
  plan: string;
  hiringMode: NormalizedScoringConfig["hiringMode"];
};

type JobPayload = {
  id: string;
  title: string;
  description?: string | null;
  requiredSkills: string[];
  experienceLevel?: string | null;
  workMode?: string | null;
  location?: string | null;
  department?: string | null;
  clientName?: string | null;
  hiringMode?: NormalizedScoringConfig["hiringMode"] | null;
};

type CandidatePayload = {
  id?: string;
  fullName?: string;
  email?: string;
  location?: string | null;
  currentTitle?: string | null;
  currentCompany?: string | null;
  linkedinUrl?: string | null;
  githubUrl?: string | null;
  portfolioUrl?: string | null;
  cvUrl?: string | null;
};

type ApplicationPayload = {
  id: string;
  fullName: string;
  email: string;
  location?: string | null;
  source?: string | null;
  howHeard?: string | null;
  coverLetter?: string | null;
  cvUrl?: string | null;
  githubUrl?: string | null;
  portfolioUrl?: string | null;
  noticePeriod?: string | null;
  grossAnnualExpectation?: number | null;
  currentGrossAnnual?: number | null;
};

type ScoringContext = {
  trigger: "application_created" | "manual_rescore" | "batch_rescore";
  jobExternalRef?: string | null;
};

type ScoreApplicationRequest = {
  tenant: TenantPayload;
  job: JobPayload;
  candidate?: CandidatePayload;
  application: ApplicationPayload;
  config: NormalizedScoringConfig;
  context?: ScoringContext;
};

type ScoreApplicationResponseWire = {
  score: number;
  tier?: Tier;
  reason: string;
  risks?: string[];
  redFlags?: string[];
  interviewFocus?: string[];
  engine?: string;
  engineVersion?: string;
};

function buildNeutralResponse(reason: string): SemanticScoringResponse {
  return {
    score: 0,
    reason,
    risks: [],
    redFlags: [],
    interviewFocus: [],
    engine: "semantic-external",
    engineVersion: "unavailable",
  };
}

function isValidWireResponse(json: any): json is ScoreApplicationResponseWire {
  if (!json || typeof json !== "object") return false;
  if (typeof json.score !== "number") return false;
  if (typeof json.reason !== "string") return false;
  return true;
}

function normalizeWireResponse(
  wire: ScoreApplicationResponseWire,
): SemanticScoringResponse {
  return {
    score:
      typeof wire.score === "number" && Number.isFinite(wire.score)
        ? wire.score
        : 0,
    tier: wire.tier,
    reason: wire.reason,
    risks: Array.isArray(wire.risks) ? wire.risks.filter(Boolean) : [],
    redFlags: Array.isArray(wire.redFlags)
      ? wire.redFlags.filter(Boolean)
      : [],
    interviewFocus: Array.isArray(wire.interviewFocus)
      ? wire.interviewFocus.filter(Boolean)
      : [],
    engine: wire.engine ?? "semantic-external",
    engineVersion: wire.engineVersion ?? "v1",
  };
}

async function safeReadText(res: Response): Promise<string | undefined> {
  try {
    return await res.text();
  } catch {
    return undefined;
  }
}

/* ------------------------------------------------------------------------ */
/* Concrete callScoringService                                              */
/* ------------------------------------------------------------------------ */

async function callScoringService(opts: {
  tenant: Tenant;
  job: Job;
  candidate: Candidate | null;
  application: JobApplication;
  config: NormalizedScoringConfig;
}): Promise<SemanticScoringResponse> {
  const { tenant, job, candidate, application, config } = opts;

  const url = process.env.SCORING_SERVICE_URL;
  const apiKey = process.env.SCORING_SERVICE_API_KEY;
  const timeoutMs =
    Number.parseInt(process.env.SCORING_SERVICE_TIMEOUT_MS ?? "", 10) ||
    DEFAULT_TIMEOUT_MS;

  if (!url || !apiKey) {
    console.warn(
      "[scoring] SCORING_SERVICE_URL or SCORING_SERVICE_API_KEY not configured – returning neutral score.",
    );
    return buildNeutralResponse(
      "Scoring service not configured; defaulting to neutral score.",
    );
  }

  const payload: ScoreApplicationRequest = {
    tenant: {
      id: tenant.id,
      slug: tenant.slug,
      plan: tenant.plan,
      hiringMode:
        (tenant.hiringMode as NormalizedScoringConfig["hiringMode"]) ||
        config.hiringMode,
    },
    job: {
      id: job.id,
      title: job.title,
      description: job.description,
      requiredSkills: Array.isArray(job.requiredSkills)
        ? job.requiredSkills
        : [],
      experienceLevel: (job as any).experienceLevel ?? null,
      workMode: (job as any).workMode ?? null,
      location: (job as any).location ?? null,
      department: (job as any).department ?? null,
      clientName: (job as any).aboutClient ?? null,
      hiringMode:
        (job.hiringMode as NormalizedScoringConfig["hiringMode"]) ||
        tenant.hiringMode ||
        config.hiringMode,
    },
    candidate: candidate
      ? {
          id: candidate.id,
          fullName: candidate.fullName,
          email: candidate.email,
          location: candidate.location,
          currentTitle: candidate.currentTitle ?? null,
          currentCompany: candidate.currentCompany ?? null,
          linkedinUrl: (candidate as any).linkedinUrl ?? null,
          githubUrl: (candidate as any).githubUrl ?? null,
          portfolioUrl: (candidate as any).portfolioUrl ?? null,
          cvUrl: candidate.cvUrl ?? null,
        }
      : undefined,
    application: {
      id: application.id,
      fullName: application.fullName,
      email: application.email,
      location: application.location ?? null,
      source: application.source ?? null,
      howHeard: application.howHeard ?? null,
      coverLetter: application.coverLetter ?? null,
      cvUrl: application.cvUrl ?? candidate?.cvUrl ?? null,
      githubUrl: (application as any).githubUrl ?? null,
      portfolioUrl: (application as any).portfolioUrl ?? null,
      noticePeriod: application.noticePeriod ?? null,
      grossAnnualExpectation: application.grossAnnualExpectation ?? null,
      currentGrossAnnual: application.currentGrossAnnual ?? null,
    },
    config,
    context: {
      trigger: "application_created",
    },
  };

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const startedAt = Date.now();

    const res = await fetch(url, {
      method: "POST",
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        // align with our spec: x-api-key
        "x-api-key": apiKey,
      },
      body: JSON.stringify(payload),
    });

    clearTimeout(timeout);

    if (!res.ok) {
      const bodyText = await safeReadText(res);
      console.error(
        "[scoring] Service returned non-2xx:",
        res.status,
        bodyText,
      );

      return buildNeutralResponse(
        `Scoring service error (${res.status}); defaulting to neutral score.`,
      );
    }

    const json = (await res.json()) as unknown;

    if (!isValidWireResponse(json)) {
      console.error("[scoring] Invalid scoring response shape:", json);
      return buildNeutralResponse(
        "Invalid scoring response; defaulting to neutral score.",
      );
    }

    const normalized = normalizeWireResponse(json);
    // clamp score defensively
    normalized.score = clampNumber(normalized.score, 0, 0, 100);

    return normalized;
  } catch (err: any) {
    clearTimeout(timeout);

    if (err?.name === "AbortError") {
      console.error(
        "[scoring] Scoring service request timed out after",
        timeoutMs,
        "ms",
      );
      return buildNeutralResponse(
        "Scoring service timeout; defaulting to neutral score.",
      );
    }

    console.error("[scoring] Unexpected error calling scoring service:", err);
    return buildNeutralResponse(
      "Unexpected error calling scoring service; defaulting to neutral score.",
    );
  }
}

/* ------------------------------------------------------------------------ */
/* scoreAndPersistApplication                                               */
/* ------------------------------------------------------------------------ */

/**
 * Main hook for write-paths:
 * - Calls external scoring service
 * - Updates job_applications.match_score / match_reason
 * - Writes a scoring_events row for audit
 * - Returns a normalized ScoredApplicationView shape for callers (if needed)
 */
export async function scoreAndPersistApplication(
  applicationId: string,
): Promise<ScoredApplicationView | null> {
  const application = await prisma.jobApplication.findUnique({
    where: { id: applicationId },
    include: {
      job: {
        include: {
          tenant: true,
        },
      },
      candidate: true,
    },
  });

  if (!application) {
    console.warn("[scoring] Application not found for scoring:", applicationId);
    return null;
  }

  const job = application.job;
  const tenant = job.tenant;
  const candidate = application.candidate;

  const { config } = await getScoringConfigForJob(job.id);

  const semantic = await callScoringService({
    tenant,
    job,
    candidate,
    application,
    config,
  });

  const score = Math.round(
    Math.min(100, Math.max(0, semantic.score ?? 0)),
  );

  const tier: Tier =
    semantic.tier ?? tierFromScore(score, config.thresholds);

  // Persist on the application itself
  await prisma.jobApplication.update({
    where: { id: application.id },
    data: {
      matchScore: score,
      matchReason:
        semantic.reason ??
        "Scored by semantic CV/JD engine.",
    },
  });

  // Write audit event
  await prisma.scoringEvent.create({
    data: {
      tenantId: tenant.id,
      jobId: job.id,
      applicationId: application.id,
      engine: semantic.engine || "semantic-external",
      engineVersion: semantic.engineVersion || null,
      mode: config.hiringMode,
      score,
      tier,
      configSnapshot: config as any,
      inputSummary: {
        hasCv: Boolean(application.cvUrl || candidate?.cvUrl),
        hasCoverLetter: Boolean(application.coverLetter),
        jobRequiredSkills: job.requiredSkills ?? [],
        source: application.source ?? null,
      },
      reason: semantic.reason ?? null,
      risks: semantic.risks ?? [],
      redFlags: semantic.redFlags ?? [],
    },
  });

  return {
    score,
    tier,
    risks: semantic.risks ?? [],
    redFlags: semantic.redFlags ?? [],
    interviewFocus: semantic.interviewFocus ?? [],
    reason:
      semantic.reason ??
      "Scored by semantic CV/JD engine.",
  };
}
