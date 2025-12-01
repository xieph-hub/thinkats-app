// app/ats/layout.tsx
import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getServerUser } from "@/lib/supabaseServer";

export const metadata = {
  title: "ThinkATS | ATS Workspace",
};

export default async function AtsLayout({
  children,
}: {
  children: ReactNode;
}) {
  const { user } = await getServerUser();

  if (!user) {
    // If not authenticated, send to login and remember intention.
    const callback = encodeURIComponent("/ats");
    redirect(`/login?callbackUrl=${callback}`);
  }

  // Optionally: load tenant/org context here with supabase if needed.

  return (
    <div className="min-h-screen bg-slate-50">
      {children}
    </div>
  );
}
