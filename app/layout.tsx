// app/layout.tsx
import type { Metadata } from "next";
import "./globals.css";
import { Inter } from "next/font/google";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import AuthRecoveryListener from "@/components/AuthRecoveryListener";
import { getServerUser } from "@/lib/supabaseServer";

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
  // Read the current user from Supabase via server-side cookies
  const currentUser = await getServerUser().catch(() => null);

  return (
    <html lang="en" className={inter.className}>
      <body className="bg-slate-50 text-slate-900 antialiased">
        {/* Handles Supabase recovery / magic links */}
        <AuthRecoveryListener />

        {/* Pass auth state into Navbar */}
        <Navbar currentUser={currentUser} />

        <main className="min-h-screen">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
