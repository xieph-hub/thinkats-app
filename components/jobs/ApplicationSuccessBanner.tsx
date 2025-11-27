// components/jobs/ApplicationSuccessBanner.tsx
"use client";

import { useEffect } from "react";

export default function ApplicationSuccessBanner() {
  useEffect(() => {
    // Ensure user is at the top when this banner is shown
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  return (
    <div className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs text-emerald-900 shadow-sm">
      <div className="flex items-start gap-2">
        <div className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-emerald-500" />
        <div className="space-y-1">
          <p className="text-[11px] font-semibold uppercase tracking-wide">
            Application received
          </p>
          <p className="text-[11px]">
            Thank you for applying. Your profile is now in our{" "}
            <span className="font-semibold">Resourcin candidate pipeline</span>.
            We’ll review your fit against this role and other matching mandates
            across our clients.
          </p>
          <p className="text-[11px] text-emerald-800">
            You’ll hear from us if you move to the next stage. In the meantime,
            feel free to explore more roles or share this job with a friend.
          </p>
        </div>
      </div>
    </div>
  );
}
