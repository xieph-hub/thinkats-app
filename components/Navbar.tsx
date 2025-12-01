// components/Navbar.tsx
"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
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

function isActivePath(pathname: string | null, href: string) {
  if (!pathname) return false;
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(href + "/");
}

export default function Navbar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const homeLink = mainLinks.find((l) => l.href === "/")!;
  const secondaryLinks = mainLinks.filter(
    (l) => l.href !== "/" && l.href !== "/product"
  );

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur">
      <nav className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
        {/* Logo -> home */}
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
          />
        </Link>

        {/* Desktop nav */}
        <div className="hidden flex-1 items-center justify-between md:flex">
          {/* Left: main links */}
          <div className="flex items-center gap-6">
            {/* Home first */}
            <Link
              href={homeLink.href}
              className={`text-sm transition-colors ${
                isActivePath(pathname, homeLink.href)
                  ? "font-semibold text-[#1E40AF]"
                  : "text-slate-600 hover:text-[#1E40AF]"
              }`}
            >
              {homeLink.label}
            </Link>

            {/* Product (dropdown) */}
            <div className="relative group">
              <button
                type="button"
                className={`flex items-center gap-1 text-sm transition-colors ${
                  isActivePath(pathname, "/product")
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
                        isActivePath(pathname, link.href)
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

            {/* Remaining main links */}
            {secondaryLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`text-sm transition-colors ${
                  isActivePath(pathname, link.href)
                    ? "font-semibold text-[#1E40AF]"
                    : "text-slate-600 hover:text-[#1E40AF]"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Right: auth actions */}
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-sm font-medium text-slate-700 hover:text-[#1E40AF]"
            >
              Log in
            </Link>
            <Link
              href="/signup"
              className="rounded-full bg-[#1E40AF] px-4 py-1.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#1D3A9A]"
            >
              Start free trial
            </Link>
          </div>
        </div>

        {/* Mobile: login + hamburger */}
        <div className="flex items-center gap-2 md:hidden">
          <Link
            href="/login"
            className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700"
          >
            Log in
          </Link>
          <Link
            href="/signup"
            className="rounded-full bg-[#1E40AF] px-3 py-1.5 text-xs font-semibold text-white shadow-sm"
          >
            Free trial
          </Link>
          <button
            type="button"
            onClick={() => setMobileOpen((open) => !open)}
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
            <p className="px-2 pb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Product
            </p>
            <Link
              href="/product"
              onClick={() => setMobileOpen(false)}
              className={`rounded-md px-2 py-2 text-sm ${
                isActivePath(pathname, "/product")
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
                    isActivePath(pathname, link.href)
                      ? "bg-slate-100 font-semibold text-[#1E40AF]"
                      : "text-slate-700 hover:bg-slate-50 hover:text-[#1E40AF]"
                  }`}
                >
                  {link.label}
                </Link>
              ))}

            <p className="mt-3 px-2 pb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Company
            </p>
            {[homeLink, ...secondaryLinks].map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className={`rounded-md px-2 py-2 text-sm ${
                  isActivePath(pathname, link.href)
                    ? "bg-slate-100 font-semibold text-[#1E40AF]"
                    : "text-slate-700 hover:bg-slate-50 hover:text-[#1E40AF]"
                }`}
              >
                {link.label}
              </Link>
            ))}

            <div className="mt-4 flex flex-col gap-2 rounded-lg bg-slate-50 px-3 py-3">
              <Link
                href="/login"
                onClick={() => setMobileOpen(false)}
                className="rounded-full border border-slate-200 bg-white px-4 py-1.5 text-center text-sm font-semibold text-slate-700"
              >
                Log in
              </Link>
              <Link
                href="/signup"
                onClick={() => setMobileOpen(false)}
                className="rounded-full bg-[#1E40AF] px-4 py-1.5 text-center text-sm font-semibold text-white shadow-sm"
              >
                Start free trial
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
