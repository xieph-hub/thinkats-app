// app/ats/AtsLayoutClient.tsx
"use client";

import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
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
  { label: "Insights", items: [{ href: "/ats/analytics", label: "Analytics" }] },
  {
    label: "Admin",
    items: [
      { href: "/ats/tenants", label: "Workspaces" },
      { href: "/ats/admin/plans", label: "Plans" },
      { href: "/ats/settings", label: "Settings" },
    ],
  },
];

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

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

  const [userMenuOpen, setUserMenuOpen] = useState(false);

  useEffect(() => {
    setUserMenuOpen(false);
  }, [pathname]);

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

  const navGroups: NavGroup[] = isSuperAdmin
    ? ALL_NAV_GROUPS
    : ALL_NAV_GROUPS.filter((group) => group.label !== "Admin");

  const flatNavItems: NavItem[] = useMemo(
    () => navGroups.flatMap((g) => g.items),
    [navGroups],
  );

  async function handleSignOut() {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch (err) {
      console.error("Logout error:", err);
    } finally {
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

  const displayRole = isSuperAdmin ? "ThinkATS Super Admin" : "ThinkATS Admin";
  const displayName = user.fullName || user.email || "ATS user";

  const initials = (user.fullName || user.email || "?")
    .split(" ")
    .filter(Boolean)
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  // 🔧 If your logo needs a white variant for the dark shell,
  // drop it in /public as thinkats-logo-white.svg and swap this.
  const ATS_LOGO_SRC = "/thinkats-logo.svg";

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50">
      <div className="flex h-screen">
        {/* Sidebar (desktop) */}
        <aside className="hidden w-[280px] flex-col border-r border-slate-800 bg-gradient-to-b from-slate-950 via-slate-950 to-slate-900 px-4 py-4 lg:flex">
          {/* Brand */}
          <Link href="/ats/dashboard" className="mb-6 flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/5 ring-1 ring-white/10">
              <Image
                src={ATS_LOGO_SRC}
                alt="ThinkATS"
                width={28}
                height={28}
                className="h-6 w-6 object-contain"
                priority
              />
            </div>
            <div className="flex flex-col leading-tight">
              <span className="text-sm font-semibold text-slate-50">
                ATS Workspace
              </span>
              <span className="text-[11px] text-slate-400">
                Multi-tenant recruiting OS
              </span>
            </div>
          </Link>

          {/* Nav */}
          <nav className="flex-1 space-y-6">
            {navGroups.map((group) => (
              <div key={group.label} className="space-y-1">
                <div className="px-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                  {group.label}
                </div>

                {group.items.map((item) => {
                  const active = isActive(pathname, item.href);

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cx(
                        "group flex items-center justify-between rounded-xl px-3 py-2 text-sm font-medium transition",
                        active
                          ? "bg-blue-600 text-white shadow-sm shadow-blue-600/20"
                          : "text-slate-200 hover:bg-white/5 hover:text-white",
                      )}
                      aria-current={active ? "page" : undefined}
                    >
                      <span>{item.label}</span>
                      {active && (
                        <span className="h-1.5 w-1.5 rounded-full bg-white/90" />
                      )}
                    </Link>
                  );
                })}
              </div>
            ))}
          </nav>

          {/* Bottom actions */}
          <div className="mt-4 space-y-3">
            <div className="rounded-xl bg-white/5 p-3 ring-1 ring-white/10">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                Signed in
              </p>
              <p className="mt-1 truncate text-sm font-semibold text-slate-50">
                {displayRole}
              </p>
              {user.email && (
                <p className="mt-0.5 truncate text-[11px] text-slate-400">
                  {user.email}
                </p>
              )}
              {activeTenant && (
                <p className="mt-1 truncate text-[11px] text-slate-500">
                  {activeTenant.tenantName || activeTenant.tenantSlug || "Workspace"}
                </p>
              )}
            </div>

            <button
              type="button"
              onClick={handleSignOut}
              className="w-full rounded-xl border border-slate-800 bg-white/0 px-3 py-2 text-xs font-semibold text-slate-200 transition hover:bg-white/5"
            >
              Sign out
            </button>
          </div>
        </aside>

        {/* Main content */}
        <div className="flex min-w-0 flex-1 flex-col">
          {/* Top bar */}
          <header className="flex items-center gap-3 border-b border-slate-800 bg-slate-950/80 px-4 py-3 backdrop-blur">
            {/* Brand (mobile) */}
            <Link href="/ats/dashboard" className="flex items-center gap-2 lg:hidden">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/5 ring-1 ring-white/10">
                <Image
                  src={ATS_LOGO_SRC}
                  alt="ThinkATS"
                  width={28}
                  height={28}
                  className="h-6 w-6 object-contain"
                />
              </div>
              <span className="text-sm font-semibold text-slate-50">ATS</span>
            </Link>

            <div className="ml-auto flex items-center gap-3">
              {/* Workspace switcher */}
              {tenantRoles.length > 0 && (
                <div className="hidden items-center gap-2 rounded-full bg-white/5 px-3 py-1.5 text-xs text-slate-100 ring-1 ring-white/10 md:inline-flex">
                  <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
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
                        className="bg-slate-950 text-slate-100"
                      >
                        {t.tenantName || t.tenantSlug || "Workspace"}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* User */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setUserMenuOpen((v) => !v)}
                  className="flex items-center gap-3 rounded-full bg-white/5 px-2 py-1.5 ring-1 ring-white/10 hover:bg-white/10"
                >
                  <div className="hidden flex-col items-end text-right text-xs sm:flex">
                    <span className="max-w-[220px] truncate font-semibold text-slate-100">
                      {displayRole}
                    </span>
                    <span className="max-w-[220px] truncate text-[11px] text-slate-400">
                      {displayName}
                    </span>
                  </div>

                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-900 text-[11px] font-bold text-slate-100 ring-1 ring-white/10">
                    {initials}
                  </div>
                </button>

                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-64 overflow-hidden rounded-2xl border border-slate-800 bg-slate-950 shadow-xl">
                    <div className="px-4 py-3">
                      <p className="text-xs font-semibold text-slate-100">{displayRole}</p>
                      {user.email && (
                        <p className="mt-0.5 truncate text-[11px] text-slate-400">
                          {user.email}
                        </p>
                      )}
                      {activeTenant && (
                        <p className="mt-2 text-[11px] text-slate-500">
                          Workspace:{" "}
                          <span className="font-semibold text-slate-200">
                            {activeTenant.tenantName || activeTenant.tenantSlug || "Workspace"}
                          </span>
                        </p>
                      )}
                    </div>

                    <div className="border-t border-slate-800">
                      <button
                        type="button"
                        onClick={handleSignOut}
                        className="w-full px-4 py-3 text-left text-sm font-semibold text-rose-200 hover:bg-white/5"
                      >
                        Sign out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </header>

          {/* Mobile nav strip */}
          <nav className="flex gap-2 overflow-x-auto border-b border-slate-800 bg-slate-950/70 px-3 py-2 text-xs lg:hidden">
            {flatNavItems.map((item) => {
              const active = isActive(pathname, item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cx(
                    "whitespace-nowrap rounded-full px-3 py-1.5 font-semibold transition",
                    active
                      ? "bg-blue-600 text-white"
                      : "bg-white/5 text-slate-200 hover:bg-white/10",
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Light central canvas */}
          <main className="min-h-0 flex-1 overflow-y-auto bg-slate-50 px-4 py-4 sm:px-6 sm:py-6">
            <div className="mx-auto max-w-6xl">{children}</div>
          </main>
        </div>
      </div>
    </div>
  );
}
