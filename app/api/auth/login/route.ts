// app/api/auth/login/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { SESSION_COOKIE_NAME, createSessionToken } from "@/lib/auth";

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

  const user = await prisma.user.findUnique({
    where: { email },
    include: { userTenantRoles: true },
  });

  if (!user || !user.passwordHash || !user.isActive) {
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
