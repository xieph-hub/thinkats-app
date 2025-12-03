// app/ats/layout.tsx
import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getServerUser } from "@/lib/supabaseServer";
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
  // 1) Primary auth – must be logged in
  const user = await getServerUser();

  if (!user) {
    redirect("/login?callbackUrl=/ats");
  }

  // 2) Email policy – only official / whitelisted users allowed in ATS
  if (!isOfficialUser(user)) {
    redirect("/access-denied");
  }

  // 3) OTP enforcement – every /ats/* page is behind OTP
  await ensureOtpVerified("/ats");

  // 4) Once we get here, user is:
  //    - Authenticated (Supabase)
  //    - Official (email policy)
  //    - OTP-verified (cookie)
  return (
    <div className="flex min-h-screen bg-slate-50">
      <AtsSidebar />
      <div className="flex min-h-screen flex-1 flex-col">
        <AtsTopbar user={user} />
        <main className="flex-1 px-4 py-4 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
