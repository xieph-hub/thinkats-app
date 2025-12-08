// app/api/auth/login/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const AUTH_COOKIE_NAME = "thinkats_user_id";

function buildLoginRedirect(
  req: NextRequest,
  callbackUrl: string,
  error?: string,
) {
  const url = new URL("/login", req.url);
  if (callbackUrl) url.searchParams.set("callbackUrl", callbackUrl);
  if (error) url.searchParams.set("error", error);
  return url;
}

function normalizeCallbackUrl(raw: string | null | undefined): string {
  if (!raw) return "/ats";

  // Allow relative URLs like "/ats" or "/ats/dashboard"
  if (raw.startsWith("/")) return raw;

  // Very defensive: only allow absolute URLs that match NEXT_PUBLIC_SITE_URL
  try {
    const target = new URL(raw);
    const site = process.env.NEXT_PUBLIC_SITE_URL;
    if (site && target.origin === site) {
      return (
        target.pathname + target.search + target.hash
      );
    }
  } catch {
    // fall through
  }

  return "/ats";
}

export async function POST(req: NextRequest) {
  const form = await req.formData();

  const emailRaw = form.get("email");
  const nameRaw = form.get("name");
  const callbackRaw = form.get("callbackUrl");

  const email =
    typeof emailRaw === "string" ? emailRaw.trim().toLowerCase() : "";
  const fullName =
    typeof nameRaw === "string" && nameRaw.trim().length > 0
      ? nameRaw.trim()
      : null;
  const callbackUrl =
    typeof callbackRaw === "string" && callbackRaw.length > 0
      ? callbackRaw
      : "/ats";

  if (!email) {
    const redirectUrl = buildLoginRedirect(
      req,
      callbackUrl,
      "missing_email",
    );
    return NextResponse.redirect(redirectUrl);
  }

  // Look up (or create) the app-level User row
  let user = await prisma.user.findFirst({
    where: { email },
  });

  if (!user) {
    // Creates a minimal user that matches getServerUser's expectations
    user = await prisma.user.create({
      data: {
        email,
        fullName,
        globalRole: "USER",
        isActive: true,
      },
    });
  }

  if (!user.isActive) {
    const redirectUrl = buildLoginRedirect(
      req,
      callbackUrl,
      "inactive",
    );
    return NextResponse.redirect(redirectUrl);
  }

  const dest = normalizeCallbackUrl(callbackUrl);
  const res = NextResponse.redirect(new URL(dest, req.url));

  // 🔐 Set the cookie that getServerUser() reads
  res.cookies.set(AUTH_COOKIE_NAME, user.id, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });

  return res;
}
