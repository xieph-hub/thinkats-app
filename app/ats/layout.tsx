// app/ats/layout.tsx
import type { ReactNode } from "react";
import type { Metadata } from "next";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { getServerUser } from "@/lib/auth/getServerUser";
import { isOfficialUser } from "@/lib/officialEmail";
import { getHostContext } from "@/lib/host";
import AtsLayoutClient from "./AtsLayoutClient";

export const metadata: Metadata = {
  title: "ThinkATS | ATS Workspace",
  description:
    "Manage tenants, jobs, candidates and clients from one shared ATS workspace.",
};

// MUST stay in sync with app/api/auth/otp/verify/route.ts
const OTP_COOKIE_NAME = "thinkats_otp_verified";

type Props = {
  children: ReactNode;
};

export default async function AtsLayout({ children }: Props) {
  // Current path – used for callbackUrl and to avoid OTP loops on /ats/verify
  const headerStore = headers();
  const currentPath = headerStore.get("x-invoke-path") || "/ats";

  const { isPrimaryHost, tenantSlugFromHost } = getHostContext();

  // 1) Primary auth – must be logged in via Supabase
  const { supabaseUser, user, isSuperAdmin } = await getServerUser();

  if (!supabaseUser || !supabaseUser.email) {
    // Not logged in at all – go to password login, then come back to /ats
    redirect("/login?callbackUrl=/ats");
  }

  // 2) Email policy – only official / whitelisted users allowed in ATS
  if (!isOfficialUser(supabaseUser)) {
    redirect("/access-denied");
  }

  // 3) Require an app-level User record for ATS access at all
  if (!user) {
    redirect("/access-denied?reason=no_app_user");
  }

  // 4) Host-aware tenant membership checks
  //
  //    - On primary host (thinkats.com / www.thinkats.com):
  //      any official user with an appUser row is allowed into /ats.
  //
  //    - On tenant subdomain (slug.thinkats.com):
  //      non-SUPER_ADMIN users must belong to that tenant via userTenantRoles.
  if (!isPrimaryHost && tenantSlugFromHost && !isSuperAdmin) {
    const roles = user.userTenantRoles ?? [];

    const hasMembership = roles.some(
      (r: any) => r.tenant && r.tenant.slug === tenantSlugFromHost,
    );

    if (!hasMembership) {
      redirect("/access-denied?reason=tenant_mismatch");
    }
  }

  // 5) OTP enforcement – every /ats/* page except /ats/verify
  const cookieStore = cookies();
  const otpCookie = cookieStore.get(OTP_COOKIE_NAME);
  const isOnVerifyPage = currentPath.startsWith("/ats/verify");

  if (!otpCookie?.value && !isOnVerifyPage) {
    const callbackUrl = currentPath || "/ats";
    // This page lives inside /ats, but we deliberately *don’t* require OTP
    // for it; once the cookie is set, the next visit to /ats/* will pass.
    redirect(`/ats/verify?callbackUrl=${encodeURIComponent(callbackUrl)}`);
  }

  // 6) Once we get here, user is:
  //    - Authenticated (Supabase)
  //    - Official (email policy)
  //    - Has an app-level User row
  //    - On tenant host, belongs to that tenant (or is SUPER_ADMIN)
  //    - OTP-verified (cookie present) OR currently on /ats/verify
  //
  // Hand off to the client layout which renders the sidebar, top ribbon, etc.
  return <AtsLayoutClient user={user as any}>{children}</AtsLayoutClient>;
}
