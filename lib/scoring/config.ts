// lib/scoring/config.ts

import type { Prisma } from "@prisma/client";

// High-level modes for how scoring behaves
export type HiringMode = "exec" | "volume" | "hybrid";

// Plan modes – we read this from tenant.plan
export type PlanMode = "free" | "pro" | "enterprise";

// Category-level weights (as percentages; we normalize when scoring)
export type CategoryWeights = {
  coreCompetencies: number;   // technical + functional + industry
  experienceQuality: number;  // relevance, progression, quality of roles
  education: number;          // de-emphasised for bias reduction
  achievements: number;       // measurable impact
  culturalFit: number;        // org/industry alignment
};

export type Thresholds = {
  tierA: number; // >= this => Tier A
  tierB: number; // >= this => Tier B
  tierC: number; // >= this => Tier C, else Tier D
};

export type SkillsConfig = {
  mustHaveSkillMatchPercent: number; // e.g. 70 means 70% of must-haves
  treatMissingMustHaveAsRedFlag: boolean;
};

export type BiasConfig = {
  anonymizeForScoring: boolean;  // hide personal identifiers in UI
  downweightEducation: boolean;  // keep education weight capped
};

export type NlpConfig = {
  enableNlp: boolean;    // plan-gated
  nlpWeightBoost: number; // how much semantic fit can add (0–30)
};

export type ScoringConfig = {
  mode: HiringMode;
  plan: PlanMode;
  weights: CategoryWeights;
  thresholds: Thresholds;
  skills: SkillsConfig;
  bias: BiasConfig;
  nlp: NlpConfig;
};

// --------------------------
// DEFAULT CONFIGS BY MODE
// --------------------------

export const DEFAULT_EXEC_SCORING_CONFIG: ScoringConfig = {
  mode: "exec",
  plan: "free",
  weights: {
    // Exec search: competency + experience + achievements matter a lot
    coreCompetencies: 30,
    experienceQuality: 25,
    education: 15,
    achievements: 20,
    culturalFit: 10,
  },
  thresholds: {
    tierA: 80,
    tierB: 65,
    tierC: 50,
  },
  skills: {
    mustHaveSkillMatchPercent: 75,
    treatMissingMustHaveAsRedFlag: true,
  },
  bias: {
    anonymizeForScoring: true,
    downweightEducation: true,
  },
  nlp: {
    enableNlp: false,
    nlpWeightBoost: 15,
  },
};

export const DEFAULT_VOLUME_SCORING_CONFIG: ScoringConfig = {
  mode: "volume",
  plan: "free",
  weights: {
    // High-volume: skills + experience quality carry more weight
    coreCompetencies: 40,
    experienceQuality: 30,
    education: 10,
    achievements: 10,
    culturalFit: 10,
  },
  thresholds: {
    tierA: 80,
    tierB: 65,
    tierC: 50,
  },
  skills: {
    mustHaveSkillMatchPercent: 60,
    treatMissingMustHaveAsRedFlag: false,
  },
  bias: {
    anonymizeForScoring: true,
    downweightEducation: true,
  },
  nlp: {
    enableNlp: false,
    nlpWeightBoost: 20,
  },
};

export const DEFAULT_HYBRID_SCORING_CONFIG: ScoringConfig = {
  mode: "hybrid",
  plan: "free",
  weights: {
    coreCompetencies: 35,
    experienceQuality: 25,
    education: 10,
    achievements: 15,
    culturalFit: 15,
  },
  thresholds: {
    tierA: 80,
    tierB: 65,
    tierC: 50,
  },
  skills: {
    mustHaveSkillMatchPercent: 70,
    treatMissingMustHaveAsRedFlag: true,
  },
  bias: {
    anonymizeForScoring: true,
    downweightEducation: true,
  },
  nlp: {
    enableNlp: false,
    nlpWeightBoost: 15,
  },
};

// --------------------------
// NORMALISATION / MERGE
// --------------------------

function normalizeMode(raw?: string | null): HiringMode {
  const v = (raw || "").toLowerCase();
  if (v === "volume") return "volume";
  if (v === "hybrid") return "hybrid";
  return "exec";
}

function normalizePlan(raw?: string | null): PlanMode {
  const v = (raw || "").toLowerCase();
  if (v === "pro") return "pro";
  if (v === "enterprise") return "enterprise";
  return "free";
}

function getBaseConfigForMode(mode: HiringMode): ScoringConfig {
  switch (mode) {
    case "volume":
      return DEFAULT_VOLUME_SCORING_CONFIG;
    case "hybrid":
      return DEFAULT_HYBRID_SCORING_CONFIG;
    case "exec":
    default:
      return DEFAULT_EXEC_SCORING_CONFIG;
  }
}

type TenantConfigJson = Prisma.JsonValue | null | undefined;
type TenantConfigObject = Partial<ScoringConfig> & {
  weights?: Partial<CategoryWeights>;
  thresholds?: Partial<Thresholds>;
  skills?: Partial<SkillsConfig>;
  bias?: Partial<BiasConfig>;
  nlp?: Partial<NlpConfig>;
};

function coerceTenantConfig(value: TenantConfigJson): TenantConfigObject {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }
  return value as TenantConfigObject;
}

export type NormalizedScoringConfig = ScoringConfig & {
  // derived fields for convenience when scoring
  normalizedWeights: {
    coreCompetencies: number;
    experienceQuality: number;
    education: number;
    achievements: number;
    culturalFit: number;
  };
};

/**
 * Merge tenant.scoringConfig (JSON) + plan + mode into a normalized config
 * that the scoring pipeline can consume.
 */
export function mergeScoringConfig(args: {
  mode?: string | null;
  plan?: string | null;
  tenantConfig?: TenantConfigJson;
}): NormalizedScoringConfig {
  const mode = normalizeMode(args.mode);
  const plan = normalizePlan(args.plan);
  const base = getBaseConfigForMode(mode);
  const overrides = coerceTenantConfig(args.tenantConfig);

  const weights = {
    ...base.weights,
    ...(overrides.weights || {}),
  };

  const thresholds = {
    ...base.thresholds,
    ...(overrides.thresholds || {}),
  };

  const skills = {
    ...base.skills,
    ...(overrides.skills || {}),
  };

  const bias = {
    ...base.bias,
    ...(overrides.bias || {}),
  };

  // Plan-gate NLP: free = off, pro/enterprise can honour overrides
  const baseNlp = base.nlp;
  const overrideNlp = overrides.nlp || {};
  const mergedNlp: NlpConfig =
    plan === "free"
      ? {
          ...baseNlp,
          enableNlp: false,
        }
      : {
          ...baseNlp,
          ...overrideNlp,
        };

  // Normalize weights so they sum to 1.0
  const totalWeight =
    weights.coreCompetencies +
    weights.experienceQuality +
    weights.education +
    weights.achievements +
    weights.culturalFit;

  const safeTotal = totalWeight > 0 ? totalWeight : 1;

  const normalizedWeights = {
    coreCompetencies: weights.coreCompetencies / safeTotal,
    experienceQuality: weights.experienceQuality / safeTotal,
    education: weights.education / safeTotal,
    achievements: weights.achievements / safeTotal,
    culturalFit: weights.culturalFit / safeTotal,
  };

  return {
    mode,
    plan,
    weights,
    thresholds,
    skills,
    bias,
    nlp: mergedNlp,
    normalizedWeights,
  };
}
