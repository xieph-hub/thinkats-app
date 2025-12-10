// components/careers/CareersLayoutEditor.tsx
"use client";

import { useState } from "react";
import type { CareerLayout } from "@/lib/careersLayout";

type Props = {
  tenantId: string;
  initialLayout: CareerLayout | null;
};

function ensureDefaultLayout(layout: CareerLayout | null): CareerLayout {
  if (layout && Array.isArray(layout.sections) && layout.sections.length > 0) {
    return layout;
  }

  return {
    sections: [
      { type: "hero" },
      { type: "about" },
      { type: "featuredRoles", props: { limit: 8 } },
    ],
  };
}

export default function CareersLayoutEditor({ tenantId, initialLayout }: Props) {
  const [layout, setLayout] = useState<CareerLayout>(
    ensureDefaultLayout(initialLayout),
  );
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  const hero = layout.sections.find((s) => s.type === "hero");
  const about = layout.sections.find((s) => s.type === "about");
  const featured = layout.sections.find((s) => s.type === "featuredRoles");

  function updateSection(type: string, patch: any) {
    setLayout((prev) => {
      const nextSections = prev.sections.map((s) => {
        if (s.type !== type) return s;
        return {
          ...s,
          props: {
            ...(s as any).props,
            ...patch,
          },
        };
      });

      return { ...prev, sections: nextSections };
    });
  }

  async function handleSave() {
    setSaving(true);
    setStatus(null);

    try {
      const res = await fetch("/api/ats/settings/careers/layout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenantId,
          layout,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to save layout");
      }

      setStatus("Saved");
    } catch (err: any) {
      setStatus(err?.message || "Error saving layout");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6 rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-800">
      <h2 className="text-base font-semibold">Careers page layout</h2>
      <p className="text-xs text-slate-500">
        Control the hero copy, about section, and how many roles show on the
        careers homepage. This writes JSON into{" "}
        <code className="rounded bg-slate-100 px-1 py-0.5 text-[11px]">
          CareerPage.layout
        </code>{" "}
        for this tenant.
      </p>

      {/* Hero */}
      <section className="space-y-2 rounded-xl border border-slate-200 bg-slate-50/70 p-3">
        <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
          Hero
        </h3>
        <div className="space-y-2">
          <label className="block text-xs font-medium text-slate-600">
            Title
            <input
              type="text"
              defaultValue={(hero as any)?.props?.title || ""}
              onChange={(e) =>
                updateSection("hero", { title: e.target.value || undefined })
              }
              className="mt-1 w-full rounded-md border border-slate-200 bg-white px-2 py-1 text-xs outline-none focus:border-slate-400"
            />
          </label>
          <label className="block text-xs font-medium text-slate-600">
            Subtitle
            <textarea
              rows={3}
              defaultValue={(hero as any)?.props?.subtitle || ""}
              onChange={(e) =>
                updateSection("hero", {
                  subtitle: e.target.value || undefined,
                })
              }
              className="mt-1 w-full rounded-md border border-slate-200 bg-white px-2 py-1 text-xs outline-none focus:border-slate-400"
            />
          </label>
        </div>
      </section>

      {/* About */}
      <section className="space-y-2 rounded-xl border border-slate-200 bg-slate-50/70 p-3">
        <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
          About section
        </h3>
        <label className="block text-xs font-medium text-slate-600">
          Custom title (optional)
          <input
            type="text"
            defaultValue={(about as any)?.props?.title || ""}
            onChange={(e) =>
              updateSection("about", { title: e.target.value || undefined })
            }
            className="mt-1 w-full rounded-md border border-slate-200 bg-white px-2 py-1 text-xs outline-none focus:border-slate-400"
          />
        </label>
        <label className="block text-xs font-medium text-slate-600">
          About HTML
          <textarea
            rows={5}
            defaultValue={(about as any)?.props?.html || ""}
            onChange={(e) =>
              updateSection("about", { html: e.target.value || undefined })
            }
            className="mt-1 w-full rounded-md border border-slate-200 bg-white px-2 py-1 text-xs outline-none focus:border-slate-400"
          />
        </label>
      </section>

      {/* Featured roles */}
      <section className="space-y-2 rounded-xl border border-slate-200 bg-slate-50/70 p-3">
        <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
          Featured roles
        </h3>
        <label className="block text-xs font-medium text-slate-600">
          Number of roles to show
          <input
            type="number"
            min={1}
            max={50}
            defaultValue={(featured as any)?.props?.limit ?? 8}
            onChange={(e) =>
              updateSection("featuredRoles", {
                limit: Number(e.target.value || 8),
              })
            }
            className="mt-1 w-24 rounded-md border border-slate-200 bg-white px-2 py-1 text-xs outline-none focus:border-slate-400"
          />
        </label>
      </section>

      <div className="flex items-center justify-between gap-3 pt-2">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center justify-center rounded-md border border-slate-900 bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-60"
        >
          {saving ? "Saving…" : "Save layout"}
        </button>
        {status && (
          <p className="text-[11px] text-slate-500">
            {status === "Saved" ? "Layout saved." : status}
          </p>
        )}
      </div>
    </div>
  );
}
