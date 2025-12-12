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
  if (pathname.startsWith("/ats")) return true;
  if (pathname === "/login") return true;
  if (pathname === "/access-denied") return true;
  if (pathname.startsWith("/auth")) return true;
  return false;
}

export default function AppChrome({
  hostIsPrimary,
  currentUser,
  otpVerified,
  children,
}: Props) {
  const pathname = usePathname() || "/";

  const onTenantHost = !hostIsPrimary;
  const onJobs = pathname.startsWith("/jobs");
  const onAts = isAtsSurface(pathname);

  // 1) Tenant subdomain: NO ThinkATS marketing chrome
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

  // 4) Everything else: marketing chrome
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
