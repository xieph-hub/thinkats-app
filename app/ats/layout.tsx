// app/ats/layout.tsx
import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getServerUser } from "@/lib/auth/getServerUser";
import { isOfficialUser } from "@/lib/officialEmail";
import { getHostContext } from "@/lib/host";
import OtpGateClient from "./OtpGateClient";
import AtsLayoutClient from "./AtsLayoutClient";

export const metadata = {
  title: "ThinkATS | ATS Workspace",
  description:
    "Manage tenants, jobs, candidates and clients from one shared ATS workspace.",
};

// Force this layout to be always dynamic so it can
// reflect the current auth state on every request.
export const dynamic = "force-dynamic";

type Props = {
  children: ReactNode;
};

export default async function AtsLayout({ children }: Props) {
  const { supabaseUser, user, isSuperAdmin } = await getServerUser();
  const { isPrimaryHost, tenantSlugFromHost } = getHostContext();

  // 1) Require Supabase session
  if (!supabaseUser || !supabaseUser.email) {
    redirect("/login?callbackUrl=/ats");
  }

  // 2) Enforce "official email" policy
  if (!isOfficialUser({ email: supabaseUser.email })) {
    redirect("/access-denied");
  }

  // 3) Require app-level user row
  if (!user) {
    redirect("/access-denied?reason=no_app_user");
  }

  // 4) Tenant membership on tenant host (unless super admin)
  if (!isPrimaryHost && tenantSlugFromHost && !isSuperAdmin) {
    const hasTenantAccess = user.userTenantRoles.some(
      (role) => role.tenant?.slug === tenantSlugFromHost,
    );

    if (!hasTenantAccess) {
      redirect("/access-denied?reason=tenant_mismatch");
    }
  }

  // 5) Delegate OTP gating to client-side gate
  return (
    <OtpGateClient>
      {/* Pass full user object down; AtsLayoutClient can decide what to render */}
      <AtsLayoutClient user={user as any}>
        {children}
      </AtsLayoutClient>
    </OtpGateClient>
  );
}
