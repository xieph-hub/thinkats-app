import type { Metadata } from "next";
import "./globals.css";
import { Navbar } from "../components/Navbar";
import { Footer } from "../components/Footer";

export const metadata: Metadata = {
  title: "Resourcin – Human Capital Advisors",
  description:
    "Resourcin helps growth-focused companies build lean teams, recruiting engines, and clean people operations across Africa and beyond.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-slate-50 text-slate-900 antialiased">
        <Navbar />
        <div className="min-h-screen">{children}</div>
        <Footer />
      </body>
    </html>
  );
}
