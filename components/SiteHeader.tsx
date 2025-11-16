"use client";

import Link from "next/link";
import { useState } from "react";
import Container from "./Container";

const navItems = [
  { href: "/", label: "Home" },
  { href: "/jobs", label: "Jobs" },
  { href: "/candidates", label: "For Candidates" },
  { href: "/employers", label: "For Employers" },
  { href: "/insights", label: "Insights" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

export default function SiteHeader() {
  const [mobileOpen, setMobileOpen] = useState(false);

  const toggleMobile = () => setMobileOpen((open) => !open);

  return (
    <header className="border-b border-slate-200 bg-white/80 backdrop-blur">
      <Container>
        <div className="flex h-16 items-center justify-between">
          {/* Brand */}
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#172965] text-xs font-bold text-white">
              R
            </div>
            <div className="flex flex-col leading-tight">
              <span className="text-sm font-semibold tracking-tight text-slate-900">
                Resourcin
              </span>
              <span className="text-[10px] uppercase tracking-[0.18em] text-slate-500">
                Talent & People
              </span>
            </div>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden items-center gap-6 text-sm font-medium text-slate-700 md:flex">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="hover:text-[#172965] transition"
              >
                {item.label}
              </Link>
            ))}
            <Link
              href="/login"
              className="rounded-full bg-[#172965] px-4 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-slate-900 transition"
            >
              Login
            </Link>
          </nav>

          {/* Mobile toggle */}
          <button
            type="button"
            onClick={toggleMobile}
            className="inline-flex items-center justify-center rounded-md border border-slate-300 bg-white p-2 text-slate-700 hover:bg-slate-50 hover:text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#172965] focus-visible:ring-offset-2 md:hidden"
          >
            <span className="sr-only">Toggle navigation</span>
            <span className="text-lg leading-none">
              {mobileOpen ? "✕" : "☰"}
            </span>
          </button>
        </div>
      </Container>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="border-t border-slate-200 bg-white md:hidden">
          <Container>
            <nav className="flex flex-col gap-1 py-3 text-sm font-medium text-slate-700">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="rounded-lg px-2 py-2 hover:bg-slate-50 hover:text-[#172965] transition"
                  onClick={() => setMobileOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
              <Link
                href="/login"
                className="mt-2 inline-flex items-center justify-center rounded-full bg-[#172965] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-slate-900 transition"
                onClick={() => setMobileOpen(false)}
              >
                Login
              </Link>
            </nav>
          </Container>
        </div>
      )}
    </header>
  );
}
