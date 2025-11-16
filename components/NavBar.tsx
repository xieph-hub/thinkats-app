"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/jobs", label: "Jobs" },
  { href: "/clients", label: "For Employers" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

export function Navbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname?.startsWith(href);

  return (
    <header className="sticky top-0 z-40 border-b border-slate-100 bg-white/90 backdrop-blur">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        {/* Logo / Brand */}
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#172965] text-xs font-black tracking-tight text-white">
            R
          </div>
          <div className="flex flex-col leading-tight">
            <span className="text-sm font-semibold text-[#172965]">
              Resourcin
            </span>
            <span className="text-[11px] text-slate-500">
              Talent &amp; HR Advisory
            </span>
          </div>
        </Link>

        {/* Desktop nav */}
        <div className="hidden items-center gap-6 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`text-sm font-medium transition ${
                isActive(link.href)
                  ? "text-[#172965]"
                  : "text-slate-600 hover:text-[#172965]"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Mobile toggle */}
        <button
          type="button"
          onClick={() => setOpen((prev) => !prev)}
          className="inline-flex items-center justify-center rounded-md border border-slate-200 px-2.5 py-1.5 text-sm font-medium text-[#172965] shadow-sm hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#172965] focus-visible:ring-offset-2 md:hidden"
          aria-label="Toggle navigation"
          aria-expanded={open}
        >
          <span className="mr-1 text-xs">Menu</span>
          <span className="text-lg">{open ? "✕" : "☰"}</span>
        </button>
      </nav>

      {/* Mobile menu panel */}
      {open && (
        <div className="border-b border-slate-100 bg-white md:hidden">
          <div className="mx-auto max-w-6xl px-4 pb-3 sm:px-6 lg:px-8">
            <div className="flex flex-col space-y-1.5">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className={`block rounded-md px-2.5 py-2 text-sm font-medium ${
                    isActive(link.href)
                      ? "bg-[#172965]/5 text-[#172965]"
                      : "text-slate-700 hover:bg-slate-50 hover:text-[#172965]"
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
