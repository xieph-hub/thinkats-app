// app/ats/AtsLayoutClient.tsx
"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { AppUserWithTenants } from "@/lib/auth/getServerUser";

type Props = {
  user: AppUserWithTenants;
  isSuperAdmin: boolean;
  children: ReactNode;
};

type NavItem = {
  href: string;
  label: string;
};

type NavGroup = {
  label: string;
  items: NavItem[];
};

// 🔹 Global ATS-style IA with Admin → Plans
const navGroups: NavGroup[] = [
  {
    label: "Hiring",
    items: [
      { href: "/ats/dashboard", label: "Dashboard" },
      { href: "/ats/jobs", label: "Jobs" },
      { href: "/ats/applications", label: "Applications" },
      { href: "/ats/candidates", label: "Candidates" },
      { href: "/ats/clients", label: "Clients" },
    ],
  },
  {
    label: "Insights",
    items: [{ href: "/ats/analytics", label: "Analytics" }],
  },
  {
    label: "Admin",
    items: [
      { href: "/ats/tenants", label: "Workspaces" },
      { href: "/ats/admin/plans", label: "Plans" },
      { href: "/ats/settings", label: "Settings" },
    ],
  },
];

function isActive(pathname: string, href: string) {
  if (href === "/ats/dashboard") {
    return pathname === "/ats" || pathname.startsWith("/ats/dashboard");
  }
  return pathname === href || pathname.startsWith(href + "/");
}

export default function AtsLayoutClient({
  user,
  isSuperAdmin,
  children,
}: Props) {
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

  const displayName = user.fullName || user.email || "ATS user";

  const initials = (user.fullName || user.email || "?")
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  // Only show Admin group if super admin
  const visibleNavGroups = navGroups.filter((group) => {
    if (group.label === "Admin" && !isSuperAdmin) return false;
    return true;
  });

  const visibleFlatNavItems: NavItem[] = visibleNavGroups.flatMap(
    (g) => g.items,
  );

  const BRAND_ACTIVE = "#2563EB";
  const BRAND_BORDER = "#1F2937";
  const SHELL_BG = "#020617";
  const SURFACE_BG = "#F9FAFB";

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50">
      <div className="flex h-screen">
        {/* Sidebar (desktop) */}
        <aside
          className="hidden w-68 flex-col border-r px-4 py-4 lg:flex"
          style={{
            backgroundColor: SHELL_BG,
            borderColor: BRAND_BORDER,
          }}
        >
          <div className="mb-6 flex items-center gap-2">
            <div
              className="flex h-8 w-8 items-center justify-center rounded-lg text-xs font-bold"
              style={{ backgroundColor: BRAND_ACTIVE }}
            >
              TA
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-slate-50">
                ThinkATS
              </span>
              <span className="text-[11px] text-slate-400">
                Multi-tenant ATS workspace
              </span>
            </div>
          </div>

          <nav className="flex-1 space-y-5 text-sm">
            {visibleNavGroups.map((group) => (
              <div key={group.label} className="space-y-1">
                <div className="px-2 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                  {group.label}
                </div>
                {group.items.map((item) => {
                  const active = isActive(pathname, item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="flex items-center rounded-lg px-3 py-2 text-sm font-medium transition"
                      style={
                        active
                          ? {
                              backgroundColor: BRAND_ACTIVE,
                              color: "#F9FAFB",
                            }
                          : {
                              color: "#E5E7EB",
                            }
                      }
                    >
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            ))}
          </nav>

          <button
            type="button"
            onClick={handleSignOut}
            className="mt-4 w-full rounded-lg border px-3 py-2 text-xs font-medium transition"
            style={{
              backgroundColor: SHELL_BG,
              borderColor: BRAND_BORDER,
              color: "#E5E7EB",
            }}
          >
            Sign out
          </button>
        </aside>

        {/* Main content area */}
        <div className="flex min-w-0 flex-1 flex-col">
          {/* Top bar */}
          <header
            className="flex items-center justify-between border-b px-4 py-3"
            style={{
              backgroundColor: SHELL_BG,
              borderColor: BRAND_BORDER,
            }}
          >
            <div className="flex items-center gap-2 lg:hidden">
              <div
                className="flex h-8 w-8 items-center justify-center rounded-lg text-xs font-bold"
                style={{ backgroundColor: BRAND_ACTIVE }}
              >
                TA
              </div>
              <span className="text-sm font-semibold text-slate-50">
                ThinkATS
              </span>
            </div>

            <div className="flex-1" />

            <div className="flex items-center gap-3">
              <div className="hidden flex-col items-end text-right text-xs sm:flex">
                <span className="max-w-[200px] truncate font-medium text-slate-100">
                  {displayName}
                </span>
                {user.email && (
                  <span className="max-w-[200px] truncate text-[11px] text-slate-400">
                    {user.email}
                  </span>
                )}
              </div>
              <div
                className="flex h-8 w-8 items-center justify-center rounded-full text-[11px] font-semibold"
                style={{ backgroundColor: "#111827" }}
              >
                {initials}
              </div>
            </div>
          </header>

          {/* Mobile nav strip */}
          <nav
            className="flex gap-2 overflow-x-auto border-b px-3 py-2 text-xs lg:hidden"
            style={{
              backgroundColor: SHELL_BG,
              borderColor: BRAND_BORDER,
            }}
          >
            {visibleFlatNavItems.map((item) => {
              const active = isActive(pathname, item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="whitespace-nowrap rounded-full px-3 py-1 transition"
                  style={
                    active
                      ? {
                          backgroundColor: BRAND_ACTIVE,
                          color: "#F9FAFB",
                        }
                      : {
                          backgroundColor: "rgba(31,41,55,0.9)",
                          color: "#E5E7EB",
                        }
                  }
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Light central canvas */}
          <main
            className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-6"
            style={{ backgroundColor: SURFACE_BG }}
          >
            <div className="mx-auto max-w-6xl">{children}</div>
          </main>
        </div>
      </div>
    </div>
  );
}
