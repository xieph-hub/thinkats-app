import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Link from "next/link";
import "./globals.css";
import Footer from "@/components/Footer";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Resourcin | Talent • Teams • Growth",
  description:
    "Resourcin helps African and global teams hire, onboard, and manage talent across markets.",
};

function Header() {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-6 px-4 sm:px-6 lg:px-8">
        {/* Logo / brand */}
        <Link href="/" className="flex items-baseline gap-2">
          <span className="text-lg font-semibold text-[#172965]">
            Resourcin
          </span>
          <span className="hidden text-xs text-slate-500 sm:inline">
            Talent • Teams • Growth
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-6 text-sm font-medium text-slate-700 md:flex">
          <Link href="/jobs" className="hover:text-[#172965]">
            Jobs
          </Link>
          <Link href="/talent-network" className="hover:text-[#172965]">
            Talent Network
          </Link>
          <Link href="/employers" className="hover:text-[#172965]">
            Employers
          </Link>
          <Link href="/about" className="hover:text-[#172965]">
            About
          </Link>
          <Link href="/contact" className="hover:text-[#172965]">
            Contact
          </Link>
        </nav>

        {/* Right actions */}
        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="hidden text-sm font-medium text-slate-700 hover:text-[#172965] md:inline"
          >
            Sign in
          </Link>
          <Link
            href="/request-talent"
            className="inline-flex items-center rounded-full border border-[#172965] bg-[#172965] px-4 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-[#0f1c46] transition-colors"
          >
            Request Talent
          </Link>
        </div>
      </div>
    </header>
  );
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body
        className={
          inter.className +
          " min-h-screen bg-slate-50 text-slate-900 flex flex-col"
        }
      >
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
