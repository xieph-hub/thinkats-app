// components/ats/AtsSidebar.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

type NavItem = { href: string; label: string };

const mainNav: NavItem[] = [
  { href: "/ats", label: "Workspace" },
  { href: "/ats/jobs", label: "Jobs" },
  { href: "/ats/candidates", label: "Candidates" },
  { href: "/ats/clients", label: "Clients" },
  { href: "/ats/tenants", label: "Tenants" },
];

const secondaryNavBase: NavItem[] = [
  { href: "/ats/settings", label: "Settings" },
  // "Plans" is appended at runtime for super-admins
];

function isActive(pathname: string | null, href: string) {
  if (!pathname) return false;
  if (href === "/ats") {
    return pathname === "/ats" || pathname === "/ats/dashboard";
  }
  return pathname === href || pathname.startsWith(href + "/");
}

export default function AtsSidebar() {
  const pathname = usePathname();
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadRole() {
      try {
        const res = await fetch("/api/ats/auth/me", {
          method: "GET",
          cache: "no-store",
        });

        const data = await res.json().catch(() => null);
        if (cancelled) return;

        if (res.ok && data && data.ok && data.isSuperAdmin) {
          setIsSuperAdmin(true);
        } else {
          setIsSuperAdmin(false);
        }
      } catch (err) {
        if (!cancelled) {
          setIsSuperAdmin(false);
        }
      }
    }

    loadRole();
    return () => {
      cancelled = true;
    };
  }, []);

  const secondaryNav: NavItem[] = isSuperAdmin
    ? [
        ...secondaryNavBase,
        { href: "/ats/admin/plans", label: "Plans" }, // only for super admin
      ]
    : secondaryNavBase;

  return (
    <aside className="hidden w-60 shrink-0 border-r border-slate-200 bg-slate-950 text-slate-50 md:flex md:flex-col">
      {/* Brand / workspace */}
      <div className="flex h-14 items-center gap-2 border-b border-slate-800 px-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-[#1E40AF] text-xs font-bold text-white">
          TA
        </div>
        <div className="leading-tight">
          <div className="text-[11px] uppercase tracking-wide text-slate-400">
            ThinkATS
          </div>
          <div className="text-sm font-semibold text-white">ATS workspace</div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-5 overflow-y-auto px-2 py-4 text-sm">
        <div>
          <p className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
            Main
          </p>
          <div className="space-y-1">
            {mainNav.map((item) => {
              const active = isActive(pathname, item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center rounded-md px-3 py-2 transition-colors ${
                    active
                      ? "bg-slate-900 text-white shadow-sm"
                      : "text-slate-300 hover:bg-slate-900/60 hover:text-white"
                  }`}
                >
                  <span className="truncate">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>

        <div>
          <p className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
            Admin
          </p>
          <div className="space-y-1">
            {secondaryNav.map((item) => {
              const active = isActive(pathname, item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center rounded-md px-3 py-2 transition-colors ${
                    active
                      ? "bg-slate-900 text-white shadow-sm"
                      : "text-slate-300 hover:bg-slate-900/60 hover:text-white"
                  }`}
                >
                  <span className="truncate">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Version / status */}
      <div className="border-t border-slate-800 px-3 py-3 text-xs text-slate-500">
        Multi-tenant demo · v0.1
      </div>
    </aside>
  );
}
