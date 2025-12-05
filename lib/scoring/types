// lib/scoring/types.ts

export type Tier = "A" | "B" | "C" | "D";

export type NormalizedScoringConfig = {
  hiringMode: "volume" | "executive" | "balanced";
  thresholds: {
    tierA: number; // >= A
    tierB: number; // >= B
    tierC: number; // >= C, else D
  };
  weights: {
    coreCompetencies: number;
    experienceQuality: number;
    education: number;
    achievements: number;
    culturalFit: number;
  };
};

export type ScoredApplicationView = {
  score: number;      // 0–100
  tier: Tier;         // A/B/C/D
  risks: string[];    // yellow flags to surface in UI
  redFlags: string[]; // red flags to surface in UI
  interviewFocus: string[]; // which areas to probe
  reason: string;     // short explanation shown in the UI
};

export type SemanticScoringResponse = {
  score: number;
  tier?: Tier;
  reason?: string;
  risks?: string[];
  redFlags?: string[];
  interviewFocus?: string[];
  engine?: string;
  engineVersion?: string;
};
