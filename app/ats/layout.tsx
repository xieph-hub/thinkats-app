// app/ats/layout.tsx
import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getServerUser } from "@/lib/supabaseServer";
import AtsSidebar from "@/components/ats/AtsSidebar";
import AccountMenu from "@/components/ats/AccountMenu";

export const metadata = {
  title: "ThinkATS | ATS Workspace",
  description:
    "Manage tenants, jobs, candidates and clients from one shared ATS workspace.",
};

export default async function AtsLayout({
  children,
}: {
  children: ReactNode;
}) {
  const user = await getServerUser();

  if (!user) {
    // Protect the ATS – bounce unauthenticated users to login
    redirect("/login?callbackUrl=/ats");
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      <AtsSidebar />

      <div className="flex min-h-screen flex-1 flex-col">
        {/* Top bar */}
        <header className="flex items-center justify-between border-b border-slate-200 bg-white/80 px-4 py-3 text-sm backdrop-blur-sm md:px-6">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              ATS workspace
            </p>
            <p className="mt-0.5 max-w-xs truncate text-xs text-slate-500">
              Logged in as{" "}
              <span className="font-medium text-slate-700">
                {user.email}
              </span>
            </p>
          </div>

          <AccountMenu email={user.email ?? null} />
        </header>

        <main className="flex-1 px-4 py-4 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
