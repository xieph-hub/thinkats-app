// app/ats/layout.tsx
import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getServerUser } from "@/lib/auth/getServerUser";
import { isOfficialUser } from "@/lib/officialEmail";
import { getHostContext } from "@/lib/host";
import AtsLayoutClient from "./AtsLayoutClient";
import OtpGateClient from "./OtpGateClient";

export const metadata = {
  title: "ThinkATS | ATS Workspace",
  description:
    "Manage tenants, jobs, candidates and clients from one shared ATS workspace.",
};

export const dynamic = "force-dynamic";

type Props = {
  children: ReactNode;
};

export default async function AtsLayout({ children }: Props) {
  const ctx = await getServerUser();
  const { isPrimaryHost, tenantSlugFromHost } = await getHostContext();

  // 1) Require app-level user context (cookie-based auth)
  if (!ctx || !ctx.user) {
    // ✅ match OtpGateClient’s param name
    redirect(`/login?returnTo=${encodeURIComponent("/ats")}`);
  }

  const { user, isSuperAdmin, tenantRoles } = ctx;

  // 2) Enforce "official email" policy (unless super admin)
  const email = user.email ?? "";
  if (!isOfficialUser({ email }) && !isSuperAdmin) {
    redirect("/access-denied");
  }

  // 3) Tenant access on tenant host (unless super admin)
  if (!isPrimaryHost && tenantSlugFromHost && !isSuperAdmin) {
    const hasTenantAccess = tenantRoles.some(
      (role) => role.tenantSlug === tenantSlugFromHost,
    );

    if (!hasTenantAccess) {
      redirect("/access-denied?reason=tenant_mismatch");
    }
  }

  // 4) Shape user object for the client layout
  const appUser = {
    ...user,
    tenants: tenantRoles,
  };

  return (
    <AtsLayoutClient user={appUser} isSuperAdmin={isSuperAdmin}>
      {/* ✅ OTP gating applies ONLY inside /ats */}
      <OtpGateClient>{children}</OtpGateClient>
    </AtsLayoutClient>
  );
}
