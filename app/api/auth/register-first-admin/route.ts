// app/api/auth/register-first-admin/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import {
  SESSION_COOKIE_NAME,
  createSessionToken,
  getAuthSecret, // ensures env exists
} from "@/lib/auth";

export async function POST(req: Request) {
  const formData = await req.formData();

  const workspaceName =
    ((formData.get("workspaceName") as string | null) ?? "").trim();
  const fullName =
    ((formData.get("fullName") as string | null) ?? "").trim();
  const emailRaw =
    ((formData.get("email") as string | null) ?? "").trim();
  const password = (formData.get("password") as string | null) ?? "";
  const confirmPassword =
    (formData.get("confirmPassword") as string | null) ?? "";

  const email = emailRaw.toLowerCase();

  if (
    !workspaceName ||
    !fullName ||
    !email ||
    !password ||
    password.length < 8 ||
    password !== confirmPassword
  ) {
    const url = new URL("/register", req.url);
    url.searchParams.set("error", "invalid");
    return NextResponse.redirect(url, 303);
  }

  // Check if a SUPER_ADMIN already exists (globalRole).
  const existingGlobalSuperAdmin = await prisma.user.findFirst({
    where: { globalRole: "SUPER_ADMIN" },
  });

  // Fallback: in case you already had SUPER_ADMIN roles wired via UserTenantRole.
  const existingTenantSuperAdmin = await prisma.userTenantRole.findFirst({
    where: { role: "SUPER_ADMIN" },
  });

  if (existingGlobalSuperAdmin || existingTenantSuperAdmin) {
    const url = new URL("/login", req.url);
    url.searchParams.set("error", "admin_exists");
    return NextResponse.redirect(url, 303);
  }

  // If a user with this email already exists, don't create another.
  const existingUserWithEmail = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUserWithEmail) {
    const url = new URL("/login", req.url);
    url.searchParams.set("error", "admin_exists");
    return NextResponse.redirect(url, 303);
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const defaultSlug = process.env.RESOURCIN_TENANT_SLUG || "resourcin";

  let tenant = await prisma.tenant.findFirst({
    where: { slug: defaultSlug },
  });

  if (!tenant) {
    tenant = await prisma.tenant.create({
      data: {
        slug: defaultSlug,
        name: workspaceName || "Resourcin",
        status: "active",
      },
    });
  }

  const user = await prisma.user.create({
    data: {
      fullName,
      email,
      passwordHash,
      globalRole: "SUPER_ADMIN",
      isActive: true,
    },
  });

  await prisma.userTenantRole.create({
    data: {
      userId: user.id,
      tenantId: tenant.id,
      role: "SUPER_ADMIN",
      isPrimary: true,
    },
  });

  // Make sure AUTH_SECRET is set (throws if not).
  getAuthSecret();

  const token = await createSessionToken(user.id, user.email ?? null);

  const res = NextResponse.redirect(
    new URL("/ats/dashboard", req.url),
    303,
  );

  res.cookies.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7,
    path: "/",
  });

  return res;
}
