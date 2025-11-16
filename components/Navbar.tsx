// components/Navbar.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

type NavItem = {
  label: string;
  href: string;
};

type NavGroup = {
  label: string;
  items: NavItem[];
};

const candidateNav: NavGroup = {
  label: "For Candidates",
  items: [
    { label: "Jobs", href: "/jobs" },
    { label: "Join talent network", href: "/talent-network" },
  ],
};

const employerNav: NavGroup = {
  label: "For Employers",
  items: [
    { label: "Services", href: "/for-employers/services" },
    { label: "Case studies", href: "/for-employers/case-studies" },
    { label: "Request talent", href: "/request-talent" },
  ],
};

const topLevelNav: NavItem[] = [
  { label: "Insights", href: "/insights" },
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
];

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(href + "/");
}

export default function Navbar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-slate-100 bg-white/90 backdrop-blur">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        {/* Left: Logo */}
        <div className="flex items-center gap-2">
          <Link href="/" className="flex items-center gap-2">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-[#172965] text-xs font-bold text-white">
              R
            </span>
            <span className="text-sm font-semibold tracking-tight text-slate-900">
              Resourcin
            </span>
          </Link>
        </div>

        {/* Desktop nav */}
        <div className="hidden items-center gap-6 md:flex">
          {/* For Candidates */}
          <div className="relative group">
            <button className="text-xs font-medium text-slate-700 hover:text-[#172965]">
              {candidateNav.label}
            </button>
            <div className="invisible absolute left-0 top-full mt-2 w-44 rounded-2xl border border-slate-100 bg-white p-1.5 text-xs shadow-lg opacity-0 transition-all group-hover:visible group-hover:opacity-100">
              {candidateNav.items.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`block rounded-xl px-3 py-1.5 ${
                    isActive(pathname, item.href)
                      ? "bg-slate-100 text-[#172965] font-semibold"
                      : "text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>

          {/* For Employers */}
          <div className="relative group">
            <button className="text-xs font-medium text-slate-700 hover:text-[#172965]">
              {employerNav.label}
            </button>
            <div className="invisible absolute left-0 top-full mt-2 w-52 rounded-2xl border border-slate-100 bg-white p-1.5 text-xs shadow-lg opacity-0 transition-all group-hover:visible group-hover:opacity-100">
              {employerNav.items.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`block rounded-xl px-3 py-1.5 ${
                    isActive(pathname, item.href)
                      ? "bg-slate-100 text-[#172965] font-semibold"
                      : "text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Top-level links */}
          {topLevelNav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`text-xs font-medium ${
                isActive(pathname, item.href)
                  ? "text-[#172965]"
                  : "text-slate-700 hover:text-[#172965]"
              }`}
            >
              {item.label}
            </Link>
          ))}

          {/* Login */}
          <Link
            href="/login"
            className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-800 shadow-sm hover:border-[#172965] hover:text-[#172965]"
          >
            Login
          </Link>
        </div>

        {/* Mobile: menu button */}
        <button
          type="button"
          className="inline-flex items-center justify-center rounded-xl border border-slate-200 p-1.5 text-slate-700 md:hidden"
          onClick={() => setMobileOpen((open) => !open)}
          aria-label="Toggle navigation"
        >
          <span className="sr-only">Toggle navigation</span>
          <div className="space-y-0.5">
            <span className="block h-[2px] w-4 rounded-full bg-slate-700" />
            <span className="block h-[2px] w-4 rounded-full bg-slate-700" />
            <span className="block h-[2px] w-4 rounded-full bg-slate-700" />
          </div>
        </button>
      </nav>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="border-t border-slate-100 bg-white md:hidden">
          <div className="mx-auto max-w-6xl px-4 py-3 text-xs sm:px-6 lg:px-8">
            {/* For Candidates */}
            <div className="mb-3">
              <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                For Candidates
              </p>
              <div className="space-y-1">
                {candidateNav.items.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={`block rounded-xl px-3 py-1.5 ${
                      isActive(usePathname(), item.href)
                        ? "bg-slate-100 text-[#172965] font-semibold"
                        : "text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>

            {/* For Employers */}
            <div className="mb-3">
              <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                For Employers
              </p>
              <div className="space-y-1">
                {employerNav.items.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={`block rounded-xl px-3 py-1.5 ${
                      isActive(usePathname(), item.href)
                        ? "bg-slate-100 text-[#172965] font-semibold"
                        : "text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>

            {/* Top-level */}
            <div className="mb-3 space-y-1">
              {topLevelNav.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={`block rounded-xl px-3 py-1.5 ${
                    isActive(usePathname(), item.href)
                      ? "bg-slate-100 text-[#172965] font-semibold"
                      : "text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </div>

            {/* Login */}
            <Link
              href="/login"
              onClick={() => setMobileOpen(false)}
              className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-800 shadow-sm hover:border-[#172965] hover:text-[#172965]"
            >
              Login
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
