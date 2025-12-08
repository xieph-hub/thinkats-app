// app/ats/AtsLayoutClient.tsx
"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { AppUserWithTenants } from "@/lib/auth/getServerUser";

type Props = {
  user: AppUserWithTenants;
  children: ReactNode;
};

const navItems = [
  { href: "/ats/dashboard", label: "Dashboard" },
  { href: "/ats/jobs", label: "Jobs" },
  { href: "/ats/candidates", label: "Candidates" },
  { href: "/ats/tenants", label: "Workspaces" },
  { href: "/ats/settings", label: "Settings" },
];

function isActive(pathname: string, href: string) {
  if (href === "/ats/dashboard") {
    return pathname === "/ats" || pathname.startsWith("/ats/dashboard");
  }
  return pathname === href || pathname.startsWith(href + "/");
}

export default function AtsLayoutClient({ user, children }: Props) {
  const pathname = usePathname() || "/ats";
  const router = useRouter();

  async function handleSignOut() {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch (err) {
      console.error("Logout error:", err);
    } finally {
      router.push("/login");
    }
  }

  const displayName =
    user.fullName ||
    user.email ||
    "ATS user";

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50">
      <div className="flex h-screen">
        {/* Sidebar */}
        <aside className="hidden w-60 flex-col border-r border-slate-800 bg-slate-950/80 px-4 py-4 lg:flex">
          <div className="mb-6 flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/90 text-xs font-bold">
              TA
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-semibold">ThinkATS</span>
              <span className="text-[11px] text-slate-500">
                Multi-tenant ATS workspace
              </span>
            </div>
          </div>

          <nav className="flex-1 space-y-1 text-sm">
            {navItems.map((item) => {
              const active = isActive(pathname, item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={[
                    "flex items-center rounded-lg px-3 py-2 transition",
                    active
                      ? "bg-slate-800 text-slate-50"
                      : "text-slate-400 hover:bg-slate-900 hover:text-slate-100",
                  ].join(" ")}
                >
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <button
            type="button"
            onClick={handleSignOut}
            className="mt-4 w-full rounded-lg border border-slate-700 bg-slate-900/80 px-3 py-2 text-xs font-medium text-slate-200 hover:bg-slate-800"
          >
            Sign out
          </button>
        </aside>

        {/* Main content area */}
        <div className="flex min-w-0 flex-1 flex-col">
          {/* Top bar */}
          <header className="flex items-center justify-between border-b border-slate-800 bg-slate-950/80 px-4 py-3">
            <div className="flex items-center gap-2 lg:hidden">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/90 text-xs font-bold">
                TA
              </div>
              <span className="text-sm font-semibold">ThinkATS</span>
            </div>

            <div className="flex-1" />

            <div className="flex items-center gap-3">
              <div className="hidden flex-col items-end text-right text-xs sm:flex">
                <span className="max-w-[180px] truncate font-medium text-slate-100">
                  {displayName}
                </span>
                {user.email && (
                  <span className="max-w-[180px] truncate text-[11px] text-slate-500">
                    {user.email}
                  </span>
                )}
              </div>
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-800 text-[11px] font-semibold uppercase">
                {(user.fullName || user.email || "?")
                  .split(" ")
                  .map((p) => p[0])
                  .join("")
                  .slice(0, 2)}
              </div>
            </div>
          </header>

          {/* Page body */}
          <main className="min-h-0 flex-1 overflow-y-auto bg-slate-950 px-4 py-4 sm:px-6 sm:py-6">
            <div className="mx-auto max-w-6xl">{children}</div>
          </main>
        </div>
      </div>
    </div>
  );
}
