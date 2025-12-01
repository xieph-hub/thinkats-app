import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { SignJWT } from "jose";
import { SESSION_COOKIE_NAME, getAuthSecret } from "@/lib/auth";

const encoder = new TextEncoder();

export async function POST(req: Request) {
  const formData = await req.formData();
  const emailRaw =
    ((formData.get("email") as string | null) ?? "").trim();
  const password = (formData.get("password") as string | null) ?? "";

  const email = emailRaw.toLowerCase();

  if (!email || !password) {
    const url = new URL("/login", req.url);
    url.searchParams.set("error", "invalid");
    return NextResponse.redirect(url, 303);
  }

  const user = await prisma.user.findFirst({
    where: {
      email,
    },
    include: {
      userTenantRoles: true,
    },
  });

  if (!user || !user.passwordHash) {
    const url = new URL("/login", req.url);
    url.searchParams.set("error", "invalid");
    return NextResponse.redirect(url, 303);
  }

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) {
    const url = new URL("/login", req.url);
    url.searchParams.set("error", "invalid");
    return NextResponse.redirect(url, 303);
  }

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
