// app/ats/layout.tsx
import type { ReactNode } from "react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getServerUser } from "@/lib/auth/getServerUser";
import { isOfficialUser } from "@/lib/officialEmail";
import { getHostContext } from "@/lib/host";
import AtsLayoutClient from "./AtsLayoutClient";
import OtpGateClient from "./OtpGateClient";

export const metadata: Metadata = {
  title: "ThinkATS | ATS Workspace",
  description:
    "Manage tenants, jobs, candidates and clients from one shared ATS workspace.",
};

type Props = {
  children: ReactNode;
};

export default async function AtsLayout({ children }: Props) {
  const { isPrimaryHost, tenantSlugFromHost } = getHostContext();

  // 1) Supabase auth – must be logged in
  const { supabaseUser, user, isSuperAdmin } = await getServerUser();

  if (!supabaseUser || !supabaseUser.email) {
    redirect("/login?callbackUrl=/ats");
  }

  // 2) Email policy – only official / whitelisted users
  if (!isOfficialUser(supabaseUser)) {
    redirect("/access-denied");
  }

  // 3) Require Prisma User row
  if (!user) {
    redirect("/access-denied?reason=no_app_user");
  }

  // 4) Tenant membership checks on subdomains
  if (!isPrimaryHost && tenantSlugFromHost && !isSuperAdmin) {
    const roles = user.userTenantRoles ?? [];

    const hasMembership = roles.some(
      (r: any) => r.tenant && r.tenant.slug === tenantSlugFromHost,
    );

    if (!hasMembership) {
      redirect("/access-denied?reason=tenant_mismatch");
    }
  }

  // 5) OTP is enforced in OtpGateClient (client-side),
  //    using /api/ats/auth/me + the OTP cookie.
  return (
    <OtpGateClient>
      <AtsLayoutClient user={user as any}>{children}</AtsLayoutClient>
    </OtpGateClient>
  );
}
