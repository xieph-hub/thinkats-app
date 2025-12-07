// app/ats/layout.tsx
import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getServerUser } from "@/lib/auth/getServerUser";
import { ensureOtpVerified } from "@/lib/requireOtp";
import AtsSidebar from "@/components/ats/AtsSidebar";
import AtsTopbar from "@/components/ats/AtsTopbar";
import { isOfficialUser } from "@/lib/officialEmail";
import { getHostContext } from "@/lib/host";

export const metadata = {
  title: "ThinkATS | ATS Workspace",
  description:
    "Manage tenants, jobs, candidates and clients from one shared ATS workspace.",
};

export default async function AtsLayout({ children }: { children: ReactNode }) {
  const { isPrimaryHost, tenantSlugFromHost } = getHostContext();

  // 1) Primary auth – must be logged in via Supabase
  const { supabaseUser, user, isSuperAdmin } = await getServerUser();

  // No Supabase session → send to login for ATS
  if (!supabaseUser || !supabaseUser.email) {
    redirect("/login?callbackUrl=/ats");
  }

  // 2) Email policy – only official / whitelisted users allowed in ATS
  // (still based on Supabase user, as you had before)
  if (!isOfficialUser(supabaseUser)) {
    redirect("/access-denied");
  }

  // 3) Require an app-level User record for ATS access at all
  //    (we need this to check tenant membership).
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
      (r) => r.tenant && r.tenant.slug === tenantSlugFromHost,
    );

    if (!hasMembership) {
      redirect("/access-denied?reason=tenant_mismatch");
    }
  }

  // 5) OTP enforcement – every /ats/* page is behind OTP
  await ensureOtpVerified("/ats");

  // 6) Once we get here, user is:
  //    - Authenticated (Supabase)
  //    - Official (email policy)
  //    - Has an app-level User row
  //    - On tenant host, belongs to that tenant (or is SUPER_ADMIN)
  //    - OTP-verified (cookie)
  return (
    <div className="flex min-h-screen bg-slate-50">
      <AtsSidebar />
      <div className="flex min-h-screen flex-1 flex-col">
        {/* pass Prisma user first, fall back to Supabase shape if needed */}
        <AtsTopbar user={user ?? supabaseUser} />
        <main className="flex-1 px-4 py-4 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
