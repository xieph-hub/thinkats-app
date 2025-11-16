import "./globals.css";
import type { Metadata, Viewport } from "next";
import { SITE_NAME, SITE_DESCRIPTION, SITE_URL, OG_IMAGE } from "@/lib/site";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_NAME,
    template: "%s | Resourcin",
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    url: SITE_URL,
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    images: [{ url: OG_IMAGE, width: 1200, height: 630, alt: SITE_NAME }],
  },
  twitter: {
    card: "summary_large_image",
    site: "@resourcinhq",
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    images: [OG_IMAGE],
  },
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
    ],
    shortcut: ["/favicon.ico"],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
  },
  manifest: "/site.webmanifest",
};

export const viewport: Viewport = {
  themeColor: "#172965",
  colorScheme: "light",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-dvh flex flex-col">
        <SiteHeader />
        <main className="flex-1">{children}</main>
        <footer className="mt-12 border-t border-slate-800 bg-brand-navy text-slate-100">
          <div className="mx-auto flex max-w-5xl flex-col gap-4 px-4 py-8 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-semibold">
                Resourcin Human Capital Advisors
              </p>
              <p className="mt-1 text-xs text-slate-300">
                African-focused talent, recruiting & employer-of-record solutions.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-xs md:text-sm">
              <a href="/jobs" className="hover:text-brand-yellow">
                Jobs
              </a>
              <a href="/employers" className="hover:text-brand-yellow">
                For Employers
              </a>
              <a href="/contact" className="hover:text-brand-yellow">
                Contact
              </a>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
