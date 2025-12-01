// app/layout.tsx
import type { Metadata } from "next";
import "./globals.css";
import { Inter } from "next/font/google";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import AuthRecoveryListener from "@/components/AuthRecoveryListener";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "ThinkATS | Modern Applicant Tracking System",
  description:
    "ThinkATS is a modern, multi-tenant ATS for recruitment teams, agencies and HR departments.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.className}>
      <body className="bg-slate-50 text-slate-900 antialiased">
        {/* Catches Supabase password-recovery hashes and routes to /auth/reset */}
        <AuthRecoveryListener />

        <Navbar />
        <main className="min-h-screen">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
