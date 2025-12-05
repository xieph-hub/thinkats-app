// app/ats/settings/scoring/page.tsx
import ScoringSettingsCard from "@/components/ats/settings/ScoringSettingsCard";

export const metadata = {
  title: "Scoring settings | ThinkATS",
  description:
    "Control how ThinkATS ranks candidates and reduces bias across your workspace.",
};

export default function ScoringSettingsPage() {
  return (
    <main className="px-6 py-8">
      <div className="mx-auto flex max-w-5xl flex-col gap-6">
        <header>
          <h1 className="text-lg font-semibold text-slate-900">
            Scoring &amp; ranking
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Workspace-level controls for tiers, weights, skills and bias
            reduction. Per-job overrides still apply inside each role.
          </p>
        </header>

        <ScoringSettingsCard />
      </div>
    </main>
  );
}
