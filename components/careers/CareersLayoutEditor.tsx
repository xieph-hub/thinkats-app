// components/careers/CareersLayoutEditor.tsx
"use client";

import { useState } from "react";
import type { CareerLayout } from "@/lib/careersLayout";
import { getDefaultCareerLayout, parseCareerLayout } from "@/lib/careersLayout";

type Props = {
  tenantId: string;
  initialLayout?: CareerLayout | null;
};

export default function CareersLayoutEditor({ tenantId, initialLayout }: Props) {
  const normalisedLayout =
    initialLayout && initialLayout.sections
      ? parseCareerLayout(initialLayout)
      : getDefaultCareerLayout();

  const [jsonText, setJsonText] = useState(
    JSON.stringify(normalisedLayout, null, 2),
  );
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setIsSaving(true);

    try {
      let parsed: unknown;

      try {
        parsed = JSON.parse(jsonText);
      } catch (err: any) {
        throw new Error(
          `Invalid JSON: ${err?.message || "Could not parse JSON."}`,
        );
      }

      const layout = parseCareerLayout(parsed);

      const res = await fetch("/api/ats/settings/careers-layout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ tenantId, layout }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error || "Failed to save layout.");
      }

      setSuccess("Layout saved. Refresh the public careers site to see changes.");
    } catch (err: any) {
      setError(err?.message || "Something went wrong while saving.");
    } finally {
      setIsSaving(false);
    }
  }

  function handleReset() {
    const def = getDefaultCareerLayout();
    setJsonText(JSON.stringify(def, null, 2));
    setError(null);
    setSuccess(null);
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 text-[11px] text-slate-700 shadow-sm">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div>
          <h2 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
            Careers page layout (advanced)
          </h2>
          <p className="mt-1 text-[10px] text-slate-500">
            JSON layout for the tenant&apos;s public careers homepage. Keep the
            structure valid; we&apos;ll validate server-side with Zod.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleReset}
            className="inline-flex items-center rounded-full border border-slate-300 px-3 py-1.5 text-[10px] font-medium text-slate-700 hover:bg-slate-50"
          >
            Reset to default
          </button>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-3">
        <textarea
          value={jsonText}
          onChange={(e) => setJsonText(e.target.value)}
          rows={16}
          spellCheck={false}
          className="font-mono block w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-[11px] text-slate-900 outline-none focus:border-[#172965] focus:bg-white focus:ring-1 focus:ring-[#172965]"
        />

        <div className="flex items-center justify-between">
          <div className="min-h-[1.25rem] text-[10px]">
            {error && <span className="text-red-600">{error}</span>}
            {success && !error && (
              <span className="text-emerald-600">{success}</span>
            )}
          </div>
          <button
            type="submit"
            disabled={isSaving}
            className="inline-flex items-center rounded-full bg-[#172965] px-4 py-2 text-[11px] font-semibold text-white shadow-sm hover:bg-[#12204d] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSaving ? "Saving…" : "Save layout JSON"}
          </button>
        </div>
      </form>
    </section>
  );
}
