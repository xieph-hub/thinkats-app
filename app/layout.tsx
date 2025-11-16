import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Footer from "@/components/Footer";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Resourcin | Talent • Teams • Growth",
  description:
    "Resourcin helps African and global teams hire, onboard, and manage talent across markets.",
};

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
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
