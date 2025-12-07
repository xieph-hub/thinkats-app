import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getServerUser } from "@/lib/auth/getServerUser";
import { ensureOtpVerified } from "@/lib/requireOtp";
import AtsSidebar from "@/components/ats/AtsSidebar";
import AtsTopbar from "@/components/ats/AtsTopbar";
import { isOfficialUser } from "@/lib/officialEmail";

export const metadata = {
  title: "ThinkATS | ATS Workspace",
  description:
    "Manage tenants, jobs, candidates and clients from one shared ATS workspace.",
};

export default async function AtsLayout({ children }: { children: ReactNode }) {
  // 1) Primary auth – must have a Supabase session
  const { supabaseUser, user: appUser } = await getServerUser();

  // No Supabase session at all → send to login
  if (!supabaseUser) {
    redirect("/login?callbackUrl=/ats");
  }

  // 2) Email policy – only official / whitelisted users allowed in ATS
  // isOfficialUser is assumed to inspect supabaseUser.email
  if (!isOfficialUser(supabaseUser)) {
    redirect("/access-denied");
  }

  // 3) OTP enforcement – every /ats/* page is behind OTP
  await ensureOtpVerified("/ats");

  // 4) Once we get here, user is:
  //    - Authenticated (Supabase)
  //    - Official (email policy)
  //    - OTP-verified (cookie)
  // We prefer the Prisma user object in the topbar if present,
  // otherwise fall back to the Supabase user.
  const topbarUser = appUser ?? supabaseUser;

  return (
    <div className="flex min-h-screen bg-slate-50">
      <AtsSidebar />
      <div className="flex min-h-screen flex-1 flex-col">
        <AtsTopbar user={topbarUser} />
        <main className="flex-1 px-4 py-4 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
