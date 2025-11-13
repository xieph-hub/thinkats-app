// lib/site.ts
export const SITE_NAME = "Resourcin Human Capital Advisors";
export const SITE_DESCRIPTION =
  "Connecting talent with opportunity — tech-driven recruitment, EOR, and HR advisory for modern teams and ambitious professionals.";
export const SITE_URL =
  (process.env.SITE_URL?.replace(/\/+$/, "") as string) || "https://resourcin.com";
export const SITE_TWITTER = "@resourcinhq";

// Default OG image: use dynamic generator
export const OG_IMAGE = "/api/og";

// Used in JSON-LD
export const LOGO_PATH = "/logo.svg";
