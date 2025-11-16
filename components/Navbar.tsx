"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/services", label: "Services" },
  { href: "/talent-network", label: "Talent Network" },
  { href: "/insights", label: "Insights" },
  { href: "/jobs", label: "Jobs" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

export default function Navbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const isActive = (href: string) => {
    if (href === "/") {
      return pathname === "/";
    }
    return pathname?.startsWith(href);
  };

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur">
      <nav className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#172965] text-sm font-semibold text-white">
            R
          </div>
          <div className="flex flex-col leading-tight">
            <span className="text-sm font-semibold text-slate-900">
              Resourcin
            </span>
            <span className="text-[11px] text-slate-500">
              Human Capital Advisors
            </span>
          </div>
        </Link>

        {/* Desktop nav */}
        <div className="hidden items-center gap-6 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`text-sm transition-colors ${
                isActive(link.href)
                  ? "font-semibold text-[#172965]"
                  : "text-slate-600 hover:text-[#172965]"
              }`}
            >
              {link.label}
            </Link>
          ))}

          <Link
            href="/request-talent"
            className="rounded-full bg-[#172965] px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-slate-900"
          >
            Request Talent
          </Link>
        </div>

        {/* Mobile: CTA + hamburger */}
        <div className="flex items-center gap-2 md:hidden">
          <Link
            href="/request-talent"
            className="rounded-full bg-[#172965] px-3 py-1.5 text-xs font-semibold text-white shadow-sm"
          >
            Request Talent
          </Link>
          <button
            type="button"
            onClick={() => setOpen((prev) => !prev)}
            aria-label="Toggle navigation"
            className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-700 shadow-sm"
          >
            <span className="sr-only">Toggle navigation</span>
            <span className="text-lg">
              {open ? "✕" : "☰"}
            </span>
          </button>
        </div>
      </nav>

      {/* Mobile menu */}
      {open && (
        <div className="border-t border-slate-200 bg-white md:hidden">
          <div className="mx-auto flex max-w-6xl flex-col gap-1 px-4 py-3 sm:px-6 lg:px-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className={`rounded-md px-2 py-2 text-sm ${
                  isActive(link.href)
                    ? "bg-slate-100 font-semibold text-[#172965]"
                    : "text-slate-700 hover:bg-slate-50 hover:text-[#172965]"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </header>
  );
}
