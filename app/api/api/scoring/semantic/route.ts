// app/api/scoring/semantic/route.ts
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import type {
  SemanticScoringResponse,
  NormalizedScoringConfig,
  Tier,
} from "@/lib/scoring/types";

// Fallback thresholds if config is missing / broken
const FALLBACK_THRESHOLDS: NormalizedScoringConfig["thresholds"] = {
  tierA: 80,
  tierB: 65,
  tierC: 50,
};

function clampScore(score: number): number {
  if (!Number.isFinite(score)) return 0;
  return Math.min(100, Math.max(0, Math.round(score)));
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

export async function POST(req: NextRequest) {
  const apiKeyFromEnv = process.env.SCORING_SERVICE_API_KEY;

  if (!apiKeyFromEnv) {
    console.error(
      "[scoring-api] SCORING_SERVICE_API_KEY not configured on server.",
    );
    return NextResponse.json(
      { error: "Scoring service not configured." },
      { status: 500 },
    );
  }

  const authHeader = req.headers.get("authorization") || "";
  const token = authHeader.startsWith("Bearer ")
    ? authHeader.slice("Bearer ".length).trim()
    : "";

  if (!token || token !== apiKeyFromEnv) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 },
    );
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON payload" },
      { status: 400 },
    );
  }

  const tenant = body?.tenant ?? {};
  const job = body?.job ?? {};
  const candidate = body?.candidate ?? null;
  const application = body?.application ?? {};
  const rawConfig = body?.config ?? null;

  const thresholds =
    rawConfig?.thresholds && typeof rawConfig.thresholds === "object"
      ? {
          tierA:
            typeof rawConfig.thresholds.tierA === "number"
              ? rawConfig.thresholds.tierA
              : FALLBACK_THRESHOLDS.tierA,
          tierB:
            typeof rawConfig.thresholds.tierB === "number"
              ? rawConfig.thresholds.tierB
              : FALLBACK_THRESHOLDS.tierB,
          tierC:
            typeof rawConfig.thresholds.tierC === "number"
              ? rawConfig.thresholds.tierC
              : FALLBACK_THRESHOLDS.tierC,
        }
      : FALLBACK_THRESHOLDS;

  // -------------------------------------------------------------------
  // Heuristic scoring v1 – deliberately simple but structured
  // -------------------------------------------------------------------

  let score = 50; // neutral baseline

  const hasCv = Boolean(application?.cvUrl);
  const hasCoverLetter = Boolean(application?.coverLetter);
  const hasLinkedIn =
    typeof application?.linkedinUrl === "string" &&
    application.linkedinUrl.trim().length > 0;

  const jobLocation = (job?.location || "").toString().toLowerCase().trim();
  const candidateLocation = (
    application?.location ||
    candidate?.location ||
    ""
  )
    .toString()
    .toLowerCase()
    .trim();

  const requiredSkills: string[] =
    Array.isArray(job?.requiredSkills) && job.requiredSkills.length > 0
      ? job.requiredSkills
      : [];

  // CV & cover letter presence
  if (hasCv) score += 15;
  if (hasCoverLetter) score += 10;
  if (hasLinkedIn) score += 5;

  // Location alignment (very naive)
  if (jobLocation && candidateLocation) {
    if (candidateLocation.includes(jobLocation)) {
      score += 10;
    }
  }

  // Required skills count (we don't inspect the CV here, just use as a proxy)
  if (requiredSkills.length > 0) {
    // a few skills required suggests more specialized role
    score += Math.min(15, requiredSkills.length * 3);
  }

  // Hiring mode nudges
  const hiringMode =
    job?.hiringMode ||
    tenant?.hiringMode ||
    rawConfig?.hiringMode ||
    "balanced";

  if (hiringMode === "executive") {
    // be a bit stricter on exec roles (pull scores slightly toward the middle)
    score = 40 + (score - 40) * 0.85;
  }

  if (hiringMode === "volume") {
    // volume roles – allow more variance
    score = 45 + (score - 45) * 1.05;
  }

  const finalScore = clampScore(score);
  const tier = tierFromScore(finalScore, thresholds);

  // -------------------------------------------------------------------
  // Build explanation & focus pointers
  // -------------------------------------------------------------------
  const reasons: string[] = [];

  if (hasCv) reasons.push("CV provided.");
  else reasons.push("No CV provided.");

  if (hasCoverLetter) reasons.push("Cover letter provided.");
  else reasons.push("No cover letter provided.");

  if (hasLinkedIn) reasons.push("LinkedIn profile provided.");

  if (requiredSkills.length > 0) {
    reasons.push(
      `Role has ${requiredSkills.length} listed required skill(s).`,
    );
  }

  if (jobLocation) {
    if (candidateLocation.includes(jobLocation)) {
      reasons.push("Candidate location appears to match role location.");
    } else {
      reasons.push("Candidate location does not clearly match role location.");
    }
  }

  const interviewFocus: string[] = [];

  if (!hasCv) interviewFocus.push("Request a CV or detailed career history.");
  if (!hasCoverLetter)
    interviewFocus.push("Probe candidate motivation and context for applying.");
  if (requiredSkills.length > 0) {
    interviewFocus.push(
      "Walk through concrete examples covering the required skills.",
    );
  }

  const response: SemanticScoringResponse = {
    score: finalScore,
    tier,
    reason: reasons.join(" "),
    risks: [],
    redFlags: [],
    interviewFocus,
    engine: "thinkats-heuristic-v1",
    engineVersion: "v1",
  };

  return NextResponse.json(response);
}
