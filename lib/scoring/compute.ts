// lib/scoring/compute.ts
// Pure JS version – no TypeScript-only syntax.

/**
 * Derive tier letter from score + thresholds.
 */
function tierFromScore(score, thresholds) {
  if (!thresholds) {
    return "D";
  }
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
export function computeApplicationScore(args) {
  const { application, config } = args;

  const rawScore =
    typeof application.matchScore === "number"
      ? application.matchScore
      : 0;

  const score = Math.min(100, Math.max(0, rawScore));
  const thresholds = config && config.thresholds
    ? config.thresholds
    : { tierA: 80, tierB: 65, tierC: 50 };

  const tier = tierFromScore(score, thresholds);

  const reason =
    application.matchReason ??
    (score === 0
      ? "No semantic score has been recorded for this candidate yet."
      : "Scored by semantic CV/JD engine.");

  return {
    score,
    tier,
    risks: [],          // will be filled once you read ScoringEvent
    redFlags: [],
    interviewFocus: [],
    reason,
  };
}
