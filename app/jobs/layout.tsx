// app/jobs/layout.tsx
import type { ReactNode } from "react";

export default function JobsLayout({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      {children}
    </div>
  );
}
