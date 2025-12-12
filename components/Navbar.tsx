// components/Navbar.tsx
"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

type NavLink = {
  href: string;
  label: string;
};

const mainLinks: NavLink[] = [
  { href: "/", label: "Home" },
  { href: "/product", label: "Product" },
  { href: "/career-sites", label: "Career sites" },
  { href: "/solutions", label: "Solutions" },
  { href: "/pricing", label: "Pricing" },
  { href: "/resources", label: "Resources" },
  { href: "/contact", label: "Contact" },
];

const productSubLinks: NavLink[] = [
  { href: "/product", label: "Overview" },
  { href: "/product/features/ats", label: "ATS & pipelines" },
  { href: "/career-sites", label: "Career sites engine" },
  { href: "/product/features/automation", label: "Automation & emails" },
  { href: "/product/features/analytics", label: "Analytics & reporting" },
  { href: "/product/features/integrations", label: "Integrations" },
];

type NavbarUser = {
  email?: string | null;
  user_metadata?: { full_name?: string } | Record<string, any>;
} | null;

type NavbarProps = {
  currentUser: NavbarUser;
  // true only if user has a recent, consumed OTP
  otpVerified: boolean;

  /**
   * NEW: Safety guard to prevent marketing chrome from rendering on tenant subdomains.
   * Default true for primary host rendering.
   */
  hostIsPrimary?: boolean;
};

function isActive(pathname: string | null, href: string) {
  if (!pathname) return false;
  if (href === "/") return pathname === "/";
  return pathname.startsWith(href);
}

function getInitials(user: NavbarUser) {
  const meta = (user?.user_metadata || {}) as any;
  const fullName: string | undefined = meta.full_name;
  const source = fullName || user?.email || "";
  if (!source) return "TA";
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

export default function Navbar({
  currentUser,
  otpVerified,
  hostIsPrimary = true,
}: NavbarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const hasSession = !!currentUser; // Supabase session exists
  const fullyLoggedIn = hasSession && otpVerified; // Supabase + OTP

  // ✅ Never render marketing chrome on tenant subdomains.
  if (!hostIsPrimary) return null;

  // ✅ Marketing chrome should not appear on ATS, auth pages, or Jobs surface.
  // (Jobs has its own "Jobs by ThinkATS" chrome.)
  if (
    pathname?.startsWith("/ats") ||
    pathname?.startsWith("/auth") ||
    pathname === "/login" ||
    pathname === "/access-denied" ||
    pathname?.startsWith("/jobs")
  ) {
    return null;
  }

  async function handleLogout() {
    setLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      setMenuOpen(false);
      router.push("/");
      router.refresh();
    } catch (e) {
      // optional: toast later
    } finally {
      setLoggingOut(false);
    }
  }

  const atsWorkspaceHref = fullyLoggedIn ? "/ats" : "/auth/otp?returnTo=/ats";

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur">
      <nav className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
        {/* Logo = home */}
        <Link
          href="/"
          className="flex items-center gap-2"
          aria-label="ThinkATS home"
        >
          <Image
            src="/thinkats-logo.svg"
            alt="ThinkATS"
            width={140}
            height={40}
            className="h-9 w-auto sm:h-10"
            priority
          />
        </Link>

        {/* Desktop nav */}
        <div className="hidden flex-1 items-center justify-between md:flex">
          {/* Left: links */}
          <div className="flex items-center gap-6">
            {/* Home first */}
            <Link
              href="/"
              className={`text-sm transition-colors ${
                isActive(pathname, "/")
                  ? "font-semibold text-[#1E40AF]"
                  : "text-slate-600 hover:text-[#1E40AF]"
              }`}
            >
              Home
            </Link>

            {/* Product (dropdown) */}
            <div className="relative group">
              <button
                type="button"
                className={`flex items-center gap-1 text-sm transition-colors ${
                  isActive(pathname, "/product")
                    ? "font-semibold text-[#1E40AF]"
                    : "text-slate-600 hover:text-[#1E40AF]"
                }`}
              >
                <span>Product</span>
                <span className="text-[11px]">▾</span>
              </button>

              <div className="invisible absolute left-0 top-full z-30 mt-2 w-60 rounded-xl border border-slate-200 bg-white opacity-0 shadow-lg ring-1 ring-black/5 transition-all group-hover:visible group-hover:opacity-100">
                <div className="py-2">
                  {productSubLinks.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={`block px-3 py-2 text-sm transition-colors ${
                        isActive(pathname, link.href)
                          ? "bg-slate-100 font-semibold text-[#1E40AF]"
                          : "text-slate-700 hover:bg-slate-50 hover:text-[#1E40AF]"
                      }`}
                    >
                      {link.label}
                    </Link>
                  ))}
                </div>
              </div>
            </div>

            {/* Other main links excluding Home + Product */}
            {mainLinks
              .filter((l) => l.href !== "/" && l.href !== "/product")
              .map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`text-sm transition-colors ${
                    isActive(pathname, link.href)
                      ? "font-semibold text-[#1E40AF]"
                      : "text-slate-600 hover:text-[#1E40AF]"
                  }`}
                >
                  {link.label}
                </Link>
              ))}
          </div>

          {/* Right: auth / workspace */}
          <div className="flex items-center gap-3">
            {fullyLoggedIn ? (
              <>
                <Link
                  href="/ats"
                  className="text-sm font-medium text-slate-700 hover:text-[#1E40AF]"
                >
                  ATS workspace
                </Link>

                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setMenuOpen((prev) => !prev)}
                    className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-2 py-1 text-xs font-medium text-slate-700 shadow-sm hover:bg-slate-50"
                  >
                    <span className="hidden text-xs text-slate-500 sm:inline">
                      Logged in
                    </span>
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-900 text-xs font-semibold text-white">
                      {getInitials(currentUser)}
                    </div>
                  </button>

                  {menuOpen && (
                    <div className="absolute right-0 mt-2 w-48 rounded-md border border-slate-200 bg-white py-1 text-sm shadow-lg">
                      <div className="px-3 pb-2 pt-1 text-xs text-slate-500">
                        {currentUser?.email}
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setMenuOpen(false);
                          router.push("/ats");
                        }}
                        className="block w-full px-3 py-1.5 text-left text-slate-700 hover:bg-slate-50"
                      >
                        Open ATS workspace
                      </button>
                      <button
                        type="button"
                        onClick={handleLogout}
                        disabled={loggingOut}
                        className="block w-full px-3 py-1.5 text-left text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-70"
                      >
                        {loggingOut ? "Logging out…" : "Log out"}
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : hasSession ? (
              <>
                <Link
                  href={atsWorkspaceHref}
                  className="text-sm font-medium text-slate-700 hover:text-[#1E40AF]"
                >
                  ATS workspace
                </Link>
                <Link
                  href="/auth/otp?returnTo=/ats"
                  className="rounded-full border border-slate-300 bg-white px-4 py-1.5 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
                >
                  Finish sign-in
                </Link>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="text-sm font-medium text-slate-700 hover:text-[#1E40AF]"
                >
                  Login
                </Link>
                <Link
                  href="/signup"
                  className="rounded-full bg-[#1E40AF] px-4 py-1.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#1D3A9A]"
                >
                  Start free trial
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Mobile: auth + hamburger */}
        <div className="flex items-center gap-2 md:hidden">
          {fullyLoggedIn ? (
            <Link
              href="/ats"
              className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700"
            >
              ATS workspace
            </Link>
          ) : hasSession ? (
            <Link
              href={atsWorkspaceHref}
              className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700"
            >
              Finish sign-in
            </Link>
          ) : (
            <>
              <Link
                href="/login"
                className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700"
              >
                Login
              </Link>
              <Link
                href="/signup"
                className="rounded-full bg-[#1E40AF] px-3 py-1.5 text-xs font-semibold text-white shadow-sm"
              >
                Free trial
              </Link>
            </>
          )}
          <button
            type="button"
            onClick={() => setMobileOpen((prev) => !prev)}
            aria-label="Toggle navigation"
            className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-700 shadow-sm"
          >
            <span className="text-lg">{mobileOpen ? "✕" : "☰"}</span>
          </button>
        </div>
      </nav>

      {/* Mobile panel */}
      {mobileOpen && (
        <div className="border-t border-slate-200 bg-white md:hidden">
          <div className="mx-auto flex max-w-6xl flex-col gap-1 px-4 py-4 sm:px-6 lg:px-8">
            {/* Product group */}
            <p className="px-2 pb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Product
            </p>
            <Link
              href="/product"
              onClick={() => setMobileOpen(false)}
              className={`rounded-md px-2 py-2 text-sm ${
                isActive(pathname, "/product")
                  ? "bg-slate-100 font-semibold text-[#1E40AF]"
                  : "text-slate-700 hover:bg-slate-50 hover:text-[#1E40AF]"
              }`}
            >
              Overview
            </Link>
            {productSubLinks
              .filter((l) => l.href !== "/product")
              .map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className={`rounded-md px-2 py-2 text-sm ${
                    isActive(pathname, link.href)
                      ? "bg-slate-100 font-semibold text-[#1E40AF]"
                      : "text-slate-700 hover:bg-slate-50 hover:text-[#1E40AF]"
                  }`}
                >
                  {link.label}
                </Link>
              ))}

            {/* Main links including Home + Contact */}
            <p className="mt-3 px-2 pb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Company
            </p>
            {mainLinks
              .filter((l) => l.href !== "/product")
              .map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className={`rounded-md px-2 py-2 text-sm ${
                    isActive(pathname, link.href)
                      ? "bg-slate-100 font-semibold text-[#1E40AF]"
                      : "text-slate-700 hover:bg-slate-50 hover:text-[#1E40AF]"
                  }`}
                >
                  {link.label}
                </Link>
              ))}

            {/* Auth / workspace block */}
            <div className="mt-4 flex flex-col gap-2 rounded-lg bg-slate-50 px-3 py-3">
              {fullyLoggedIn ? (
                <button
                  type="button"
                  onClick={() => {
                    setMobileOpen(false);
                    router.push("/ats");
                  }}
                  className="rounded-full bg-slate-900 px-4 py-1.5 text-center text-sm font-semibold text-white shadow-sm"
                >
                  Open ATS workspace
                </button>
              ) : hasSession ? (
                <Link
                  href={atsWorkspaceHref}
                  onClick={() => setMobileOpen(false)}
                  className="rounded-full border border-slate-200 bg-white px-4 py-1.5 text-center text-sm font-semibold text-slate-700"
                >
                  Finish sign-in
                </Link>
              ) : (
                <>
                  <Link
                    href="/login"
                    onClick={() => setMobileOpen(false)}
                    className="rounded-full border border-slate-200 bg-white px-4 py-1.5 text-center text-sm font-semibold text-slate-700"
                  >
                    Login
                  </Link>
                  <Link
                    href="/signup"
                    onClick={() => setMobileOpen(false)}
                    className="rounded-full bg-[#1E40AF] px-4 py-1.5 text-center text-sm font-semibold text-white shadow-sm"
                  >
                    Start free trial
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
