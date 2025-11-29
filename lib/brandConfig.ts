// lib/brandConfig.ts
export type BrandId = "thinkats" | "resourcin";

export interface BrandConfig {
  id: BrandId;
  productName: string;
  tagline: string;
  primaryColor: string;
  accentColor: string;
  logoText: string;
}

const THINKATS_HOSTS = ["thinkats.com", "www.thinkats.com"];
const RESOURCIN_HOSTS = ["resourcin.com", "www.resourcin.com"];

export function getBrandByHost(host?: string | null): BrandConfig {
  const cleanHost = (host || "").toLowerCase();

  if (THINKATS_HOSTS.includes(cleanHost)) {
    return {
      id: "thinkats",
      productName: "ThinkATS",
      tagline: "Multi-tenant ATS for modern hiring teams.",
      primaryColor: "#172965",
      accentColor: "#FFC000",
      logoText: "THINKATS",
    };
  }

  // Default: Resourcin
  return {
    id: "resourcin",
    productName: "Resourcin",
    tagline:
      "Connecting Talent with Opportunity, Redefining Workplaces and Careers",
    primaryColor: "#172965",
    accentColor: "#FFC000",
    logoText: "RESOURCIN",
  };
}
