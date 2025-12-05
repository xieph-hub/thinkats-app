// app/api/ats/settings/scoring/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getResourcinTenant } from "@/lib/tenant";
import {
  defaultScoringConfigForPlan,
  mergeScoringConfig,
} from "@/lib/scoring";

export const dynamic = "force-dynamic";

export async function GET() {
  const tenant = await getResourcinTenant();
  if (!tenant) {
    return NextResponse.json(
      { error: "Tenant not configured" },
      { status: 400 },
    );
  }

  const plan = (tenant as any).plan || "free";
  const baseConfig = defaultScoringConfigForPlan(plan);
  const overrides = (tenant as any).scoringConfig || null;

  const effective = mergeScoringConfig(baseConfig, overrides || undefined);

  return NextResponse.json({
    plan,
    overrides,
    effectiveConfig: effective,
  });
}

export async function POST(req: Request) {
  const tenant = await getResourcinTenant();
  if (!tenant) {
    return NextResponse.json(
      { error: "Tenant not configured" },
      { status: 400 },
    );
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 },
    );
  }

  const {
    strictMustHaveSkills,
    anonymiseDuringReview,
    tierThresholds,
    categoryWeights,
  } = body || {};

  // Validate category weights
  const totalWeight =
    (categoryWeights?.coreCompetencies ?? 0) +
    (categoryWeights?.experienceQuality ?? 0) +
    (categoryWeights?.education ?? 0) +
    (categoryWeights?.achievements ?? 0) +
    (categoryWeights?.culturalFit ?? 0);

  if (totalWeight !== 100) {
    return NextResponse.json(
      {
        error: "Category weights must sum to 100%.",
        totalWeight,
      },
      { status: 400 },
    );
  }

  // Validate thresholds
  if (
    !tierThresholds ||
    typeof tierThresholds.A !== "number" ||
    typeof tierThresholds.B !== "number" ||
    typeof tierThresholds.C !== "number" ||
    !(tierThresholds.A > tierThresholds.B && tierThresholds.B > tierThresholds.C)
  ) {
    return NextResponse.json(
      {
        error:
          "Tier thresholds invalid. Ensure A > B > C and all are numbers.",
      },
      { status: 400 },
    );
  }

  const overrides = {
    strictMustHaveSkills: Boolean(strictMustHaveSkills),
    anonymiseDuringReview:
      anonymiseDuringReview === undefined ? true : Boolean(anonymiseDuringReview),
    tierThresholds,
    categoryWeights,
  };

  await prisma.tenant.update({
    where: { id: tenant.id },
    data: {
      scoringConfig: overrides,
      updatedAt: new Date(),
    },
  });

  return NextResponse.json({ ok: true });
}
