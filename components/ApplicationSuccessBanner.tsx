// components/jobs/ApplicationSuccessBanner.tsx
"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect } from "react";

export function ApplicationSuccessBanner() {
  const searchParams = useSearchParams();
  const hasApplied = searchParams.get("applied") === "1";

  useEffect(() => {
    if (hasApplied) {
      // Ensure the user actually sees the banner
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [hasApplied]);

  if (!hasApplied) return null;

  return (
    <div className="mb-4 rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-xs text-emerald-900">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-700">
            Application received
          </p>
          <p className="mt-1 text-xs text-emerald-900">
            Thank you – your application has been submitted successfully.
            We&apos;ll review your profile and reach out if there&apos;s a strong match
            for this role or similar mandates we&apos;re running.
          </p>
        </div>
        <div className="mt-2 flex flex-wrap gap-2 sm:mt-0 sm:justify-end">
          <Link
            href="/jobs"
            className="inline-flex items-center rounded-full border border-emerald-200 bg-white px-3 py-1.5 text-[11px] font-semibold text-emerald-800 hover:bg-emerald-50"
          >
            Browse other roles
          </Link>
          <Link
            href="/talent-network"
            className="inline-flex items-center rounded-full bg-[#172965] px-3 py-1.5 text-[11px] font-semibold text-white hover:bg-[#111c4c]"
          >
            Join talent network
          </Link>
        </div>
      </div>
    </div>
  );
}
