// lib/scoring/compute.ts
import type { Candidate, Job, JobApplication } from "@prisma/client";
import type {
  NormalizedScoringConfig,
  ScoredApplicationView,
  Tier,
} from "./types";

function tierFromScore(
  score: number,
  thresholds: NormalizedScoringConfig["thresholds"],
): Tier {
  if (score >= thresholds.tierA) return "A";
  if (score >= thresholds.tierB) return "B";
  if (score >= thresholds.tierC) return "C";
  return "D";
}

/**
 * Lightweight view function: read matchScore/matchReason from DB
 * and give the UI a consistent object to render.
 *
 * No heuristics here – all heavy lifting is done by the external engine.
 */
export function computeApplicationScore(args: {
  application: JobApplication;
  candidate: Candidate | null;
  job: Job;
  config: NormalizedScoringConfig;
}): ScoredApplicationView {
  const { application, config } = args;

  const rawScore =
    typeof application.matchScore === "number"
      ? application.matchScore
      : 0;

  const score = Math.min(100, Math.max(0, rawScore));
  const tier = tierFromScore(score, config.thresholds);

  const reason =
    application.matchReason ??
    (score === 0
      ? "No semantic score has been recorded for this candidate yet."
      : "Scored by semantic CV/JD engine.");

  return {
    score,
    tier,
    risks: [],          // can be filled once you persist risks per application
    redFlags: [],
    interviewFocus: [],
    reason,
  };
}
