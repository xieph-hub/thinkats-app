"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState } from "react";

const navLinks = [
  { href: "/product", label: "Product" },
  { href: "/solutions", label: "Solutions" },
  { href: "/pricing", label: "Pricing" },
  { href: "/resources", label: "Resources" },
  { href: "/company", label: "Company" },
];

export default function Navbar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname?.startsWith(href);
  };

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur">
      <nav className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-2"
          aria-label="ThinkATS home"
        >
          <Image
            src="/logo.svg"
            alt="ThinkATS"
            width={140}
            height={56}
            className="h-10 w-auto sm:h-12"
          />
          <span className="hidden text-sm font-semibold tracking-tight text-slate-800 sm:inline">
            ThinkATS
          </span>
        </Link>

        {/* Desktop navigation */}
        <div className="hidden flex-1 items-center justify-between md:flex">
          {/* Left: nav links */}
          <div className="flex items-center gap-6">
            <Link
              href="/"
              className={`text-sm transition-colors ${
                isActive("/")
                  ? "font-semibold text-[#1E40AF]"
                  : "text-slate-600 hover:text-[#1E40AF]"
              }`}
            >
              Home
            </Link>

            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`text-sm transition-colors ${
                  isActive(link.href)
                    ? "font-semibold text-[#1E40AF]"
                    : "text-slate-600 hover:text-[#1E40AF]"
                }`}
              >
                {link.label}
              </Link>
            ))}

            {/* Optional: quick link to public job board (Resourcin & other tenants) */}
            <Link
              href="/jobs"
              className={`text-sm rounded-full border border-slate-200 px-3 py-1.5 transition-colors ${
                isActive("/jobs")
                  ? "bg-slate-100 font-semibold text-[#1E40AF]"
                  : "text-slate-600 hover:bg-slate-50 hover:text-[#1E40AF]"
              }`}
            >
              Job board
            </Link>
          </div>

          {/* Right: auth actions */}
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="rounded-full border border-[#1E40AF] px-4 py-1.5 text-sm font-semibold text-[#1E40AF] transition-colors hover:bg-[#1E40AF] hover:text-white"
            >
              Login
            </Link>
            <Link
              href="/signup"
              className="rounded-full bg-[#1E40AF] px-4 py-1.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#1D4ED8]"
            >
              Start free trial
            </Link>
          </div>
        </div>

        {/* Mobile: CTAs + hamburger */}
        <div className="flex items-center gap-2 md:hidden">
          <Link
            href="/login"
            className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm"
          >
            Login
          </Link>
          <Link
            href="/signup"
            className="rounded-full bg-[#1E40AF] px-3 py-1.5 text-xs font-semibold text-white shadow-sm"
          >
            Free trial
          </Link>
          <button
            type="button"
            onClick={() => setMobileOpen((prev) => !prev)}
            aria-label="Toggle navigation"
            className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-700 shadow-sm"
          >
            <span className="sr-only">Toggle navigation</span>
            <span className="text-lg">{mobileOpen ? "✕" : "☰"}</span>
          </button>
        </div>
      </nav>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="border-t border-slate-200 bg-white md:hidden">
          <div className="mx-auto flex max-w-6xl flex-col gap-1 px-4 py-4 sm:px-6 lg:px-8">
            <p className="px-2 pb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Navigation
            </p>

            <Link
              href="/"
              onClick={() => setMobileOpen(false)}
              className={`rounded-md px-2 py-2 text-sm ${
                isActive("/")
                  ? "bg-slate-100 font-semibold text-[#1E40AF]"
                  : "text-slate-700 hover:bg-slate-50 hover:text-[#1E40AF]"
              }`}
            >
              Home
            </Link>

            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className={`rounded-md px-2 py-2 text-sm ${
                  isActive(link.href)
                    ? "bg-slate-100 font-semibold text-[#1E40AF]"
                    : "text-slate-700 hover:bg-slate-50 hover:text-[#1E40AF]"
                }`}
              >
                {link.label}
              </Link>
            ))}

            <Link
              href="/jobs"
              onClick={() => setMobileOpen(false)}
              className={`mt-2 rounded-md px-2 py-2 text-sm ${
                isActive("/jobs")
                  ? "bg-slate-100 font-semibold text-[#1E40AF]"
                  : "text-slate-700 hover:bg-slate-50 hover:text-[#1E40AF]"
              }`}
            >
              Job board
            </Link>

            {/* Mobile auth block */}
            <div className="mt-4 flex items-center justify-between gap-3 rounded-lg bg-slate-50 px-3 py-3">
              <Link
                href="/login"
                onClick={() => setMobileOpen(false)}
                className="rounded-full border border-slate-200 bg-white px-4 py-1.5 text-xs font-semibold text-slate-800 shadow-sm"
              >
                Login
              </Link>
              <Link
                href="/signup"
                onClick={() => setMobileOpen(false)}
                className="rounded-full bg-[#1E40AF] px-4 py-1.5 text-xs font-semibold text-white shadow-sm"
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
