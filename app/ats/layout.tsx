// app/ats/layout.tsx
import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getServerUser } from "@/lib/supabaseServer";
import AtsSidebar from "@/components/ats/AtsSidebar";
import AtsTopbar from "@/components/ats/AtsTopbar";

export const metadata = {
  title: "ThinkATS | ATS Workspace",
  description:
    "Manage tenants, jobs, candidates and clients from one shared ATS workspace.",
};

export default async function AtsLayout({ children }: { children: ReactNode }) {
  const user = await getServerUser();

  if (!user) {
    // Protect the ATS
    redirect("/login?callbackUrl=/ats");
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      <AtsSidebar />
      <div className="flex min-h-screen flex-1 flex-col">
        <AtsTopbar user={user} />
        <main className="flex-1 px-4 py-4 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
