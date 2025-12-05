// lib/scoring.ts

// High-level category weights map straight to your framework:
// Core Competencies 30%, Experience 25%, Education 15%,
// Achievements 15%, Cultural Fit 15%.

export type Tier = "A" | "B" | "C" | "D";

export type CategoryScores = {
  coreCompetencies: number;
  experienceQuality: number;
  education: number;
  achievements: number;
  culturalFit: number;
};

export type TierThresholds = {
  A: number; // e.g. 80
  B: number; // e.g. 65
  C: number; // e.g. 50
};

export type CategoryWeights = {
  coreCompetencies: number;
  experienceQuality: number;
  education: number;
  achievements: number;
  culturalFit: number;
};

export type ScoringConfig = {
  categoryWeights: CategoryWeights;
  tierThresholds: TierThresholds;
  strictMustHaveSkills: boolean; // hard vs soft must-have behaviour
  educationWeightReduced: boolean; // for clarity, though encoded in weights
  enableNlpBoost: boolean; // future: semantic CV ↔ JD matching
};

export type ScoringResult = {
  score: number; // 0–100
  tier: Tier;
  categoryScores: CategoryScores;
  riskFlags: string[];
  redFlags: string[];
  interviewFocus: string[];
  summary: string; // human-readable explanation for matchReason
};

// -------- Defaults per plan (overrideable later per-tenant) --------

const BASE_CATEGORY_WEIGHTS: CategoryWeights = {
  coreCompetencies: 30,
  experienceQuality: 25,
  education: 15, // deliberately lower to reduce bias
  achievements: 15,
  culturalFit: 15,
};

const BASE_TIER_THRESHOLDS: TierThresholds = {
  A: 80,
  B: 65,
  C: 50,
};

const FREE_CONFIG: ScoringConfig = {
  categoryWeights: BASE_CATEGORY_WEIGHTS,
  tierThresholds: BASE_TIER_THRESHOLDS,
  strictMustHaveSkills: false,
  educationWeightReduced: true,
  enableNlpBoost: false,
};

const PRO_CONFIG: ScoringConfig = {
  categoryWeights: BASE_CATEGORY_WEIGHTS,
  tierThresholds: BASE_TIER_THRESHOLDS,
  strictMustHaveSkills: true,
  educationWeightReduced: true,
  enableNlpBoost: true,
};

const ENTERPRISE_CONFIG: ScoringConfig = {
  categoryWeights: BASE_CATEGORY_WEIGHTS,
  tierThresholds: BASE_TIER_THRESHOLDS,
  strictMustHaveSkills: true,
  educationWeightReduced: true,
  enableNlpBoost: true,
};

export function defaultScoringConfigForPlan(plan?: string | null): ScoringConfig {
  const p = (plan || "free").toLowerCase();
  if (p === "enterprise") return ENTERPRISE_CONFIG;
  if (p === "pro" || p === "trial_pro") return PRO_CONFIG;
  return FREE_CONFIG;
}

// Utility for merging future per-tenant overrides
export function mergeScoringConfig(
  base: ScoringConfig,
  overrides?: Partial<ScoringConfig>,
): ScoringConfig {
  if (!overrides) return base;
  return {
    ...base,
    ...overrides,
    categoryWeights: {
      ...base.categoryWeights,
      ...(overrides.categoryWeights || {}),
    },
    tierThresholds: {
      ...base.tierThresholds,
      ...(overrides.tierThresholds || {}),
    },
  };
}

// --------- Bias guard: NEVER use these fields in scoring ---------
// - candidate fullName
// - candidate gender
// - candidate ethnicity
// - email, phone, photo, profile picture, age, etc.
// We also de-emphasise education by capping its contribution and
// treating institution pedigree as a very soft signal (and currently
// not used at all).

type ComputeArgs = {
  job: {
    title: string;
    location: string | null;
    locationType: string | null;
    experienceLevel: string | null;
    seniority: string | null;
    requiredSkills: string[];
    salaryMin: any;
    salaryMax: any;
    salaryCurrency: string | null;
  };
  candidate: {
    location: string | null;
    currentTitle: string | null;
    currentCompany: string | null;
  } | null;
  application: {
    location?: string | null;
    currentGrossAnnual?: string | null;
    grossAnnualExpectation?: string | null;
    noticePeriod?: string | null;
    coverLetter?: string | null;
    screeningAnswers?: unknown;
    howHeard?: string | null;
  };
  config: ScoringConfig;
};

function normaliseText(...parts: (string | null | undefined)[]): string {
  return parts
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function parseMoneyNumber(input?: string | null): number | null {
  if (!input) return null;
  const match = input.replace(/,/g, "").match(/(\d+(\.\d+)?)/);
  if (!match) return null;
  return Number(match[1]);
}

function inferLevelFromText(text?: string | null): number | null {
  if (!text) return null;
  const t = text.toLowerCase();

  if (/\bintern|trainee\b/.test(t)) return 0;
  if (/\bjunior\b|\bjr\b/.test(t)) return 1;
  if (/\bassociate\b|\bmid\b|\bmid[-\s]?level\b/.test(t)) return 2;
  if (/\bsenior\b|\bsr\b|\blead\b|\bmanager\b/.test(t)) return 3;
  if (/\bhead\b|\bdirector\b|\bvp\b|\bvice president\b|\bchief\b|^ceo\b|^cto\b|^cfo\b|^coo\b/.test(t))
    return 4;

  return 2; // default mid-level if unclear
}

type SkillMatchResult = {
  total: number;
  matched: string[];
  missing: string[];
  mustHaveMatched: string[];
  mustHaveMissing: string[];
};

function normaliseSkillToken(raw: string): { token: string; mustHave: boolean } {
  let s = raw.trim();
  let mustHave = false;

  // Explicit must-have conventions:
  // - Prefix "!" e.g. "!Python"
  // - Contains "[must]" or "(must have)"
  if (s.startsWith("!")) {
    mustHave = true;
    s = s.slice(1).trim();
  }
  if (/\bmust\b/i.test(s)) {
    mustHave = true;
  }

  const token = s.toLowerCase();
  return { token, mustHave };
}

function textContainsSkill(text: string, skillToken: string): boolean {
  if (!text || !skillToken) return false;
  const t = text.toLowerCase();

  // Basic direct match
  if (t.includes(skillToken)) return true;

  // Simple synonym normalisation
  const synonyms: Record<string, string[]> = {
    javascript: ["js", "nodejs", "node.js"],
    typescript: ["ts"],
    "project management": ["pm", "pmp"],
    "product management": ["pm", "product manager"],
    "human resources": ["hr", "people ops"],
  };

  for (const [canonical, alts] of Object.entries(synonyms)) {
    if (skillToken === canonical) {
      if (alts.some((alt) => t.includes(alt))) return true;
    }
  }

  return false;
}

function computeSkillMatch(
  requiredSkills: string[],
  candidateText: string,
): SkillMatchResult {
  const normSkills = requiredSkills.map(normaliseSkillToken);
  const matched: string[] = [];
  const missing: string[] = [];
  const mustHaveMatched: string[] = [];
  const mustHaveMissing: string[] = [];

  for (const { token, mustHave } of normSkills) {
    if (!token) continue;
    const hasIt = textContainsSkill(candidateText, token);
    if (hasIt) {
      matched.push(token);
      if (mustHave) mustHaveMatched.push(token);
    } else {
      missing.push(token);
      if (mustHave) mustHaveMissing.push(token);
    }
  }

  return {
    total: normSkills.length,
    matched,
    missing,
    mustHaveMatched,
    mustHaveMissing,
  };
}

function computeCoreCompetenciesScore(
  job: ComputeArgs["job"],
  candidate: ComputeArgs["candidate"],
  app: ComputeArgs["application"],
  riskFlags: string[],
  redFlags: string[],
  strictMustHave: boolean,
): { score: number; skillMatch: SkillMatchResult } {
  const candidateText = normaliseText(
    app.coverLetter,
    JSON.stringify(app.screeningAnswers || ""),
    candidate?.currentTitle,
    candidate?.currentCompany,
  );

  const skillMatch = computeSkillMatch(job.requiredSkills || [], candidateText);

  if (skillMatch.total === 0) {
    // No explicit skills defined = neutral, but note in risk flags.
    riskFlags.push(
      "Job has no explicit 'required skills' configured – ranking may be less precise.",
    );
    return { score: 70, skillMatch };
  }

  const ratio = skillMatch.matched.length / skillMatch.total;
  let score = 30 + ratio * 70; // 30–100

  // Must-have behaviour
  if (skillMatch.mustHaveMissing.length > 0) {
    if (strictMustHave) {
      // HARD: cap score and treat as red flag.
      score = Math.min(score, 40);
      redFlags.push(
        `Missing must-have skills: ${skillMatch.mustHaveMissing.join(", ")}`,
      );
    } else {
      // SOFT: heavy penalty but not hard fail.
      score = Math.max(20, score - 20);
      riskFlags.push(
        `Missing some must-have skills: ${skillMatch.mustHaveMissing.join(", ")}`,
      );
    }
  }

  if (ratio === 0 && skillMatch.total > 0) {
    redFlags.push("No overlap with required skills.");
  }

  return { score: Math.max(0, Math.min(100, Math.round(score))), skillMatch };
}

function computeExperienceQualityScore(
  job: ComputeArgs["job"],
  candidate: ComputeArgs["candidate"],
  app: ComputeArgs["application"],
  riskFlags: string[],
): number {
  const jobLevel =
    inferLevelFromText(job.experienceLevel) ??
    inferLevelFromText(job.seniority) ??
    inferLevelFromText(job.title) ??
    null;

  const candidateLevel =
    inferLevelFromText(candidate?.currentTitle) ??
    inferLevelFromText(candidate?.currentCompany) ??
    null;

  if (jobLevel == null || candidateLevel == null) {
    // Not enough signal – neutral but note as a risk.
    riskFlags.push(
      "Experience level could not be cleanly inferred from the job or candidate title.",
    );
    return 70;
  }

  const diff = candidateLevel - jobLevel;
  let score: number;

  if (diff >= 1) {
    // Candidate is at/above required seniority
    score = 80 + Math.min(diff, 2) * 5; // 80–90
  } else if (diff === 0) {
    score = 75;
  } else if (diff === -1) {
    score = 65;
    riskFlags.push(
      "Candidate is slightly below the target seniority – validate growth potential in interview.",
    );
  } else {
    score = 50;
    riskFlags.push(
      "Candidate appears materially below the target seniority – ensure expectations are aligned.",
    );
  }

  return Math.max(0, Math.min(100, Math.round(score)));
}

function computeEducationScore(
  // Currently we do NOT use institution pedigree to avoid bias.
  _job: ComputeArgs["job"],
  _candidate: ComputeArgs["candidate"],
  app: ComputeArgs["application"],
  riskFlags: string[],
): number {
  const text = normaliseText(app.coverLetter, JSON.stringify(app.screeningAnswers || ""));
  let score = 70; // neutral

  // Very light signal: presence of any degree credential.
  if (/\b(bsc|ba|msc|ma|mba|phd|b\.sc|m\.sc|b\.eng|llb)\b/.test(text)) {
    score = 75;
  }

  // If explicitly "self taught" and strong achievements, we don't penalise.
  if (/\bself[-\s]?taught\b/.test(text)) {
    riskFlags.push(
      "Candidate is self-taught – validate depth of knowledge via technical case/interview.",
    );
    score = 72;
  }

  return Math.max(0, Math.min(100, Math.round(score)));
}

function computeAchievementsScore(
  _job: ComputeArgs["job"],
  _candidate: ComputeArgs["candidate"],
  app: ComputeArgs["application"],
  riskFlags: string[],
): number {
  const text = normaliseText(app.coverLetter, JSON.stringify(app.screeningAnswers || ""));

  const hasPercent = /(\d+(\.\d+)?)\s*%/.test(text);
  const hasMoney = /(\$|₦|ngn|usd|eur|gbp)\s*\d+/i.test(text);
  const hasImpactWords = /\b(increased|grew|reduced|improved|saved|boosted|cut)\b/.test(text);
  const hasLeadershipWords = /\bled|managed|headed|mentored|supervised\b/.test(text);

  let score = 55;

  if ((hasPercent || hasMoney) && hasImpactWords) {
    score = 85;
  } else if (hasImpactWords || hasLeadershipWords) {
    score = 70;
  }

  if (score < 70) {
    riskFlags.push(
      "Limited explicit, quantified achievements – probe for concrete impact and metrics.",
    );
  }

  return Math.max(0, Math.min(100, Math.round(score)));
}

function computeCulturalFitScore(
  job: ComputeArgs["job"],
  candidate: ComputeArgs["candidate"],
  app: ComputeArgs["application"],
  riskFlags: string[],
): number {
  let score = 70;

  const jobLoc = (job.location || "").toLowerCase();
  const jobLocType = (job.locationType || "").toLowerCase();
  const candidateLoc =
    (app.location || candidate?.location || "").toLowerCase();

  if (jobLoc && candidateLoc) {
    // Extremely rough heuristic – we don't over-penalise location mismatch.
    if (jobLoc === candidateLoc) {
      score += 5;
    }
  }

  if (jobLocType.includes("remote") || jobLocType.includes("hybrid")) {
    const txt = normaliseText(
      app.coverLetter,
      JSON.stringify(app.screeningAnswers || ""),
    );
    if (/\bremote\b|\bdistributed\b|\bglobal team\b/.test(txt)) {
      score += 5;
    }
  }

  // Notice period can be a soft cultural signal for flexibility / risk.
  if ((app.noticePeriod || "").toLowerCase().includes("3 month")) {
    riskFlags.push(
      "Long notice period – align on start date and assess urgency of the mandate.",
    );
  }

  return Math.max(0, Math.min(100, Math.round(score)));
}

function computeTier(score: number, thresholds: TierThresholds): Tier {
  if (score >= thresholds.A) return "A";
  if (score >= thresholds.B) return "B";
  if (score >= thresholds.C) return "C";
  return "D";
}

// ----------------- Main entry point -----------------

export function computeApplicationScore(args: ComputeArgs): ScoringResult {
  const { job, candidate, application, config } = args;
  const riskFlags: string[] = [];
  const redFlags: string[] = [];
  const interviewFocus: string[] = [];

  // Core competencies (skills, domain, tools)
  const coreResult = computeCoreCompetenciesScore(
    job,
    candidate,
    application,
    riskFlags,
    redFlags,
    config.strictMustHaveSkills,
  );

  // Experience quality (level and trajectory proxy)
  const experienceScore = computeExperienceQualityScore(
    job,
    candidate,
    application,
    riskFlags,
  );

  // Education (de-emphasised, no pedigree bias)
  const educationScore = computeEducationScore(
    job,
    candidate,
    application,
    riskFlags,
  );

  // Achievements (quantified outcomes, leadership signals)
  const achievementsScore = computeAchievementsScore(
    job,
    candidate,
    application,
    riskFlags,
  );

  // Cultural/organisational fit (very soft)
  const culturalFitScore = computeCulturalFitScore(
    job,
    candidate,
    application,
    riskFlags,
  );

  const categoryScores: CategoryScores = {
    coreCompetencies: coreResult.score,
    experienceQuality: experienceScore,
    education: educationScore,
    achievements: achievementsScore,
    culturalFit: culturalFitScore,
  };

  const w = config.categoryWeights;
  const totalWeight =
    w.coreCompetencies +
    w.experienceQuality +
    w.education +
    w.achievements +
    w.culturalFit;

  const weightedScore =
    (categoryScores.coreCompetencies * w.coreCompetencies +
      categoryScores.experienceQuality * w.experienceQuality +
      categoryScores.education * w.education +
      categoryScores.achievements * w.achievements +
      categoryScores.culturalFit * w.culturalFit) /
    totalWeight;

  let score = Math.max(0, Math.min(100, Math.round(weightedScore)));

  // Tiering
  const tier = computeTier(score, config.tierThresholds);

  // Interview focus suggestions based on weaker categories
  if (categoryScores.coreCompetencies < 70) {
    interviewFocus.push(
      "Drill into core technical/functional competencies via case or technical deep-dive.",
    );
  }
  if (categoryScores.experienceQuality < 70) {
    interviewFocus.push(
      "Validate seniority, scope of roles, and relevance of past mandates.",
    );
  }
  if (categoryScores.achievements < 70) {
    interviewFocus.push(
      "Push for quantified achievements (revenue, cost, efficiency, growth).",
    );
  }
  if (categoryScores.culturalFit < 70) {
    interviewFocus.push(
      "Explore working style, team environment and organisational context fit.",
    );
  }

  const summaryParts: string[] = [];

  summaryParts.push(
    `Tier ${tier} (${score}/100). Core competencies ${categoryScores.coreCompetencies}/100, Experience ${categoryScores.experienceQuality}/100, Education ${categoryScores.education}/100, Achievements ${categoryScores.achievements}/100, Cultural fit ${categoryScores.culturalFit}/100.`,
  );

  if (coreResult.skillMatch.total > 0) {
    if (coreResult.skillMatch.matched.length > 0) {
      summaryParts.push(
        `Matched skills: ${coreResult.skillMatch.matched.join(", ")}.`,
      );
    }
    if (coreResult.skillMatch.missing.length > 0) {
      summaryParts.push(
        `Missing skills: ${coreResult.skillMatch.missing.join(", ")}.`,
      );
    }
  }

  if (riskFlags.length > 0) {
    summaryParts.push(`Risks: ${riskFlags.join(" | ")}.`);
  }

  if (redFlags.length > 0) {
    summaryParts.push(`Red flags: ${redFlags.join(" | ")}.`);
  }

  if (interviewFocus.length > 0) {
    summaryParts.push(
      `Interview focus: ${interviewFocus.join(" | ")}.`,
    );
  }

  return {
    score,
    tier,
    categoryScores,
    riskFlags,
    redFlags,
    interviewFocus,
    summary: summaryParts.join(" "),
  };
}
