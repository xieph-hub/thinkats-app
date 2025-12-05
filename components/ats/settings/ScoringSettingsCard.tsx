// components/ats/settings/ScoringSettingsCard.tsx
"use client";

import { useEffect, useState } from "react";

// Runtime shape only – no TypeScript types here
const DEFAULT_CONFIG = {
  weights: {
    coreCompetencies: 30,
    experienceQuality: 25,
    education: 15,
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
    enableNlp: true,
    nlpWeightBoost: 20,
  },
};

const INITIAL_STATE = {
  loading: true,
  error: null,
  saving: false,
};

export default function ScoringSettingsCard() {
  const [plan, setPlan] = useState("free"); // "free" | "pro" | "enterprise"
  const [hiringMode, setHiringMode] = useState("balanced"); // "balanced" | "volume" | "executive"
  const [config, setConfig] = useState(null);
  const [state, setState] = useState(INITIAL_STATE);
  const [saveMessage, setSaveMessage] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setState((s) => ({ ...s, loading: true, error: null }));
      try {
        const res = await fetch("/api/ats/settings/scoring", {
          method: "GET",
        });

        const data = await res.json().catch(() => null);

        if (!res.ok || !data || !data.ok) {
          throw new Error((data && data.error) || "Failed to load settings");
        }
        if (cancelled) return;

        setPlan(data.plan || "free");

        const modeFromApi = data.hiringMode;
        const allowedModes = ["balanced", "volume", "executive"];
        setHiringMode(
          allowedModes.includes(modeFromApi) ? modeFromApi : "balanced",
        );

        const rawConfig = (data.config || {});
        setConfig({
          ...DEFAULT_CONFIG,
          ...rawConfig,
          weights: {
            ...DEFAULT_CONFIG.weights,
            ...(rawConfig.weights || {}),
          },
          thresholds: {
            ...DEFAULT_CONFIG.thresholds,
            ...(rawConfig.thresholds || {}),
          },
          skills: {
            ...DEFAULT_CONFIG.skills,
            ...(rawConfig.skills || {}),
          },
          bias: {
            ...DEFAULT_CONFIG.bias,
            ...(rawConfig.bias || {}),
          },
          nlp: {
            ...DEFAULT_CONFIG.nlp,
            ...(rawConfig.nlp || {}),
          },
        });

        setState((s) => ({ ...s, loading: false, error: null }));
      } catch (err) {
        console.error("Load scoring settings error:", err);
        if (cancelled) return;
        setState((s) => ({
          ...s,
          loading: false,
          error:
            (err && err.message) || "Failed to load scoring settings",
        }));
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleSave(e) {
    e.preventDefault();
    if (!config) return;

    setState((s) => ({ ...s, saving: true, error: null }));
    setSaveMessage(null);

    try {
      const res = await fetch("/api/ats/settings/scoring", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          hiringMode, // "balanced" | "volume" | "executive"
          config: {
            weights: config.weights,
            thresholds: config.thresholds,
            skills: config.skills,
            bias: config.bias,
            nlp: config.nlp,
          },
        }),
      });

      const data = await res.json().catch(() => null);
      if (!res.ok || !data || !data.ok) {
        throw new Error((data && data.error) || "Failed to save settings");
      }

      setPlan(data.plan || plan);

      const modeFromApi = data.hiringMode;
      const allowedModes = ["balanced", "volume", "executive"];
      setHiringMode(
        allowedModes.includes(modeFromApi) ? modeFromApi : hiringMode,
      );

      const rawConfig = data.config || {};
      setConfig({
        ...DEFAULT_CONFIG,
        ...rawConfig,
        weights: {
          ...DEFAULT_CONFIG.weights,
          ...(rawConfig.weights || {}),
        },
        thresholds: {
          ...DEFAULT_CONFIG.thresholds,
          ...(rawConfig.thresholds || {}),
        },
        skills: {
          ...DEFAULT_CONFIG.skills,
          ...(rawConfig.skills || {}),
        },
        bias: {
          ...DEFAULT_CONFIG.bias,
          ...(rawConfig.bias || {}),
        },
        nlp: {
          ...DEFAULT_CONFIG.nlp,
          ...(rawConfig.nlp || {}),
        },
      });

      setSaveMessage("Scoring settings updated");
      setState((s) => ({ ...s, saving: false }));
    } catch (err) {
      console.error("Save scoring settings error:", err);
      setState((s) => ({
        ...s,
        saving: false,
        error:
          (err && err.message) || "Failed to save scoring settings",
      }));
    }
  }

  function updateWeights(patch) {
    setConfig((prev) =>
      prev
        ? {
            ...prev,
            weights: {
              ...prev.weights,
              ...patch,
            },
          }
        : prev,
    );
  }

  function updateThresholds(patch) {
    setConfig((prev) =>
      prev
        ? {
            ...prev,
            thresholds: {
              ...prev.thresholds,
              ...patch,
            },
          }
        : prev,
    );
  }

  function updateSkills(patch) {
    setConfig((prev) =>
      prev
        ? {
            ...prev,
            skills: {
              ...prev.skills,
              ...patch,
            },
          }
        : prev,
    );
  }

  function updateBias(patch) {
    setConfig((prev) =>
      prev
        ? {
            ...prev,
            bias: {
              ...prev.bias,
              ...patch,
            },
          }
        : prev,
    );
  }

  function updateNlp(patch) {
    setConfig((prev) =>
      prev
        ? {
            ...prev,
            nlp: {
              ...prev.nlp,
              ...patch,
            },
          }
        : prev,
    );
  }

  const readOnlyNlp = plan === "free";

  return (
    <form
      onSubmit={handleSave}
      className="max-w-4xl rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
    >
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-slate-900">
            Scoring &amp; bias settings
          </h2>
          <p className="text-xs text-slate-500">
            Control how ThinkATS ranks candidates across exec search and volume
            hiring while reducing bias.
          </p>
        </div>
        <div className="flex flex-col items-end text-right text-[11px] text-slate-500">
          <span>
            Plan:{" "}
            <span className="font-medium capitalize">
              {plan === "free" ? "Free" : plan}
            </span>
          </span>
          {plan === "free" && (
            <span>Advanced NLP controls reserved for Pro / Enterprise.</span>
          )}
        </div>
      </div>

      {state.loading && (
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
          Loading scoring settings…
        </div>
      )}

      {state.error && (
        <div className="mb-3 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
          {state.error}
        </div>
      )}

      {saveMessage && (
        <div className="mb-3 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-700">
          {saveMessage}
        </div>
      )}

      {config && !state.loading && (
        <div className="space-y-5 text-xs text-slate-700">
          {/* Mode selection */}
          <section className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <div className="mb-2 flex items-center justify-between gap-2">
              <div>
                <h3 className="text-xs font-semibold text-slate-900">
                  Default hiring mode
                </h3>
                <p className="text-[11px] text-slate-500">
                  Controls the default scoring profile for this tenant. You can
                  still override per job.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {["executive", "volume", "balanced"].map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setHiringMode(mode)}
                  className={[
                    "inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-medium",
                    hiringMode === mode
                      ? "border-[#172965] bg-[#172965] text-white"
                      : "border-slate-200 bg-white text-slate-700 hover:bg-slate-100",
                  ].join(" ")}
                >
                  {mode === "executive" && "Executive search"}
                  {mode === "volume" && "Volume hiring"}
                  {mode === "balanced" && "Balanced"}
                </button>
              ))}
            </div>
          </section>

          {/* Weights */}
          <section className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <div className="mb-2 flex items-center justify-between gap-2">
              <div>
                <h3 className="text-xs font-semibold text-slate-900">
                  Category weights
                </h3>
                <p className="text-[11px] text-slate-500">
                  These behave like percentages. We normalize them when scoring,
                  so they don&apos;t have to add up perfectly.
                </p>
              </div>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              {[
                { label: "Core competencies", key: "coreCompetencies" },
                { label: "Experience quality", key: "experienceQuality" },
                { label: "Education", key: "education" },
                { label: "Achievements", key: "achievements" },
                { label: "Cultural fit", key: "culturalFit" },
              ].map((field) => (
                <div
                  key={field.key}
                  className="flex items-center justify-between"
                >
                  <label className="mr-2 text-[11px] text-slate-600">
                    {field.label}
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={config.weights[field.key] || 0}
                    onChange={(e) =>
                      updateWeights({
                        [field.key]: Number(e.target.value || 0),
                      })
                    }
                    className="w-20 rounded border border-slate-200 bg-white px-2 py-1 text-right text-[11px]"
                  />
                </div>
              ))}
            </div>
          </section>

          {/* Thresholds & tiers */}
          <section className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <div className="mb-2 flex items-center justify-between gap-2">
              <div>
                <h3 className="text-xs font-semibold text-slate-900">
                  Tier thresholds
                </h3>
                <p className="text-[11px] text-slate-500">
                  Used to classify candidates into Tier A/B/C/D.
                </p>
              </div>
            </div>
            <div className="grid gap-3 md:grid-cols-3">
              <div className="flex flex-col">
                <label className="mb-1 text-[11px] text-slate-600">
                  Tier A minimum
                </label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={config.thresholds.tierA}
                  onChange={(e) =>
                    updateThresholds({
                      tierA: Number(e.target.value || 0),
                    })
                  }
                  className="w-full rounded border border-slate-200 bg-white px-2 py-1 text-[11px]"
                />
              </div>
              <div className="flex flex-col">
                <label className="mb-1 text-[11px] text-slate-600">
                  Tier B minimum
                </label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={config.thresholds.tierB}
                  onChange={(e) =>
                    updateThresholds({
                      tierB: Number(e.target.value || 0),
                    })
                  }
                  className="w-full rounded border border-slate-200 bg-white px-2 py-1 text-[11px]"
                />
              </div>
              <div className="flex flex-col">
                <label className="mb-1 text-[11px] text-slate-600">
                  Tier C minimum
                </label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={config.thresholds.tierC}
                  onChange={(e) =>
                    updateThresholds({
                      tierC: Number(e.target.value || 0),
                    })
                  }
                  className="w-full rounded border border-slate-200 bg-white px-2 py-1 text-[11px]"
                />
              </div>
            </div>
          </section>

          {/* Skills & bias */}
          <section className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <div className="mb-2 flex flex-col gap-1">
              <h3 className="text-xs font-semibold text-slate-900">
                Must-have skills &amp; bias reduction
              </h3>
              <p className="text-[11px] text-slate-500">
                Tighten how &quot;must-have&quot; skills are treated and apply
                blind-review practices.
              </p>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <div className="flex flex-col">
                <label className="mb-1 text-[11px] text-slate-600">
                  Minimum % of must-have skills
                </label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={config.skills.mustHaveSkillMatchPercent}
                  onChange={(e) =>
                    updateSkills({
                      mustHaveSkillMatchPercent: Number(
                        e.target.value || 0,
                      ),
                    })
                  }
                  className="w-full rounded border border-slate-200 bg-white px-2 py-1 text-[11px]"
                />
                <span className="mt-1 text-[10px] text-slate-500">
                  Used to drive Tier A/B vs C/D decisions in the scoring
                  engine.
                </span>
              </div>

              <div className="flex flex-col gap-2">
                <label className="flex items-center gap-2 text-[11px] text-slate-600">
                  <input
                    type="checkbox"
                    checked={config.skills.treatMissingMustHaveAsRedFlag}
                    onChange={(e) =>
                      updateSkills({
                        treatMissingMustHaveAsRedFlag: e.target.checked,
                      })
                    }
                    className="h-3 w-3 rounded border-slate-300"
                  />
                  Treat missing must-have skills as a red flag
                </label>

                <label className="flex items-center gap-2 text-[11px] text-slate-600">
                  <input
                    type="checkbox"
                    checked={config.bias.anonymizeForScoring}
                    onChange={(e) =>
                      updateBias({
                        anonymizeForScoring: e.target.checked,
                      })
                    }
                    className="h-3 w-3 rounded border-slate-300"
                  />
                  Hide names / personal identifiers in scoring UI
                </label>

                <label className="flex items-center gap-2 text-[11px] text-slate-600">
                  <input
                    type="checkbox"
                    checked={config.bias.downweightEducation}
                    onChange={(e) =>
                      updateBias({
                        downweightEducation: e.target.checked,
                      })
                    }
                    className="h-3 w-3 rounded border-slate-300"
                  />
                  Keep education weight capped for bias reduction
                </label>
              </div>
            </div>
          </section>

          {/* NLP */}
          <section className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <div className="mb-2 flex items-center justify-between gap-2">
              <div>
                <h3 className="text-xs font-semibold text-slate-900">
                  NLP / semantic matching
                </h3>
                <p className="text-[11px] text-slate-500">
                  Uses CV &amp; job description text for deeper fit scoring.
                </p>
              </div>
              <div className="rounded-full bg-slate-100 px-2 py-1 text-[10px] text-slate-600">
                {plan === "free" ? "Pro / Enterprise only" : "Available"}
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="flex items-center gap-2 text-[11px] text-slate-600">
                <input
                  type="checkbox"
                  disabled={readOnlyNlp}
                  checked={config.nlp.enableNlp && !readOnlyNlp}
                  onChange={(e) =>
                    updateNlp({
                      enableNlp: readOnlyNlp ? false : e.target.checked,
                    })
                  }
                  className="h-3 w-3 rounded border-slate-300 disabled:opacity-40"
                />
                Enable NLP-based semantic scoring
              </label>
              <div className="flex items-center gap-2">
                <label className="text-[11px] text-slate-600">
                  Max NLP boost (0–30 points)
                </label>
                <input
                  type="number"
                  min={0}
                  max={30}
                  disabled={readOnlyNlp}
                  value={config.nlp.nlpWeightBoost}
                  onChange={(e) =>
                    updateNlp({
                      nlpWeightBoost: Number(e.target.value || 0),
                    })
                  }
                  className="w-24 rounded border border-slate-200 bg-white px-2 py-1 text-[11px] disabled:bg-slate-100"
                />
              </div>
            </div>
          </section>

          {/* Save */}
          <div className="flex items-center justify-end gap-3 pt-1">
            {state.saving && (
              <span className="text-[11px] text-slate-500">
                Saving scoring settings…
              </span>
            )}
            <button
              type="submit"
              disabled={state.saving}
              className="inline-flex items-center rounded-full bg-[#172965] px-4 py-1.5 text-[11px] font-semibold text-white hover:bg-[#111c4a] disabled:opacity-60"
            >
              Save scoring settings
            </button>
          </div>
        </div>
      )}
    </form>
  );
}
