"use client";

import { useState } from "react";

// Keep it loose for now – this is just JSON we round-trip to the API.
// If you later introduce a shared type, you can wire it back in.
type CareerLayout = unknown;

type Props = {
  tenantId: string;
  initialLayout: CareerLayout | null;
};

export default function CareersLayoutEditor({ tenantId, initialLayout }: Props) {
  const [jsonValue, setJsonValue] = useState(() =>
    initialLayout
      ? JSON.stringify(initialLayout, null, 2)
      : `{
  "version": 1,
  "sections": []
}`
  );
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function handleSave() {
    setError(null);
    setSuccess(null);

    let parsed: unknown;
    try {
      parsed = jsonValue.trim() ? JSON.parse(jsonValue) : null;
    } catch {
      setError("Invalid JSON. Please fix and try again.");
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch("/api/ats/settings/careers/layout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenantId,
          layout: parsed,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || `Request failed with ${res.status}`);
      }

      setSuccess("Layout saved. Refresh the careers site to see your changes.");
    } catch (err: any) {
      setError(err?.message || "Failed to save layout.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="mt-8 space-y-4 rounded-2xl border border-slate-200/60 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-sm font-semibold text-slate-900">
            JSON layout (advanced)
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            This controls the sections on your public careers page. Edit with
            care – invalid JSON will be rejected.
          </p>
        </div>
        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving}
          className="inline-flex items-center rounded-full border border-slate-300 bg-slate-900 px-3 py-1.5 text-xs font-medium text-white shadow-sm disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSaving ? "Saving…" : "Save layout"}
        </button>
      </div>

      <textarea
        className="mt-2 h-72 w-full rounded-xl border border-slate-200 bg-slate-950/95 font-mono text-xs text-slate-50 shadow-inner outline-none focus-visible:border-sky-400 focus-visible:ring-2 focus-visible:ring-sky-100"
        spellCheck={false}
        value={jsonValue}
        onChange={(e) => setJsonValue(e.target.value)}
      />

      {error && (
        <p className="text-xs font-medium text-rose-600">
          {error}
        </p>
      )}

      {success && (
        <p className="text-xs font-medium text-emerald-600">
          {success}
        </p>
      )}
    </div>
  );
}
