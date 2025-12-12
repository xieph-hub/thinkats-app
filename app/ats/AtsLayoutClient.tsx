// app/ats/AtsLayoutClient.tsx
"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
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

type TenantRoleLite = {
  tenantId: string;
  tenantSlug: string | null;
  tenantName?: string | null;
  role?: string | null;
};

// 🔹 Global ATS-style IA with Admin → Plans
const ALL_NAV_GROUPS: NavGroup[] = [
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

export default function AtsLayoutClient({ user, isSuperAdmin, children }: Props) {
  const pathname = usePathname() || "/ats";
  const router = useRouter();
  const searchParams = useSearchParams();

  // Tenant roles attached in getServerUser → appUser.tenants
  const tenantRoles: TenantRoleLite[] = Array.isArray((user as any).tenants)
    ? ((user as any).tenants as TenantRoleLite[])
    : [];

  const tenantIdFromQuery = searchParams.get("tenantId") ?? "";
  const fallbackTenantId = tenantRoles.length > 0 ? tenantRoles[0].tenantId : "";
  const activeTenantId = tenantIdFromQuery || fallbackTenantId || "";

  const activeTenant: TenantRoleLite | null =
    tenantRoles.find((t) => t.tenantId === activeTenantId) ??
    (tenantRoles.length > 0 ? tenantRoles[0] : null);

  // Only SUPER_ADMIN sees the Admin section
  const navGroups: NavGroup[] = isSuperAdmin
    ? ALL_NAV_GROUPS
    : ALL_NAV_GROUPS.filter((group) => group.label !== "Admin");

  const flatNavItems: NavItem[] = navGroups.flatMap((g) => g.items);

  async function handleSignOut() {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch (err) {
      console.error("Logout error:", err);
    } finally {
      router.push("/login");
    }
  }

  function handleTenantChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const nextTenantId = e.target.value;

    const sp = new URLSearchParams(searchParams.toString());
    if (nextTenantId) sp.set("tenantId", nextTenantId);
    else sp.delete("tenantId");

    const query = sp.toString();
    const target = query ? `${pathname}?${query}` : pathname;

    router.push(target);
  }

  const displayName = user.fullName || user.email || "ATS user";

  const initials = (user.fullName || user.email || "?")
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const BRAND_ACTIVE = "#2563EB";
  const BRAND_BORDER = "#1F2937";
  const SHELL_BG = "#020617";
  const SURFACE_BG = "#F9FAFB";

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50">
      <div className="flex h-screen">
        {/* Sidebar (desktop) */}
        <aside
          className="hidden w-72 flex-col border-r px-4 py-4 lg:flex"
          style={{ backgroundColor: SHELL_BG, borderColor: BRAND_BORDER }}
        >
          {/* Brand */}
          <Link href="/ats" className="mb-6 flex items-center gap-3">
            <div className="flex items-center">
              <Image
                src="/thinkats-logo.svg"
                alt="ThinkATS"
                width={120}
                height={34}
                className="h-7 w-auto"
                priority
              />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-slate-50">
                ATS Workspace
              </span>
              <span className="text-[11px] text-slate-400">
                Multi-tenant recruiting OS
              </span>
            </div>
          </Link>

          {/* Nav */}
          <nav className="flex-1 space-y-5 text-sm">
            {navGroups.map((group) => (
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
                          ? { backgroundColor: BRAND_ACTIVE, color: "#F9FAFB" }
                          : { color: "#E5E7EB" }
                      }
                    >
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            ))}
          </nav>

          {/* Footer actions */}
          <button
            type="button"
            onClick={handleSignOut}
            className="mt-4 w-full rounded-lg border px-3 py-2 text-xs font-medium transition hover:bg-slate-900/40"
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
            style={{ backgroundColor: SHELL_BG, borderColor: BRAND_BORDER }}
          >
            {/* Brand on mobile */}
            <Link href="/ats" className="flex items-center gap-2 lg:hidden">
              <Image
                src="/thinkats-logo.svg"
                alt="ThinkATS"
                width={110}
                height={32}
                className="h-7 w-auto"
                priority
              />
              <span className="text-[11px] font-semibold text-slate-300">
                ATS
              </span>
            </Link>

            {/* Right side: workspace switcher + user */}
            <div className="ml-auto flex items-center gap-3">
              {/* Workspace switcher (desktop / md+) */}
              {tenantRoles.length > 0 && (
                <div className="hidden items-center gap-2 rounded-full bg-slate-900/80 px-3 py-1.5 text-xs text-slate-100 md:inline-flex">
                  <span className="text-[10px] uppercase tracking-wide text-slate-400">
                    Workspace
                  </span>
                  <select
                    value={activeTenantId}
                    onChange={handleTenantChange}
                    className="bg-transparent text-xs font-medium text-slate-100 outline-none"
                  >
                    {tenantRoles.map((t) => (
                      <option
                        key={t.tenantId}
                        value={t.tenantId}
                        className="bg-slate-900 text-slate-100"
                      >
                        {t.tenantName || t.tenantSlug || "Workspace"}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="flex items-center gap-3">
                <div className="hidden flex-col items-end text-right text-xs sm:flex">
                  <span className="max-w-[220px] truncate font-medium text-slate-100">
                    {displayName}
                  </span>
                  {user.email && (
                    <span className="max-w-[220px] truncate text-[11px] text-slate-400">
                      {user.email}
                    </span>
                  )}
                  {activeTenant && (
                    <span className="max-w-[220px] truncate text-[10px] text-slate-500">
                      {activeTenant.tenantName ||
                        activeTenant.tenantSlug ||
                        "Default workspace"}
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
            </div>
          </header>

          {/* Mobile nav strip */}
          <nav
            className="flex gap-2 overflow-x-auto border-b px-3 py-2 text-xs lg:hidden"
            style={{ backgroundColor: SHELL_BG, borderColor: BRAND_BORDER }}
          >
            {flatNavItems.map((item) => {
              const active = isActive(pathname, item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="whitespace-nowrap rounded-full px-3 py-1 transition"
                  style={
                    active
                      ? { backgroundColor: BRAND_ACTIVE, color: "#F9FAFB" }
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
