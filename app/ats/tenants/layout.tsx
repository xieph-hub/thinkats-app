// app/ats/tenants/layout.tsx
import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getServerUser } from "@/lib/auth/getServerUser";

export const dynamic = "force-dynamic";

type Props = {
  children: ReactNode;
};

export default async function TenantsAdminLayout({ children }: Props) {
  const ctx = await getServerUser();

  // /ats/layout.tsx has already checked basic auth + OTP, but we re-check user here.
  if (!ctx || !ctx.user || !ctx.isSuperAdmin) {
    redirect("/access-denied?reason=admin_only");
  }

  // No extra chrome here – we just gate the subtree.
  return children;
}
