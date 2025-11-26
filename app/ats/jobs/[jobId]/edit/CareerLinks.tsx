// app/ats/jobs/[jobId]/edit/CareerLinks.tsx
"use client";

import { useState } from "react";

type Props = {
  careerSiteUrl: string;
  jobPublicUrl: string;
};

export default function CareerLinks({
  careerSiteUrl,
  jobPublicUrl,
}: Props) {
  const [copiedKey, setCopiedKey] = useState<
    "site" | "job" | null
  >(null);

  async function handleCopy(
    value: string,
    key: "site" | "job",
  ) {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedKey(key);
      const timeout = setTimeout(() => {
        setCopiedKey(null);
      }, 1800);
      return () => clearTimeout(timeout);
    } catch (err) {
      console.error("Clipboard copy failed", err);
    }
  }

  return (
    <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-3 text-[11px] text-slate-700 shadow-sm">
      <h3 className="text-xs font-semibold text-slate-900">
        Career site & job links
      </h3>

      {/* Tenant career site */}
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[11px] font-medium text-slate-700">
            Career site URL
          </p>
          <p className="mt-0.5 truncate font-mono text-[11px] text-slate-800">
            {careerSiteUrl}
          </p>
          <p className="mt-0.5 text-[10px] text-slate-500">
            Share this as the general careers page for this tenant.
          </p>
        </div>
        <button
          type="button"
          onClick={() => handleCopy(careerSiteUrl, "site")}
          className="shrink-0 rounded-md border border-slate-300 bg-slate-50 px-2 py-1 text-[11px] text-slate-800 hover:bg-slate-100"
        >
          {copiedKey === "site" ? "Copied" : "Copy"}
        </button>
      </div>

      {/* This job's public URL */}
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[11px] font-medium text-slate-700">
            Public job URL
          </p>
          <p className="mt-0.5 truncate font-mono text-[11px] text-slate-800">
            {jobPublicUrl}
          </p>
          <p className="mt-0.5 text-[10px] text-slate-500">
            Direct link to this role on the career site (when
            visible).
          </p>
        </div>
        <button
          type="button"
          onClick={() => handleCopy(jobPublicUrl, "job")}
          className="shrink-0 rounded-md border border-slate-300 bg-slate-50 px-2 py-1 text-[11px] text-slate-800 hover:bg-slate-100"
        >
          {copiedKey === "job" ? "Copied" : "Copy"}
        </button>
      </div>
    </div>
  );
}
