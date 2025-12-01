// app/ats/layout.tsx
"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/ats/dashboard", label: "Dashboard" },
  { href: "/ats/jobs", label: "Jobs" },
  { href: "/ats/candidates", label: "Candidates" },
  { href: "/ats/clients", label: "Clients" },
  { href: "/ats/tenants", label: "Workspaces" },
];

export default function AtsLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`);

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto flex max-w-7xl">
        {/* Sidebar */}
        <aside className="hidden w-60 shrink-0 border-r border-slate-200 bg-white/95 px-4 py-6 md:flex md:flex-col md:gap-6">
          {/* Brand */}
          <div>
            <Link
              href="/ats/dashboard"
              className="inline-flex items-center gap-2"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#172965] text-xs font-semibold text-white">
                TA
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-slate-900">
                  ThinkATS
                </span>
                <span className="text-[11px] text-slate-500">
                  Internal ATS workspace
                </span>
              </div>
            </Link>
          </div>

          {/* Nav */}
          <nav className="flex flex-1 flex-col gap-1 text-sm">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center justify-between rounded-lg px-3 py-2 text-[13px] transition-colors ${
                  isActive(item.href)
                    ? "bg-[#172965]/8 font-semibold text-[#172965]"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                <span>{item.label}</span>
                {isActive(item.href) && (
                  <span className="h-1.5 w-1.5 rounded-full bg-[#172965]" />
                )}
              </Link>
            ))}

            <div className="mt-4 rounded-lg border border-dashed border-slate-300 bg-slate-50 p-3">
              <p className="text-[11px] font-medium text-slate-700">
                Need help?
              </p>
              <p className="mt-1 text-[11px] text-slate-500">
                Use{" "}
                <span className="font-mono text-[10px]">/ats/tenants</span> to
                spin up new workspaces, and{" "}
                <span className="font-mono text-[10px]">/ats/clients</span> to
                add recruitment clients under each tenant.
              </p>
            </div>
          </nav>

          <div className="mt-auto border-t border-slate-200 pt-3">
            <p className="text-[11px] text-slate-500">
              Powered by{" "}
              <span className="font-medium text-slate-700">Resourcin</span>
            </p>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1">
          {/* Tiny workspace / career-site ribbon */}
          <div className="sticky top-0 z-20 border-b border-slate-200 bg-slate-50/95 px-4 py-2 text-[11px] text-slate-700 backdrop-blur">
            <div className="mx-auto flex max-w-5xl items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center rounded-full bg-[#172965]/10 px-2 py-0.5 text-[10px] font-semibold text-[#172965]">
                  Resourcin workspace
                </span>
                <span className="hidden text-[11px] text-slate-500 sm:inline">
                  ThinkATS · recruiter view
                </span>
              </div>

              <div className="flex items-center gap-2">
                <Link
                  href="/jobs"
                  className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-medium text-slate-700 hover:border-[#172965]/40 hover:text-[#172965]"
                >
                  View career site as candidate
                  <span className="ml-1 text-[10px]">↗</span>
                </Link>
                <Link
                  href="/ats/settings/workspace"
                  className="hidden items-center rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-medium text-slate-600 hover:border-[#172965]/40 hover:text-[#172965] sm:inline-flex"
                >
                  Workspace settings
                </Link>
              </div>
            </div>
          </div>

          {/* Page content — each ATS page manages its own container/width */}
          {children}
        </main>
      </div>
    </div>
  );
}
