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

// Left-nav items (desktop) + mobile nav
const navItems = [
  { href: "/ats/dashboard", label: "Dashboard" },
  { href: "/ats/jobs", label: "Jobs" },
  { href: "/ats/candidates", label: "Candidates" },
  { href: "/ats/tenants", label: "Workspaces" }, // existing /ats/tenants page
  { href: "/ats/clients", label: "Clients" },
  { href: "/ats/applications", label: "Applications" },
  { href: "/ats/analytics", label: "Analytics" },
  { href: "/ats/tenants/manage", label: "Tenants" }, // you can point this wherever later
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

  const initials = (user.fullName || user.email || "?")
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  // Brand colours
  const BRAND_BG = "#111827"; // Deep Indigo
  const BRAND_ACTIVE = "#2563EB"; // Electric Blue
  const BRAND_BORDER = "#1F2933";

  return (
    <div
      className="min-h-screen text-slate-50"
      style={{ backgroundColor: BRAND_BG }}
    >
      <div className="flex h-screen">
        {/* Sidebar (desktop) */}
        <aside
          className="hidden w-64 flex-col border-r px-4 py-4 lg:flex"
          style={{
            backgroundColor: "#020617", // very dark surface over Deep Indigo
            borderColor: BRAND_BORDER,
          }}
        >
          <div className="mb-6 flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg text-xs font-bold"
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

          <nav className="flex-1 space-y-1 text-sm">
            {navItems.map((item) => {
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
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <button
            type="button"
            onClick={handleSignOut}
            className="mt-4 w-full rounded-lg border px-3 py-2 text-xs font-medium transition"
            style={{
              backgroundColor: "#020617",
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
              backgroundColor: "#020617",
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
                <span className="max-w-[180px] truncate font-medium text-slate-100">
                  {displayName}
                </span>
                {user.email && (
                  <span className="max-w-[180px] truncate text-[11px] text-slate-400">
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

          {/* Mobile nav strip (so Jobs etc. are reachable on small screens) */}
          <nav
            className="flex gap-2 overflow-x-auto border-b px-3 py-2 text-xs lg:hidden"
            style={{
              backgroundColor: "#020617",
              borderColor: BRAND_BORDER,
            }}
          >
            {navItems.map((item) => {
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
                          backgroundColor: "rgba(31,41,55,0.8)", // subtle pill
                          color: "#E5E7EB",
                        }
                  }
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Page body */}
          <main className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-6">
            <div className="mx-auto max-w-6xl">{children}</div>
          </main>
        </div>
      </div>
    </div>
  );
}
