// lib/officialEmail.ts

// Keep this very loose to avoid type issues – we only care about "email".
type BasicUser = {
  email?: string | null;
};

function parseList(envValue: string | undefined | null): string[] {
  if (!envValue) return [];
  return envValue
    .split(",")
    .map((v) => v.trim().toLowerCase())
    .filter(Boolean);
}

// e.g. THINKATS_OFFICIAL_DOMAINS = "resourcin.com, thinkats.com"
// e.g. THINKATS_OVERRIDE_EMAILS = "resourcinhumancapitaladvisors@gmail.com"
const OFFICIAL_DOMAINS = parseList(process.env.THINKATS_OFFICIAL_DOMAINS);
const OVERRIDE_EMAILS = parseList(process.env.THINKATS_OVERRIDE_EMAILS);

export function isOfficialUser(user: BasicUser | null): boolean {
  const email = user?.email?.toLowerCase?.() ?? "";
  if (!email) return false;

  // 1) Explicit overrides (your Gmail etc.)
  if (OVERRIDE_EMAILS.includes(email)) return true;

  // 2) Domain-based rule
  const domain = email.split("@")[1] ?? "";
  if (!domain) return false;

  // If not configured yet, fail "open" so you don't lock yourself out by accident.
  if (OFFICIAL_DOMAINS.length === 0) {
    return true;
  }

  return OFFICIAL_DOMAINS.includes(domain);
}
