// app/api/auth/login/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/password";
import { AUTH_COOKIE_NAME, createAuthToken } from "@/lib/auth";

export async function POST(req: Request) {
  const formData = await req.formData();

  const emailRaw = formData.get("email");
  const passwordRaw = formData.get("password");
  const callbackUrlRaw = formData.get("callbackUrl");

  const email =
    typeof emailRaw === "string" ? emailRaw.trim().toLowerCase() : "";
  const password =
    typeof passwordRaw === "string" ? passwordRaw : "";
  const callbackUrl =
    typeof callbackUrlRaw === "string" ? callbackUrlRaw : "";

  const errorRedirect = (msg: string) => {
    const url = new URL("/login", req.url);
    url.searchParams.set("error", encodeURIComponent(msg));
    if (callbackUrl) {
      url.searchParams.set("callbackUrl", callbackUrl);
    }
    return NextResponse.redirect(url, 303);
  };

  if (!email || !password) {
    return errorRedirect("Email+and+password+are+required");
  }

  const user = await prisma.user.findFirst({
    where: { email },
    include: { userTenantRoles: true },
  });

  if (!user || !user.passwordHash || !user.isActive) {
    return errorRedirect("Invalid+email+or+password");
  }

  const ok = await verifyPassword(password, user.passwordHash);
  if (!ok) {
    return errorRedirect("Invalid+email+or+password");
  }

  const token = await createAuthToken(user.id);

  const target =
    callbackUrl && callbackUrl.startsWith("/")
      ? callbackUrl
      : "/ats/dashboard";

  const redirectUrl = new URL(target, req.url);
  const res = NextResponse.redirect(redirectUrl, 303);

  res.cookies.set(AUTH_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });

  return res;
}
