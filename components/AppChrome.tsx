"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import JobsNavbar from "@/components/jobs/JobsNavbar";
import JobsFooter from "@/components/jobs/JobsFooter";

type NavbarUser = {
  email?: string | null;
  user_metadata?: { full_name?: string } | Record<string, any>;
} | null;

type Props = {
  hostIsPrimary: boolean;
  tenantSlugFromHost?: string | null;
  currentUser: NavbarUser;
  otpVerified: boolean;
  children: ReactNode;
};

function isAtsSurface(pathname: string) {
  // ATS + its auth flows should NOT use marketing chrome.
  // Keep it conservative to avoid breaking flows.
  if (pathname.startsWith("/ats")) return true;
  if (pathname === "/login") return true;
  if (pathname === "/access-denied") return true;
  if (pathname.startsWith("/auth")) return true;
  return false;
}

function isJobsSurface(pathname: string) {
  // Avoid accidental matches like "/jobssomething"
  return pathname === "/jobs" || pathname.startsWith("/jobs/");
}

export default function AppChrome({
  hostIsPrimary,
  currentUser,
  otpVerified,
  children,
}: Props) {
  const pathname = usePathname() || "/";

  const onTenantHost = !hostIsPrimary;
  const onAts = isAtsSurface(pathname);
  const onJobs = isJobsSurface(pathname);

  // 1) Tenant subdomain: NO ThinkATS marketing chrome (tenant controls its own)
  if (onTenantHost) {
    return <main className="min-h-screen">{children}</main>;
  }

  // 2) ATS surface: no marketing chrome (ATS has its own layout)
  if (onAts) {
    return <main className="min-h-screen">{children}</main>;
  }

  // 3) Jobs on primary host: custom “Jobs by ThinkATS” chrome
  if (onJobs) {
    return (
      <>
        <JobsNavbar />
        <main className="min-h-screen">{children}</main>
        <JobsFooter />
      </>
    );
  }

  // 4) Everything else on primary host: marketing chrome
  return (
    <>
      <Navbar
        currentUser={currentUser}
        otpVerified={otpVerified}
        hostIsPrimary={hostIsPrimary}
      />
      <main className="min-h-screen">{children}</main>
      <Footer />
    </>
  );
}
