// app/ats/layout.tsx
import type { ReactNode } from "react";
import { Suspense } from "react";
import AtsLayoutClient from "./AtsLayoutClient";

export default function AtsLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-slate-50 text-xs text-slate-500">
          Loading ATS workspace…
        </div>
      }
    >
      <AtsLayoutClient>{children}</AtsLayoutClient>
    </Suspense>
  );
}
