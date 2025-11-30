// components/ats/WorkspaceRibbon.tsx
import Link from "next/link";

type WorkspaceRibbonProps = {
  tenantName?: string | null;
  tenantSlug?: string | null;
  careerSiteUrl?: string; // e.g. "/jobs" or tenant-specific
};

export default function WorkspaceRibbon({
  tenantName,
  tenantSlug,
  careerSiteUrl = "/jobs",
}: WorkspaceRibbonProps) {
  const name = tenantName?.trim() || "Resourcin workspace";
  const slugLabel = tenantSlug ? `@${tenantSlug}` : undefined;

  const initial = name.charAt(0).toUpperCase();

  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-3 py-1 text-[11px] text-slate-700 shadow-sm">
      {/* Avatar + workspace name */}
      <div className="flex items-center gap-2">
        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#172965]/10 text-[10px] font-semibold text-[#172965]">
          {initial}
        </div>
        <div className="flex flex-col leading-tight">
          <span className="font-medium text-slate-900">{name}</span>
          {slugLabel && (
            <span className="text-[10px] text-slate-500">{slugLabel}</span>
          )}
        </div>
      </div>

      <span className="mx-1 h-4 w-px bg-slate-200" />

      {/* Switch workspace – for now goes to a future page */}
      <Link
        href="/ats/workspaces"
        className="text-[10px] font-medium text-slate-600 hover:text-[#172965]"
      >
        Switch workspace
      </Link>

      <span className="h-4 w-px bg-slate-200" />

      {/* View career site as candidate */}
      <Link
        href={careerSiteUrl}
        target="_blank"
        rel="noreferrer"
        className="rounded-full bg-slate-900/5 px-2 py-0.5 text-[10px] font-semibold text-[#172965] hover:bg-[#172965]/10"
      >
        View career site ↗
      </Link>
    </div>
  );
}
