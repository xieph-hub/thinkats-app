// app/ats/layout.tsx
"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

const navItems = [
  { href: "/ats/dashboard", label: "Dashboard" },
  { href: "/ats/jobs", label: "Jobs" },
  { href: "/ats/candidates", label: "Candidates" },
  { href: "/ats/clients", label: "Clients" },
  { href: "/ats/tenants", label: "Workspaces" },
];

export default function AtsLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentTenantId = searchParams.get("tenantId");

  const buildNavHref = (href: string) => {
    if (!currentTenantId) return href;
    const url = new URL(href, "http://ats.local");
    url.searchParams.set("tenantId", currentTenantId);
    return url.pathname + url.search;
  };

  const isActive = (href: string) => {
    const baseHref = href.split("?")[0];
    return pathname === baseHref || pathname.startsWith(`${baseHref}/`);
  };

  return (
    <div className="min-h-screen bg-slate-950">
      <div className="mx-auto flex max-w-7xl">
        {/* Sidebar */}
        <aside className="hidden w-64 shrink-0 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 px-4 py-6 text-slate-100 md:flex md:flex-col md:gap-6">
          {/* Brand */}
          <div>
            <Link
              href={buildNavHref("/ats/dashboard")}
              className="inline-flex items-center gap-2 rounded-xl bg-white/5 px-2.5 py-2 text-xs ring-1 ring-white/5 hover:bg-white/10"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#172965] text-xs font-semibold text-white">
                TA
              </div>
              <div className="flex flex-col leading-tight">
                <span className="text-sm font-semibold text-white">
                  ThinkATS
                </span>
                <span className="text-[10px] text-slate-300">
                  Admin workspace
                </span>
              </div>
            </Link>
          </div>

          {/* Nav */}
          <nav className="mt-4 flex flex-1 flex-col gap-1 text-sm">
            {navItems.map((item) => {
              const href = buildNavHref(item.href);
              const active = isActive(item.href);

              return (
                <Link
                  key={item.href}
                  href={href}
                  className={`group flex items-center justify-between rounded-lg px-3 py-2 text-[13px] transition ${
                    active
                      ? "bg-white/10 text-white shadow-sm ring-1 ring-[#FFC000]/60"
                      : "text-slate-300 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  <span>{item.label}</span>
                  <span
                    className={`h-1.5 w-1.5 rounded-full transition ${
                      active
                        ? "bg-[#FFC000]"
                        : "bg-transparent group-hover:bg-slate-400"
                    }`}
                  />
                </Link>
              );
            })}

            <div className="mt-4 rounded-lg border border-white/10 bg-white/5 p-3 text-[11px] text-slate-200">
              <p className="font-medium">Workspace tips</p>
              <p className="mt-1">
                Create & switch workspaces in{" "}
                <code className="rounded bg-black/30 px-1 py-0.5">
                  /ats/tenants
                </code>{" "}
                and link recruitment clients in{" "}
                <code className="rounded bg-black/30 px-1 py-0.5">
                  /ats/clients
                </code>
                .
              </p>
            </div>
          </nav>

          {/* Footer: brand + sign out */}
          <div className="mt-auto border-t border-white/10 pt-3 text-[11px] text-slate-400">
            <form
              method="POST"
              action="/api/auth/logout"
              className="flex items-center justify-between gap-2"
            >
              <p>
                Powered by{" "}
                <span className="font-medium text-[#64C247]">Resourcin</span>
              </p>
              <button
                type="submit"
                className="rounded-full border border-white/20 bg-white/5 px-2.5 py-1 text-[10px] font-medium text-slate-200 hover:border-[#FFC000]/80 hover:bg-[#172965]/60 hover:text-white"
              >
                Sign out
              </button>
            </form>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto bg-slate-50">
          {/* Tiny workspace ribbon */}
          <div className="border-b border-slate-200 bg-white/80 px-4 py-2 text-[11px] text-slate-600 backdrop-blur-sm sm:px-6">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center rounded-full bg-[#172965]/5 px-2 py-0.5 font-medium text-[#172965]">
                  {currentTenantId ? "Workspace mode" : "Default workspace"}
                </span>
                {currentTenantId && (
                  <span className="font-mono text-[10px] text-slate-400">
                    tenantId: {currentTenantId.slice(0, 8)}…
                  </span>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Link
                  href="/ats/tenants"
                  className="text-[11px] font-medium text-[#172965] hover:underline"
                >
                  Switch workspace
                </Link>
                <span className="text-slate-300">•</span>
                <Link
                  href="/jobs"
                  className="text-[11px] text-slate-600 hover:text-[#172965] hover:underline"
                >
                  View career site as candidate
                </Link>
              </div>
            </div>
          </div>

          {/* Page body */}
          <div className="bg-slate-50">
            <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
