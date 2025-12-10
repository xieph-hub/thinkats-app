// components/careers/CareersLayoutEditor.tsx
"use client";

import { useState } from "react";
import type { CareerLayout } from "@/types/careersLayout";
import { parseCareerLayout } from "@/lib/careersLayout";

type Props = {
  tenantId: string;
  initialLayout?: CareerLayout | null;
};

export default function CareersLayoutEditor({ tenantId, initialLayout }: Props) {
  const [jsonValue, setJsonValue] = useState(
    JSON.stringify(initialLayout ?? { sections: [] }, null, 2),
  );
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setStatus(null);
    setError(null);

    let parsed: CareerLayout;
    try {
      const raw = JSON.parse(jsonValue);
      parsed = parseCareerLayout(raw);
    } catch {
      setError("Layout JSON is invalid. Please fix and try again.");
      setSaving(false);
      return;
    }

    try {
      const res = await fetch("/api/ats/settings/careers-layout", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          tenantId,
          layout: parsed,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.ok) {
        throw new Error(data.error || "Failed to save layout.");
      }

      setStatus("Layout saved");
    } catch (err: any) {
      setError(err?.message ?? "Something went wrong while saving.");
    } finally {
      setSaving(false);
    }
  }

  function handleReset() {
    const defaultLayout: CareerLayout = {
      sections: [
        {
          type: "hero",
          title: "Jobs",
          subtitle:
            "Explore open jobs and opportunities to work with this organisation.",
          align: "left",
          showCta: true,
        },
        {
          type: "intro",
          title: "Working here",
          bodyHtml:
            "<p>Describe the culture, how teams collaborate and what you look for in teammates.</p>",
        },
        {
          type: "jobs_list",
          title: "Open jobs",
          layout: "list",
          showSearch: false,
          showFilters: false,
        },
      ],
    };

    setJsonValue(JSON.stringify(defaultLayout, null, 2));
    setStatus(null);
    setError(null);
  }

  return (
    <section className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5 text-[11px] text-slate-700 shadow-sm">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h2 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
            Jobs layout JSON
          </h2>
          <p className="mt-1 text-[10px] text-slate-500">
            Power users can shape the jobs hub and jobs list by editing this
            JSON. Most tenants won&apos;t need to touch it.
          </p>
        </div>
        <button
          type="button"
          onClick={handleReset}
          className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[10px] font-medium text-slate-700 hover:bg-slate-100"
        >
          Reset to example
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <textarea
          value={jsonValue}
          onChange={(e) => setJsonValue(e.target.value)}
          spellCheck={false}
          rows={14}
          className="mt-1 block w-full rounded-md border border-slate-200 bg-slate-950/5 px-3 py-2 font-mono text-[11px] text-slate-900 outline-none focus:border-[#172965] focus:bg-white focus:ring-1 focus:ring-[#172965]"
        />

        <div className="flex items-center justify-between gap-3">
          <div className="min-h-[1.25rem] text-[10px]">
            {status && (
              <span className="text-emerald-600">
                ● <span className="font-medium">{status}</span>
              </span>
            )}
            {error && (
              <span className="text-rose-600">
                ● <span className="font-medium">{error}</span>
              </span>
            )}
          </div>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center rounded-full bg-[#172965] px-4 py-2 text-[11px] font-semibold text-white shadow-sm hover:bg-[#12204d] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? "Saving…" : "Save layout"}
          </button>
        </div>
      </form>
    </section>
  );
}
