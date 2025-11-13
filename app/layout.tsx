
import type { Metadata } from "next";
import "./globals.css";
import NavBar from "@/components/NavBar";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Resourcin Human Capital Advisors — Connecting Talent with Opportunity",
  description: "Tech-driven human capital solutions bridging talent and opportunity.",
  themeColor: "#0A66C2",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-brand-light text-slate-800 antialiased">
        <div className="bg-brand-dark text-white text-sm">
          <div className="max-w-7xl mx-auto flex items-center justify-between px-4 py-2">
            <p>Now booking projects & searches for Q1–Q2 2026</p>
            <a href="/contact" className="underline decoration-brand-yellow/70 decoration-2 underline-offset-2 hover:text-brand-yellow">Request a consultation</a>
          </div>
        </div>
        <NavBar />
        {children}
        <Footer />
      </body>
    </html>
  );
}
