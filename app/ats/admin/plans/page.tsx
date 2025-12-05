// app/ats/admin/plans/page.tsx
"use client";

import { useEffect, useState } from "react";

type Plan = "free" | "pro" | "enterprise";

type WorkspaceRow = {
  workspace_slug: string;
  plan: Plan;
  hiring_mode?: string | null;
};

export default function AtsPlansAdminPage() {
  const [loading, setLoading] = useState(true);
  const [savingSlug, setSavingSlug] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [workspaces, setWorkspaces] = useState<WorkspaceRow[]>([]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/ats/admin/workspaces");
        const data = await res.json();

        if (!res.ok || !data.ok) {
          throw new Error(data.error || "Failed to load workspaces");
        }

        if (cancelled) return;

        setWorkspaces(
          (data.workspaces || []).map((w: any) => ({
            workspace_slug: w.workspace_slug,
            plan: (w.plan || "free") as Plan,
            hiring_mode: w.hiring_mode,
          })),
        );
      } catch (err: any) {
        if (cancelled) return;
        setError(err?.message || "Failed to load workspaces");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  async function handlePlanChange(slug: string, newPlan: Plan) {
    setSavingSlug(slug);
    setError(null);

    try {
      const res = await fetch("/api/ats/admin/workspaces", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspaceSlug: slug, plan: newPlan }),
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || "Failed to update plan");
      }

      setWorkspaces((prev) =>
        prev.map((w) =>
          w.workspace_slug === slug ? { ...w, plan: newPlan } : w,
        ),
      );
    } catch (err: any) {
      setError(err?.message || "Failed to update plan");
    } finally {
      setSavingSlug(null);
    }
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-6 lg:px-8">
      <header className="space-y-1">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
          ATS · Admin
        </p>
        <h1 className="text-xl font-semibold text-slate-900">
          Client plans &amp; tiers
        </h1>
        <p className="text-xs text-slate-600">
          Manually upgrade or downgrade client workspaces between Free, Pro and
          Enterprise. This controls access to NLP scoring and other premium
          features.
        </p>
      </header>

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 text-xs text-slate-500">
          Loading client workspaces…
        </div>
      ) : workspaces.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 text-xs text-slate-500">
          No workspaces found yet. A row will be created automatically the first
          time a client saves scoring settings.
        </div>
      ) : (
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <table className="min-w-full text-xs">
            <thead className="bg-slate-50/80 text-[11px] uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-2 text-left">Workspace</th>
                <th className="px-4 py-2 text-left">Current plan</th>
                <th className="px-4 py-2 text-left">Hiring mode</th>
                <th className="px-4 py-2 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {workspaces.map((w) => (
                <tr key={w.workspace_slug}>
                  <td className="px-4 py-3">
                    <p className="text-xs font-medium text-slate-900">
                      {w.workspace_slug}
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    <select
                      className="rounded-md border border-slate-200 bg-white px-2 py-1 text-[11px]"
                      value={w.plan}
                      onChange={(e) =>
                        handlePlanChange(
                          w.workspace_slug,
                          e.target.value as Plan,
                        )
                      }
                      disabled={savingSlug === w.workspace_slug}
                    >
                      <option value="free">Free</option>
                      <option value="pro">Pro</option>
                      <option value="enterprise">Enterprise</option>
                    </select>
                  </td>
                  <td className="px-4 py-3 text-[11px] text-slate-500">
                    {w.hiring_mode || "balanced"}
                  </td>
                  <td className="px-4 py-3 text-right text-[11px] text-slate-500">
                    {savingSlug === w.workspace_slug
                      ? "Saving…"
                      : "Changes save instantly"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}
    </div>
  );
}
