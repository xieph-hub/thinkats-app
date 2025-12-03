// app/layout.tsx
import type { Metadata } from "next";
import "./globals.css";
import { Inter } from "next/font/google";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import AuthRecoveryListener from "@/components/AuthRecoveryListener";
import { getServerUser } from "@/lib/supabaseServer";
import { getOtpVerifiedForEmail } from "@/lib/otpStatus";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "ThinkATS | Modern Applicant Tracking System",
  description:
    "ThinkATS is a modern, multi-tenant ATS for recruitment teams, agencies and HR departments.",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Supabase session (may exist even before OTP)
  const user = await getServerUser().catch(() => null);

  // OTP status: has this user completed a recent OTP?
  const otpVerified = user?.email
    ? await getOtpVerifiedForEmail(user.email)
    : false;

  return (
    <html lang="en" className={inter.className}>
      <body className="bg-slate-50 text-slate-900 antialiased">
        {/* Handles password reset / magic-link flows */}
        <AuthRecoveryListener />

        <Navbar currentUser={user} otpVerified={otpVerified} />
        <main className="min-h-screen">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
