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

// THINKATS_OFFICIAL_DOMAINS = "resourcin.com, thinkats.com"
// THINKATS_OVERRIDE_EMAILS = "resourcinhumancapitaladvisors@gmail.com"
// THINKATS_SUPER_ADMINS = "resourcinhumancapitaladvisors@gmail.com,other@thinkats.com"
const OFFICIAL_DOMAINS = parseList(process.env.THINKATS_OFFICIAL_DOMAINS);
const OVERRIDE_EMAILS = parseList(process.env.THINKATS_OVERRIDE_EMAILS);
const SUPER_ADMIN_EMAILS = parseList(process.env.THINKATS_SUPER_ADMINS);

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

export function isSuperAdminUser(user: BasicUser | null): boolean {
  const email = user?.email?.toLowerCase?.() ?? "";
  if (!email) return false;

  // For now, super-admin is purely email-based.
  return SUPER_ADMIN_EMAILS.includes(email);
}
