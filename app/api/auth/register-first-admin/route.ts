import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { SignJWT } from "jose";
import { SESSION_COOKIE_NAME, getAuthSecret } from "@/lib/auth";

const encoder = new TextEncoder();

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

  // If a SUPER_ADMIN already exists, bail out
  const existingAdmin = await prisma.userTenantRole.findFirst({
    where: { role: "SUPER_ADMIN" },
  });

  if (existingAdmin) {
    const url = new URL("/login", req.url);
    url.searchParams.set("error", "admin_exists");
    return NextResponse.redirect(url, 303);
  }

  const passwordHash = await bcrypt.hash(password, 10);

  // Find or create default tenant
  const defaultSlug = process.env.RESOURCIN_TENANT_SLUG || "resourcin";

  let tenant = await prisma.tenant.findFirst({
    where: { slug: defaultSlug },
  });

  if (!tenant) {
    tenant = await prisma.tenant.create({
      data: {
        slug: defaultSlug,
        name: workspaceName || "Resourcin",
      },
    });
  }

  const user = await prisma.user.create({
    data: {
      fullName,
      email,
      passwordHash,
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

  const secret = getAuthSecret();
  const token = await new SignJWT({
    userId: user.id,
    email: user.email,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(encoder.encode(secret));

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
