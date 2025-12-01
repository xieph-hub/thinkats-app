// app/ats/layout.tsx
import { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getServerUser } from "@/lib/supabaseServer";

export default async function AtsLayout({
  children,
}: {
  children: ReactNode;
}) {
  const user = await getServerUser();

  if (!user) {
    // Preserve where the user was trying to go
    redirect("/login?callbackUrl=/ats");
  }

  return <>{children}</>;
}
