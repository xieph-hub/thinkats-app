import type { ReactNode } from "react";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import AtsLayoutClient from "./AtsLayoutClient";
import { getCurrentUser } from "@/lib/auth";

export default async function AtsLayout({
  children,
}: {
  children: ReactNode;
}) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

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
