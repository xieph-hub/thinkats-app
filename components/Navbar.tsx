"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const candidateLinks = [
  { href: "/jobs", label: "Jobs" },
  { href: "/talent-network", label: "Join Talent Network" },
];

const employerLinks = [
  { href: "/for-employers/services", label: "Services" },
  { href: "/for-employers/case-studies", label: "Case studies" },
  { href: "/for-employers/request-talent", label: "Request talent" },
];

const mainLinks = [
  { href: "/insights", label: "Insights" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

export default function Navbar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [loginRole, setLoginRole] = useState<"candidate" | "client">("candidate");

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname?.startsWith(href);
  };

  const loginHref = `/login?role=${loginRole}`;

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur">
      <nav className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
           <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white shadow-sm sm:h-10 sm:w-10">
            <Image
              src="/logo.svg"        // <- this uses public/logo.svg
              alt="Resourcin"
              width={28}
              height={28}
              className="h-auto w-auto"
              priority
            />
          <div className="flex flex-col leading-tight">
            <span className="text-sm font-semibold text-slate-900">
              Resourcin
            </span>
            <span className="text-[11px] text-slate-500">
              Human Capital Advisors
            </span>
          </div>
        </Link>

        {/* Desktop navigation */}
        <div className="hidden flex-1 items-center justify-between md:flex">
          {/* Left side: nav links */}
          <div className="flex items-center gap-6">
            {/* Home */}
            <Link
              href="/"
              className={`text-sm transition-colors ${
                isActive("/")
                  ? "font-semibold text-[#172965]"
                  : "text-slate-600 hover:text-[#172965]"
              }`}
            >
              Home
            </Link>

            {/* For Candidates (dropdown) */}
            <div className="relative group">
              <button
                type="button"
                className="flex items-center gap-1 text-sm text-slate-600 transition-colors group-hover:text-[#172965]"
              >
                <span>For Candidates</span>
                <span className="text-xs">▾</span>
              </button>
              <div className="invisible absolute left-0 top-full z-30 mt-2 w-56 rounded-xl border border-slate-200 bg-white opacity-0 shadow-lg ring-1 ring-black/5 transition-all group-hover:visible group-hover:opacity-100">
                <div className="py-2">
                  {candidateLinks.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={`block px-3 py-2 text-sm transition-colors ${
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
            </div>

            {/* For Employers (dropdown) */}
            <div className="relative group">
              <button
                type="button"
                className="flex items-center gap-1 text-sm text-slate-600 transition-colors group-hover:text-[#172965]"
              >
                <span>For Employers</span>
                <span className="text-xs">▾</span>
              </button>
              <div className="invisible absolute left-0 top-full z-30 mt-2 w-60 rounded-xl border border-slate-200 bg-white opacity-0 shadow-lg ring-1 ring-black/5 transition-all group-hover:visible group-hover:opacity-100">
                <div className="py-2">
                  {employerLinks.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={`block px-3 py-2 text-sm transition-colors ${
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
            </div>

            {/* Main links */}
            {mainLinks.map((link) => (
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
          </div>

          {/* Right side: Login with toggle */}
          <div className="flex items-center gap-3">
            <div className="flex items-center rounded-full border border-slate-200 bg-slate-50 p-0.5 text-[11px]">
              <button
                type="button"
                onClick={() => setLoginRole("candidate")}
                className={`rounded-full px-3 py-1 transition-colors ${
                  loginRole === "candidate"
                    ? "bg-white text-[#172965] shadow-sm"
                    : "text-slate-500 hover:text-[#172965]"
                }`}
              >
                Candidate
              </button>
              <button
                type="button"
                onClick={() => setLoginRole("client")}
                className={`rounded-full px-3 py-1 transition-colors ${
                  loginRole === "client"
                    ? "bg-white text-[#172965] shadow-sm"
                    : "text-slate-500 hover:text-[#172965]"
                }`}
              >
                Client
              </button>
            </div>

            <Link
              href={loginHref}
              className="rounded-full border border-[#172965] px-4 py-1.5 text-sm font-semibold text-[#172965] transition-colors hover:bg-[#172965] hover:text-white"
            >
              Login
            </Link>
          </div>
        </div>

        {/* Mobile: CTA + hamburger */}
        <div className="flex items-center gap-2 md:hidden">
          <button
            type="button"
            onClick={() =>
              setLoginRole((prev) => (prev === "candidate" ? "client" : "candidate"))
            }
            className="rounded-full border border-slate-200 bg-slate-50 px-2 py-1 text-[11px] text-slate-600"
          >
            {loginRole === "candidate" ? "Candidate view" : "Client view"}
          </button>
          <Link
            href={loginHref}
            className="rounded-full bg-[#172965] px-3 py-1.5 text-xs font-semibold text-white shadow-sm"
          >
            Login
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
            {/* For Candidates */}
            <p className="px-2 pb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
              For Candidates
            </p>
            {candidateLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className={`rounded-md px-2 py-2 text-sm ${
                  isActive(link.href)
                    ? "bg-slate-100 font-semibold text-[#172965]"
                    : "text-slate-700 hover:bg-slate-50 hover:text-[#172965]"
                }`}
              >
                {link.label}
              </Link>
            ))}

            {/* For Employers */}
            <p className="mt-3 px-2 pb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
              For Employers
            </p>
            {employerLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className={`rounded-md px-2 py-2 text-sm ${
                  isActive(link.href)
                    ? "bg-slate-100 font-semibold text-[#172965]"
                    : "text-slate-700 hover:bg-slate-50 hover:text-[#172965]"
                }`}
              >
                {link.label}
              </Link>
            ))}

            {/* Main links */}
            <p className="mt-3 px-2 pb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Company
            </p>
            {mainLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className={`rounded-md px-2 py-2 text-sm ${
                  isActive(link.href)
                    ? "bg-slate-100 font-semibold text-[#172965]"
                    : "text-slate-700 hover:bg-slate-50 hover:text-[#172965]"
                }`}
              >
                {link.label}
              </Link>
            ))}

            {/* Login section */}
            <div className="mt-4 flex items-center justify-between gap-3 rounded-lg bg-slate-50 px-3 py-3">
              <div className="flex items-center rounded-full border border-slate-200 bg-white p-0.5 text-[11px]">
                <button
                  type="button"
                  onClick={() => setLoginRole("candidate")}
                  className={`rounded-full px-3 py-1 transition-colors ${
                    loginRole === "candidate"
                      ? "bg-[#172965] text-white shadow-sm"
                      : "text-slate-500 hover:text-[#172965]"
                  }`}
                >
                  Candidate
                </button>
                <button
                  type="button"
                  onClick={() => setLoginRole("client")}
                  className={`rounded-full px-3 py-1 transition-colors ${
                    loginRole === "client"
                      ? "bg-[#172965] text-white shadow-sm"
                      : "text-slate-500 hover:text-[#172965]"
                  }`}
                >
                  Client
                </button>
              </div>
              <Link
                href={loginHref}
                onClick={() => setMobileOpen(false)}
                className="rounded-full bg-[#172965] px-4 py-1.5 text-xs font-semibold text-white shadow-sm"
              >
                Login
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
