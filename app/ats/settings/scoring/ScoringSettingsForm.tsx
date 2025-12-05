// app/ats/settings/scoring/ScoringSettingsForm.tsx
"use client";

import { useState } from "react";

type CategoryWeights = {
  coreCompetencies: number;
  experienceQuality: number;
  education: number;
  achievements: number;
  culturalFit: number;
};

type TierThresholds = {
  A: number;
  B: number;
  C: number;
};

type InitialSettings = {
  strictMustHaveSkills: boolean;
  anonymiseDuringReview: boolean;
  tierThresholds: TierThresholds;
  categoryWeights: CategoryWeights;
};

type Props = {
  plan: string;
  initialSettings: InitialSettings;
};

export default function ScoringSettingsForm({ plan, initialSettings }: Props) {
  const [strictMustHave, setStrictMustHave] = useState(
    initialSettings.strictMustHaveSkills,
  );
  const [anonymise, setAnonymise] = useState(
    initialSettings.anonymiseDuringReview,
  );
  const [tierA, setTierA] = useState(initialSettings.tierThresholds.A);
  const [tierB, setTierB] = useState(initialSettings.tierThresholds.B);
  const [tierC, setTierC] = useState(initialSettings.tierThresholds.C);
  const [weights, setWeights] = useState<CategoryWeights>(
    initialSettings.categoryWeights,
  );
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const totalWeight =
    weights.coreCompetencies +
    weights.experienceQuality +
    weights.education +
    weights.achievements +
    weights.culturalFit;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    setError(null);

    try {
      const res = await fetch("/api/ats/settings/scoring", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          strictMustHaveSkills: strictMustHave,
          anonymiseDuringReview: anonymise,
          tierThresholds: { A: tierA, B: tierB, C: tierC },
          categoryWeights: weights,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "Failed to save settings");
      }

      setMessage("Scoring settings saved.");
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Could not save settings, please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
    >
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-slate-900">
          Plan:{" "}
          <span className="font-semibold capitalize">
            {(plan || "free").toLowerCase()}
          </span>
        </p>
        <p className="text-[11px] text-slate-500">
          Advanced tuning shines on retained search / high-stakes mandates.
        </p>
      </div>

      {/* Bias & anonymisation */}
      <div className="space-y-2">
        <h2 className="text-sm font-semibold text-slate-900">
          Bias reduction
        </h2>
        <div className="space-y-2 text-sm text-slate-600">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-slate-300"
              checked={anonymise}
              onChange={(e) => setAnonymise(e.target.checked)}
            />
            <span>
              Anonymise candidates in pipelines (Candidate A, B, C) until
              final-stage review.
            </span>
          </label>
          <p className="text-[11px] text-slate-500">
            Names, gender and personal identifiers are never used in scoring.
          </p>
        </div>
      </div>

      {/* Must-have skills */}
      <div className="space-y-2">
        <h2 className="text-sm font-semibold text-slate-900">
          Must-have skills
        </h2>
        <p className="text-xs text-slate-600">
          Prefix critical skills with <code>!</code> in{" "}
          <span className="font-mono text-[11px]">requiredSkills</span> (e.g.{" "}
          <code>!Python</code>). Choose whether missing must-haves hard-cap the
          score or just penalise it.
        </p>
        <div className="mt-2 flex flex-col gap-2 text-sm text-slate-700 sm:flex-row">
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="mustHaveMode"
              className="h-4 w-4 border-slate-300"
              checked={!strictMustHave}
              onChange={() => setStrictMustHave(false)}
            />
            <span>Soft – penalise but keep candidates visible</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="mustHaveMode"
              className="h-4 w-4 border-slate-300"
              checked={strictMustHave}
              onChange={() => setStrictMustHave(true)}
            />
            <span>Hard – cap score and mark as red flag</span>
          </label>
        </div>
      </div>

      {/* Tier thresholds */}
      <div className="space-y-2">
        <h2 className="text-sm font-semibold text-slate-900">
          Tier thresholds
        </h2>
        <p className="text-xs text-slate-600">
          Define score cut-offs for Tier A–D. Defaults: A ≥ 80, B ≥ 65, C ≥ 50,
          below = Tier D.
        </p>
        <div className="mt-2 grid grid-cols-3 gap-3 text-sm">
          <label className="space-y-1">
            <span className="text-xs text-slate-600">Tier A minimum</span>
            <input
              type="number"
              min={0}
              max={100}
              value={tierA}
              onChange={(e) => setTierA(Number(e.target.value) || 0)}
              className="w-full rounded-md border border-slate-300 px-2 py-1 text-xs"
            />
          </label>
          <label className="space-y-1">
            <span className="text-xs text-slate-600">Tier B minimum</span>
            <input
              type="number"
              min={0}
              max={100}
              value={tierB}
              onChange={(e) => setTierB(Number(e.target.value) || 0)}
              className="w-full rounded-md border border-slate-300 px-2 py-1 text-xs"
            />
          </label>
          <label className="space-y-1">
            <span className="text-xs text-slate-600">Tier C minimum</span>
            <input
              type="number"
              min={0}
              max={100}
              value={tierC}
              onChange={(e) => setTierC(Number(e.target.value) || 0)}
              className="w-full rounded-md border border-slate-300 px-2 py-1 text-xs"
            />
          </label>
        </div>
      </div>

      {/* Category weights */}
      <div className="space-y-2">
        <h2 className="text-sm font-semibold text-slate-900">
          Category weights
        </h2>
        <p className="text-xs text-slate-600">
          Core competencies, experience, education, achievements and cultural
          fit must sum to 100%. Education is intentionally de-emphasised.
        </p>
        <div className="mt-2 grid grid-cols-2 gap-3 text-sm">
          {(
            [
              ["Core competencies", "coreCompetencies"],
              ["Experience quality", "experienceQuality"],
              ["Education", "education"],
              ["Achievements", "achievements"],
              ["Cultural fit", "culturalFit"],
            ] as const
          ).map(([label, key]) => (
            <label key={key} className="space-y-1">
              <span className="text-xs text-slate-600">{label}</span>
              <input
                type="number"
                min={0}
                max={100}
                value={weights[key]}
                onChange={(e) =>
                  setWeights((prev) => ({
                    ...prev,
                    [key]: Number(e.target.value) || 0,
                  }))
                }
                className="w-full rounded-md border border-slate-300 px-2 py-1 text-xs"
              />
            </label>
          ))}
        </div>
        <p
          className={`text-[11px] ${
            totalWeight === 100 ? "text-emerald-600" : "text-amber-700"
          }`}
        >
          Total weight: {totalWeight}% (must be exactly 100% to save)
        </p>
      </div>

      <div className="flex items-center justify-between gap-4 pt-2">
        <div className="space-y-1 text-[11px]">
          {message && <p className="text-emerald-600">{message}</p>}
          {error && <p className="text-rose-600">{error}</p>}
        </div>
        <button
          type="submit"
          disabled={saving || totalWeight !== 100}
          className="inline-flex items-center rounded-full bg-[#172965] px-4 py-1.5 text-xs font-medium text-white disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saving ? "Saving..." : "Save scoring settings"}
        </button>
      </div>
    </form>
  );
}
