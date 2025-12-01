// app/api/auth/register/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/password";

export async function POST(req: Request) {
  const formData = await req.formData();
  const emailRaw = formData.get("email");
  const fullNameRaw = formData.get("fullName");
  const passwordRaw = formData.get("password");

  const email =
    typeof emailRaw === "string" ? emailRaw.trim().toLowerCase() : "";
  const fullName =
    typeof fullNameRaw === "string" ? fullNameRaw.trim() : "";
  const password =
    typeof passwordRaw === "string" ? passwordRaw : "";

  // Only allow registration if there are NO users yet (bootstrap flow)
  const existingUserCount = await prisma.user.count();
  if (existingUserCount > 0) {
    const url = new URL("/login", req.url);
    url.searchParams.set(
      "error",
      "Registration+is+disabled+once+an+admin+exists",
    );
    return NextResponse.redirect(url, 303);
  }

  if (!email || !password) {
    const url = new URL("/register", req.url);
    url.searchParams.set("error", "Email+and+password+are+required");
    return NextResponse.redirect(url, 303);
  }

  const passwordHash = await hashPassword(password);

  // Create SUPER_ADMIN user
  const user = await prisma.user.create({
    data: {
      email,
      fullName: fullName || null,
      passwordHash,
      globalRole: "SUPER_ADMIN",
      isActive: true,
    },
  });

  // Attach them as SUPER_ADMIN to your default tenant (Resourcin)
  const resourcinSlug =
    process.env.RESOURCIN_TENANT_SLUG || "resourcin";

  const defaultTenant = await prisma.tenant.findFirst({
    where: { slug: resourcinSlug },
  });

  if (defaultTenant) {
    await prisma.userTenantRole.create({
      data: {
        userId: user.id,
        tenantId: defaultTenant.id,
        role: "SUPER_ADMIN",
        isPrimary: true,
      },
    });
  }

  const loginUrl = new URL("/login", req.url);
  loginUrl.searchParams.set("registered", "1");
  return NextResponse.redirect(loginUrl, 303);
}
