// app/ats/layout.tsx
import type { ReactNode } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerUser } from "@/lib/supabaseServer";

export const metadata = {
  title: "ThinkATS | ATS Workspace",
};

const navItems = [
  { href: "/ats/dashboard", label: "Workspace" },
  { href: "/ats/jobs", label: "Jobs" },
  { href: "/ats/candidates", label: "Candidates" },
  { href: "/ats/clients", label: "Clients" },
  { href: "/ats/tenants", label: "Tenants" },
  { href: "/ats/settings", label: "Settings" },
];

export default async function AtsLayout({
  children,
}: {
  children: ReactNode;
}) {
  const user = await getServerUser();

  if (!user) {
    // If not authenticated, send to login and remember intention
    redirect("/login?callbackUrl=/ats");
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-50">
      <div className="mx-auto flex max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:px-8">
        {/* Left sidebar */}
        <aside className="w-56 shrink-0">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Navigation
            </p>
            <nav className="mt-3 space-y-1 text-sm">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center justify-between rounded-lg px-3 py-2 text-slate-700 hover:bg-slate-50 hover:text-[#1E40AF]"
                >
                  <span>{item.label}</span>
                </Link>
              ))}
            </nav>
          </div>
        </aside>

        {/* Main workspace area */}
        <section className="flex-1">{children}</section>
      </div>
    </div>
  );
}
