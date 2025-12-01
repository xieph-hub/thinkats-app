// app/ats/layout.tsx
import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getServerUser } from "@/lib/supabaseServer";

export const metadata = {
  title: "ThinkATS | ATS Workspace",
  description:
    "ATS workspace for hiring teams using ThinkATS to manage roles, candidates, and pipelines.",
};

type AtsLayoutProps = {
  children: ReactNode;
};

export default async function AtsLayout({ children }: AtsLayoutProps) {
  // getServerUser() returns the Supabase `User | null` directly
  const user = await getServerUser();

  if (!user) {
    // Not authenticated: send to login and remember they were trying to reach /ats
    redirect("/login?callbackUrl=/ats");
  }

  // Authenticated: render ATS workspace shell
  return <div className="min-h-screen bg-slate-50">{children}</div>;
}
