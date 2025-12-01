// app/ats/layout.tsx
import { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getServerUser } from "@/lib/supabaseServer";

export default async function AtsLayout({ children }: { children: ReactNode }) {
  const user = await getServerUser();

  if (!user) {
    // Not logged in → send to login with callback to ATS
    redirect("/login?callbackUrl=/ats");
  }

  return <>{children}</>;
}
