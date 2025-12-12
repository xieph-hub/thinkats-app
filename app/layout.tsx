// app/layout.tsx
import type { Metadata } from "next";
import "./globals.css";
import { Inter } from "next/font/google";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

import AuthRecoveryListener from "@/components/AuthRecoveryListener";
import AuthHashRedirector from "./AuthHashRedirector";

import { getServerUser } from "@/lib/supabaseServer";
import { getOtpVerifiedForEmail } from "@/lib/otpStatus";
import { getHostContext } from "@/lib/host";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL("https://www.thinkats.com"),
  title: {
    default: "ThinkATS | Modern Applicant Tracking System",
    template: "%s | ThinkATS",
  },
  description:
    "ThinkATS is a modern, multi-tenant ATS for recruitment teams, agencies and HR departments.",
  icons: {
    icon: [
      { url: "/favicon.ico?v=2", type: "image/x-icon" },
      { url: "/icon-192.png?v=2", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png?v=2", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png?v=2", sizes: "180x180", type: "image/png" }],
  },
  openGraph: {
    title: "ThinkATS | Modern Applicant Tracking System",
    description:
      "ThinkATS is a multi-tenant recruitment OS for jobs, pipelines, careers sites and candidate experience in one place.",
    url: "https://www.thinkats.com",
    siteName: "ThinkATS",
    images: [{ url: "/og-default.png?v=2", width: 1200, height: 630, alt: "ThinkATS – modern recruiting OS" }],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "ThinkATS | Modern Applicant Tracking System",
    description:
      "ThinkATS helps founders and HR teams run recruiting with multi-tenant ATS, careers sites and pipelines in one place.",
    images: ["/og-default.png?v=2"],
  },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Host context (to detect tenant subdomain vs primary host)
  const hostCtx = await getHostContext().catch(() => ({
    isPrimaryHost: true,
    tenantSlugFromHost: null as string | null,
  }));

  // ✅ Tenant host if it has a tenant slug and is not the primary host
  const isTenantHost = !!hostCtx.tenantSlugFromHost && !hostCtx.isPrimaryHost;

  // Supabase session (may exist even before OTP)
  const user = await getServerUser().catch(() => null);

  // OTP status: has this user completed a recent OTP?
  const otpVerified = user?.email
    ? await getOtpVerifiedForEmail(user.email)
    : false;

  return (
    <html lang="en" className={inter.className}>
      <body className="bg-slate-50 text-slate-900 antialiased">
        {/* Redirects /#...type=recovery → /auth/reset#... */}
        <AuthHashRedirector />

        {/* Handles other recovery / magic-link flows */}
        <AuthRecoveryListener />

        {/* ✅ Only show marketing chrome on non-tenant hosts */}
        {!isTenantHost && (
          <Navbar currentUser={user} otpVerified={otpVerified} />
        )}

        <main className="min-h-screen">{children}</main>

        {/* ✅ Only show marketing chrome on non-tenant hosts */}
        {!isTenantHost && <Footer />}
      </body>
    </html>
  );
}
