// lib/requireTenantMembership.ts
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createServerClient } from "@supabase/ssr";
import { prisma } from "@/lib/prisma";

type MembershipResult = {
  user: {
    id: string;
    fullName: string | null;
    email: string | null;
    globalRole: string;
  };
  membership: {
    id: string;
    tenantId: string;
    role: string;
    isPrimary: boolean;
  };
};

export async function requireTenantMembership(
  tenantId: string,
  options?: { allowedRoles?: string[] },
): Promise<MembershipResult> {
  if (!tenantId) {
    redirect("/ats?error=tenant_missing");
  }

  const cookieStore = cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set() {},
        remove() {},
      },
    },
  );

  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user || !data.user.email) {
    redirect(`/login?returnTo=/ats/jobs?tenantId=${encodeURIComponent(tenantId)}`);
  }

  const email = data.user.email.toLowerCase();

  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      fullName: true,
      email: true,
      globalRole: true,
    },
  });

  if (!user) {
    redirect(`/login?returnTo=/ats/jobs?tenantId=${encodeURIComponent(tenantId)}`);
  }

  // SUPER_ADMIN = bypass membership checks
  if (user.globalRole === "SUPER_ADMIN") {
    return {
      user,
      membership: {
        id: "superadmin-bypass",
        tenantId,
        role: "owner",
        isPrimary: true,
      },
    };
  }

  const allowedRoles = options?.allowedRoles;

  const membership = await prisma.userTenantRole.findFirst({
    where: {
      userId: user.id,
      tenantId,
      ...(allowedRoles && allowedRoles.length > 0
        ? { role: { in: allowedRoles } }
        : {}),
    },
    select: {
      id: true,
      tenantId: true,
      role: true,
      isPrimary: true,
    },
  });

  if (!membership) {
    // Not a member (or wrong role) → bounce to ATS landing
    redirect(`/ats?error=no_access`);
  }

  return { user, membership };
}
