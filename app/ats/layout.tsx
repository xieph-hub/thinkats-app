// app/ats/layout.tsx
import type { ReactNode } from "react";
import AtsNav from "@/components/ats/AtsNav";

export default function AtsLayout({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto flex w-full max-w-6xl gap-6 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      {/* Sidebar (desktop) */}
      <aside className="hidden w-52 flex-shrink-0 flex-col gap-4 md:flex">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            ThinkATS
          </p>
          <p className="mt-1 text-sm font-semibold text-slate-900">
            Applicant Tracking
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Tenant: Resourcin (internal)
          </p>
        </div>
        <AtsNav />
      </aside>

      {/* Main content */}
      <section className="min-w-0 flex-1">{children}</section>
    </div>
  );
}
