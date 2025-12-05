// app/ats/settings/scoring/page.tsx
import { prisma } from "@/lib/prisma";
import { getResourcinTenant } from "@/lib/tenant";
import {
  defaultScoringConfigForPlan,
  mergeScoringConfig,
} from "@/lib/scoring";
import ScoringSettingsForm from "./ScoringSettingsForm";

export const dynamic = "force-dynamic";

export default async function ScoringSettingsPage() {
  const tenant = await getResourcinTenant();
  if (!tenant) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8">
        <h1 className="text-lg font-semibold text-slate-900">
          Scoring settings not available
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          No default tenant configured. Check{" "}
          <code className="rounded bg-slate-100 px-1 py-0.5 text-[11px]">
            RESOURCIN_TENANT_ID
          </code>{" "}
          or{" "}
          <code className="rounded bg-slate-100 px-1 py-0.5 text-[11px]">
            RESOURCIN_TENANT_SLUG
          </code>
          .
        </p>
      </div>
    );
  }

  const plan = (tenant as any).plan || "free";
  const baseConfig = defaultScoringConfigForPlan(plan);
  const overrides = (tenant as any).scoringConfig || null;

  const effective = mergeScoringConfig(baseConfig, overrides || undefined);

  const initialSettings = {
    strictMustHaveSkills: overrides?.strictMustHaveSkills ?? baseConfig.strictMustHaveSkills,
    anonymiseDuringReview:
      overrides?.anonymiseDuringReview === undefined
        ? true
        : Boolean(overrides.anonymiseDuringReview),
    tierThresholds: effective.tierThresholds,
    categoryWeights: effective.categoryWeights,
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-8">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">
          Scoring & bias settings
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          Configure how ThinkATS evaluates candidates for this tenant: weights,
          thresholds, and bias reduction. Ideal for Pro &amp; Enterprise
          search mandates.
        </p>
      </div>

      <ScoringSettingsForm plan={plan} initialSettings={initialSettings} />
    </div>
  );
}
