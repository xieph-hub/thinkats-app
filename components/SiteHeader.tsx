"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import Container from "./Container";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/candidates", label: "For Candidates" },
  { href: "/employers", label: "For Employers" },
  { href: "/insights", label: "Insights" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

export default function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="border-b border-neutral-900/70 bg-black/80 backdrop-blur">
      <Container>
        <div className="flex h-16 items-center justify-between gap-4">
          {/* Logo / brand */}
          <Link href="/" className="text-sm font-semibold tracking-wide">
            Resourcin
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-6 text-sm">
            {navLinks.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={
                  pathname === item.href
                    ? "text-emerald-300"
                    : "text-neutral-300 hover:text-white transition"
                }
              >
                {item.label}
              </Link>
            ))}

            <Link
              href="/login"
              className="rounded-full border border-emerald-400/80 px-3 py-1 text-[13px] font-medium text-emerald-200 hover:bg-emerald-500 hover:text-black transition"
            >
              Login
            </Link>
          </nav>

          {/* Mobile menu button */}
          <button
            type="button"
            className="md:hidden inline-flex items-center justify-center rounded-full border border-neutral-800 px-3 py-1 text-xs text-neutral-200"
            onClick={() => setOpen((prev) => !prev)}
          >
            Menu
          </button>
        </div>
      </Container>

      {/* Mobile dropdown */}
      {open && (
        <div className="md:hidden border-t border-neutral-900 bg-black">
          <Container>
            <nav className="flex flex-col gap-2 py-3 text-sm">
              {navLinks.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={
                    pathname === item.href
                      ? "text-emerald-300"
                      : "text-neutral-300"
                  }
                  onClick={() => setOpen(false)}
                >
                  {item.label}
                </Link>
              ))}

              <Link
                href="/login"
                className="mt-2 inline-flex items-center justify-center rounded-full border border-emerald-400/80 px-3 py-1 text-[13px] font-medium text-emerald-200"
                onClick={() => setOpen(false)}
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
