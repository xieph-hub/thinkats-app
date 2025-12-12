"use client";

import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { AppUserWithTenants } from "@/lib/auth/getServerUser";

type Props = {
  user: AppUserWithTenants;
  isSuperAdmin: boolean;
  children: ReactNode;
};

type NavItem = { href: string; label: string };
type NavGroup = { label: string; items: NavItem[] };

type TenantRoleLite = {
  tenantId: string;
  tenantSlug: string | null;
  tenantName?: string | null;
  role?: string | null;
};

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

function initialsFrom(nameOrEmail?: string | null) {
  const s = (nameOrEmail || "TA").trim();
  const parts = s.split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

export default function AtsLayoutClient({ user, isSuperAdmin, children }: Props) {
  const pathname = usePathname() || "/ats";
  const router = useRouter();
  const searchParams = useSearchParams();

  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement | null>(null);

  const tenantRoles: TenantRoleLite[] = Array.isArray((user as any).tenants)
    ? ((user as any).tenants as TenantRoleLite[])
    : [];

  const tenantIdFromQuery = searchParams.get("tenantId") ?? "";
  const fallbackTenantId = tenantRoles.length > 0 ? tenantRoles[0].tenantId : "";
  const activeTenantId = tenantIdFromQuery || fallbackTenantId || "";

  const activeTenant: TenantRoleLite | null =
    tenantRoles.find((t) => t.tenantId === activeTenantId) ??
    (tenantRoles.length > 0 ? tenantRoles[0] : null);

  const navGroups: NavGroup[] = useMemo(() => {
    return isSuperAdmin
      ? ALL_NAV_GROUPS
      : ALL_NAV_GROUPS.filter((g) => g.label !== "Admin");
  }, [isSuperAdmin]);

  const flatNavItems: NavItem[] = useMemo(
    () => navGroups.flatMap((g) => g.items),
    [navGroups],
  );

  const displayName = user.fullName || user.email || "ATS user";
  const initials = initialsFrom(user.fullName || user.email);

  // Palette
  const BRAND_ACTIVE = "#2563EB";
  const BRAND_BORDER = "#1F2937";
  const SHELL_BG = "#020617";
  const SURFACE_BG = "#F9FAFB";

  useEffect(() => {
    function onDocMouseDown(e: MouseEvent) {
      if (!userMenuRef.current) return;
      if (!userMenuRef.current.contains(e.target as Node)) setUserMenuOpen(false);
    }
    function onEsc(e: KeyboardEvent) {
      if (e.key === "Escape") setUserMenuOpen(false);
    }
    document.addEventListener("mousedown", onDocMouseDown);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onDocMouseDown);
      document.removeEventListener("keydown", onEsc);
    };
  }, []);

  async function handleSignOut() {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      setUserMenuOpen(false);
      router.push("/login");
      router.refresh();
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

  return (
    // ✅ FIX: lock the ATS shell to the viewport so you never see the body’s white background
    <div className="fixed inset-0" style={{ backgroundColor: SHELL_BG }}>
      <div className="flex h-full">
        {/* Sidebar (desktop) */}
        <aside
          className="hidden w-[300px] flex-col border-r px-4 py-4 lg:flex"
          style={{ backgroundColor: SHELL_BG, borderColor: BRAND_BORDER }}
        >
          {/* ✅ Bigger real logo */}
          <Link href="/ats" className="mb-6 flex items-center">
            <Image
              src="/thinkats-logo.svg"
              alt="ThinkATS"
              width={230}
              height={64}
              className="h-12 w-auto"
              priority
            />
          </Link>

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

          {/* ✅ Minimal bottom note (no email / no sign-out duplication) */}
          <div
            className="mt-auto border-t pt-4 text-[11px] text-slate-500"
            style={{ borderColor: BRAND_BORDER }}
          >
            <p className="truncate">
              Workspace:{" "}
              <span className="font-medium text-slate-300">
                {activeTenant?.tenantName || activeTenant?.tenantSlug || "Default"}
              </span>
            </p>
            <p className="mt-1 truncate">Powered by ThinkATS</p>
          </div>
        </aside>

        {/* Main content area */}
        <div className="flex min-w-0 flex-1 flex-col">
          {/* Top bar */}
          <header
            className="flex items-center justify-between border-b px-4 py-3"
            style={{ backgroundColor: SHELL_BG, borderColor: BRAND_BORDER }}
          >
            {/* Brand on mobile */}
            <div className="flex items-center gap-3 lg:hidden">
              <Link href="/ats" className="flex items-center gap-2">
                <Image
                  src="/thinkats-logo.svg"
                  alt="ThinkATS"
                  width={210}
                  height={60}
                  className="h-11 w-auto"
                  priority
                />
              </Link>
            </div>

            <div className="ml-auto flex items-center gap-3">
              {/* Workspace switcher */}
              {tenantRoles.length > 0 && (
                <div className="hidden items-center gap-2 rounded-full bg-slate-900/80 px-3 py-1.5 text-xs text-slate-100 md:inline-flex">
                  <span className="text-[10px] uppercase tracking-wide text-slate-400">
                    Workspace
                  </span>
                  <select
                    value={activeTenantId}
                    onChange={handleTenantChange}
                    className="bg-transparent text-xs font-semibold text-slate-100 outline-none"
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

              {/* User menu (top right) */}
              <div className="relative" ref={userMenuRef}>
                <button
                  type="button"
                  onClick={() => setUserMenuOpen((v) => !v)}
                  className="flex items-center gap-3 rounded-full bg-slate-900/80 px-3 py-1.5 text-xs text-slate-100 ring-1 ring-slate-700/60 hover:bg-slate-900"
                  aria-haspopup="menu"
                  aria-expanded={userMenuOpen}
                >
                  <div className="hidden flex-col items-end text-right sm:flex">
                    <span className="max-w-[240px] truncate text-[11px] font-semibold text-slate-100">
                      {isSuperAdmin ? "ThinkATS Super Admin" : "ThinkATS User"}
                    </span>
                    {user.email && (
                      <span className="max-w-[240px] truncate text-[11px] text-slate-300">
                        {user.email}
                      </span>
                    )}
                  </div>

                  <div
                    className="flex h-8 w-8 items-center justify-center rounded-full text-[11px] font-semibold"
                    style={{ backgroundColor: "#111827" }}
                    aria-label="User menu"
                  >
                    {initials}
                  </div>
                </button>

                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-64 overflow-hidden rounded-2xl border border-slate-800 bg-slate-950 shadow-xl">
                    <div className="px-4 py-3">
                      <div className="text-xs font-semibold text-slate-100">
                        {displayName}
                      </div>
                      {user.email && (
                        <div className="mt-0.5 text-[11px] text-slate-400">
                          {user.email}
                        </div>
                      )}
                      {activeTenant && (
                        <div className="mt-2 text-[11px] text-slate-400">
                          Workspace:{" "}
                          <span className="font-medium text-slate-200">
                            {activeTenant.tenantName || activeTenant.tenantSlug || "Default"}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="border-t border-slate-800" />

                    <button
                      type="button"
                      onClick={handleSignOut}
                      className="w-full px-4 py-3 text-left text-sm font-semibold text-slate-100 hover:bg-slate-900"
                    >
                      Sign out
                    </button>
                  </div>
                )}
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
                      : { backgroundColor: "rgba(31,41,55,0.9)", color: "#E5E7EB" }
                  }
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Light central canvas (scrolls) */}
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
