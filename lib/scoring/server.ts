// lib/scoring/server.ts
import { prisma } from "@/lib/prisma";
import type { Job, JobApplication, Candidate, Tenant } from "@prisma/client";
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
  tenantConfig?: any;
  jobOverrides?: any;
  tenantHiringMode?: string | null;
  jobHiringMode?: string | null;
}): NormalizedScoringConfig {
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

  if (!url || !apiKey) {
    console.warn(
      "[scoring] SCORING_SERVICE_URL or SCORING_SERVICE_API_KEY not configured – returning neutral score.",
    );
    const fallback: SemanticScoringResponse = {
      score: 0,
      reason: "Scoring service not configured.",
      risks: [],
      redFlags: [],
      interviewFocus: [],
      engine: "semantic-external",
      engineVersion: "v1",
    };
    return fallback;
  }

  const controller = new AbortController();
  const timeoutMs = Number(process.env.SCORING_SERVICE_TIMEOUT_MS ?? "5000");
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      method: "POST",
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        tenant: {
          id: tenant.id,
          slug: tenant.slug,
          plan: tenant.plan,
          hiringMode: tenant.hiringMode,
        },
        job: {
          id: job.id,
          title: job.title,
          description: job.description,
          requiredSkills: job.requiredSkills,
          experienceLevel: job.experienceLevel,
          workMode: job.workMode,
          hiringMode: job.hiringMode,
        },
        candidate: candidate
          ? {
              id: candidate.id,
              fullName: candidate.fullName,
              email: candidate.email,
              location: candidate.location,
              currentTitle: candidate.currentTitle,
              currentCompany: candidate.currentCompany,
              cvUrl: candidate.cvUrl,
            }
          : null,
        application: {
          id: application.id,
          fullName: application.fullName,
          email: application.email,
          location: application.location,
          cvUrl: application.cvUrl,
          coverLetter: application.coverLetter,
          githubUrl: application.githubUrl,
          howHeard: application.howHeard,
          source: application.source,
        },
        config,
        context: {
          trigger: "application_created",
        },
      }),
    });

    if (!response.ok) {
      console.error(
        "[scoring] Service returned non-2xx:",
        response.status,
        await response.text().catch(() => ""),
      );
      const fallback: SemanticScoringResponse = {
        score: 0,
        reason: `Scoring service error (${response.status})`,
        risks: [],
        redFlags: [],
        interviewFocus: [],
        engine: "semantic-external",
        engineVersion: "v1",
      };
      return fallback;
    }

    const json = (await response.json()) as SemanticScoringResponse;

    if (typeof json.score !== "number" || !Number.isFinite(json.score)) {
      console.error("[scoring] Invalid score payload:", json);
      const fallback: SemanticScoringResponse = {
        score: 0,
        reason: "Scoring service returned invalid payload.",
        risks: [],
        redFlags: [],
        interviewFocus: [],
        engine: "semantic-external",
        engineVersion: "v1",
      };
      return fallback;
    }

    return json;
  } catch (err) {
    if ((err as any).name === "AbortError") {
      console.error("[scoring] Service timed out after", timeoutMs, "ms");
      const fallback: SemanticScoringResponse = {
        score: 0,
        reason: "Scoring service timeout.",
        risks: [],
        redFlags: [],
        interviewFocus: [],
        engine: "semantic-external",
        engineVersion: "v1",
      };
      return fallback;
    }

    console.error("[scoring] Unexpected error calling scoring service:", err);
    const fallback: SemanticScoringResponse = {
      score: 0,
      reason: "Unexpected error calling scoring service.",
      risks: [],
      redFlags: [],
      interviewFocus: [],
      engine: "semantic-external",
      engineVersion: "v1",
    };
    return fallback;
  } finally {
    clearTimeout(timeout);
  }
}

function normaliseCategory(cat: string | null | undefined): string {
  const trimmed = (cat || "").trim();
  return trimmed || "uncategorised";
}

function externalSourceKey(skill: any): string {
  const src = (skill?.externalSource || "").toLowerCase().trim();
  if (!src) return "local";
  if (src === "esco") return "esco";
  return src;
}

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

  // -----------------------------------------------------------------------
  // Feature extraction for skills / ESCO coverage
  // -----------------------------------------------------------------------
  const jobSkills = await prisma.jobSkill.findMany({
    where: {
      tenantId: tenant.id,
      jobId: job.id,
    },
    include: {
      skill: true,
    },
  });

  const candidateSkills = candidate
    ? await prisma.candidateSkill.findMany({
        where: {
          tenantId: tenant.id,
          candidateId: candidate.id,
        },
        include: {
          skill: true,
        },
      })
    : [];

  const jobSkillIds = new Set(jobSkills.map((js) => js.skillId));
  const candidateSkillIds = new Set(
    candidateSkills.map((cs) => cs.skillId),
  );

  const matchedSkillIds: string[] = [];
  for (const id of jobSkillIds) {
    if (candidateSkillIds.has(id)) {
      matchedSkillIds.push(id);
    }
  }

  const matchedSkillNames: string[] = [];
  for (const id of matchedSkillIds) {
    const fromJob = jobSkills.find((js) => js.skillId === id)?.skill;
    const fromCandidate = candidateSkills.find(
      (cs) => cs.skillId === id,
    )?.skill;
    const skillEntity = fromJob || fromCandidate;
    if (skillEntity?.name) {
      matchedSkillNames.push(skillEntity.name);
    }
  }

  const categoryStats: Record<
    string,
    { jobSkills: number; candidateSkills: number; matchedSkills: number }
  > = {};

  function ensureCategory(cat: string | null | undefined) {
    const key = normaliseCategory(cat);
    if (!categoryStats[key]) {
      categoryStats[key] = {
        jobSkills: 0,
        candidateSkills: 0,
        matchedSkills: 0,
      };
    }
    return key;
  }

  for (const js of jobSkills) {
    const key = ensureCategory(js.skill.category);
    categoryStats[key].jobSkills += 1;
  }

  for (const cs of candidateSkills) {
    const key = ensureCategory(cs.skill.category);
    categoryStats[key].candidateSkills += 1;
  }

  for (const id of matchedSkillIds) {
    const fromJob = jobSkills.find((js) => js.skillId === id)?.skill;
    const fromCandidate = candidateSkills.find(
      (cs) => cs.skillId === id,
    )?.skill;
    const skillEntity = fromJob || fromCandidate;
    const key = ensureCategory(skillEntity?.category ?? null);
    categoryStats[key].matchedSkills += 1;
  }

  const externalSourceStats: Record<
    string,
    { jobSkills: number; candidateSkills: number; matchedSkills: number }
  > = {};

  function ensureExternalKey(key: string) {
    if (!externalSourceStats[key]) {
      externalSourceStats[key] = {
        jobSkills: 0,
        candidateSkills: 0,
        matchedSkills: 0,
      };
    }
  }

  for (const js of jobSkills) {
    const key = externalSourceKey(js.skill);
    ensureExternalKey(key);
    externalSourceStats[key].jobSkills += 1;
  }

  for (const cs of candidateSkills) {
    const key = externalSourceKey(cs.skill);
    ensureExternalKey(key);
    externalSourceStats[key].candidateSkills += 1;
  }

  for (const id of matchedSkillIds) {
    const fromJob = jobSkills.find((js) => js.skillId === id)?.skill;
    const fromCandidate = candidateSkills.find(
      (cs) => cs.skillId === id,
    )?.skill;
    const skillEntity = fromJob || fromCandidate;
    const key = externalSourceKey(skillEntity);
    ensureExternalKey(key);
    externalSourceStats[key].matchedSkills += 1;
  }

  const hasCv = Boolean(application.cvUrl || candidate?.cvUrl);
  const hasCoverLetter = Boolean(application.coverLetter);
  const hasJobSkills = jobSkills.length > 0;
  const hasCandidateSkills = candidateSkills.length > 0;
  const hasRequiredSkills = (job.requiredSkills?.length ?? 0) > 0;

  // -----------------------------------------------------------------------
  // Call external semantic scoring service
  // -----------------------------------------------------------------------
  const semantic: SemanticScoringResponse = await callScoringService({
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
    (semantic.tier as Tier | undefined) ??
    tierFromScore(score, config.thresholds);

  // -----------------------------------------------------------------------
  // Persist application + scoring event
  // -----------------------------------------------------------------------
  await prisma.jobApplication.update({
    where: { id: application.id },
    data: {
      matchScore: score,
      matchReason:
        semantic.reason ??
        "Scored by semantic CV/JD engine.",
    },
  });

  const inputSummary: any = {
    hasCv,
    hasCoverLetter,
    jobRequiredSkills: job.requiredSkills ?? [],
    source: application.source ?? null,
    features: {
      usedCv: hasCv,
      usedCoverLetter: hasCoverLetter,
      hasJobSkills,
      hasCandidateSkills,
      hasRequiredSkills,
    },
    skills: {
      jobSkillCount: jobSkills.length,
      candidateSkillCount: candidateSkills.length,
      matchedSkillCount: matchedSkillIds.length,
      matchedSkillNames,
      categories: categoryStats,
      externalSources: externalSourceStats,
    },
  };

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
      inputSummary,
      reason: semantic.reason ?? null,
      risks: semantic.risks ?? [],
      redFlags: semantic.redFlags ?? [],
    },
  });

  const view: ScoredApplicationView = {
    score,
    tier,
    risks: semantic.risks ?? [],
    redFlags: semantic.redFlags ?? [],
    interviewFocus: semantic.interviewFocus ?? [],
    reason:
      semantic.reason ??
      "Scored by semantic CV/JD engine.",
  };

  return view;
}
