"use client";

import Link from "next/link";
import Image from "next/image";
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
  const [loginRole, setLoginRole] = useState<"candidate" | "client">(
    "candidate"
  );

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname?.startsWith(href);
  };

  const loginHref = `/login?role=${loginRole}`;

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur">
      <nav className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2" aria-label="Resourcin home">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white shadow-sm sm:h-10 sm:w-10">
            <Image
              src="/logo.svg" // public/logo.svg
              alt="Resourcin"
              width={28}
              height={28}
              className="h-auto w-auto"
              priority
            />
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

        {/* Desktop navigation */}
        <div className="hidden flex-1 items-center justify-between md:flex">
          {/* Left: nav links */}
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
              <div className="invisible absolute left-0 top-full z-30 mt-2 w-60 rounded-xl
