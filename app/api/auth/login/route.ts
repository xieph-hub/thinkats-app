// app/api/auth/login/route.ts
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { AUTH_COOKIE_NAME, OTP_COOKIE_NAME } from "@/lib/auth/getServerUser";

export async function POST(req: NextRequest) {
  try {
    let body: any = {};
    try {
      body = await req.json();
    } catch {
      body = {};
    }

    const rawEmail = typeof body.email === "string" ? body.email.trim() : "";
    const password =
      typeof body.password === "string" ? body.password : "";

    if (!rawEmail || !password) {
      return NextResponse.json(
        { ok: false, error: "missing_credentials" },
        { status: 400 },
      );
    }

    const email = rawEmail.toLowerCase();

    // Case-insensitive lookup, so you don't get bitten by casing
    const user = await prisma.user.findFirst({
      where: {
        email: {
          equals: email,
          mode: "insensitive",
        },
      },
    });

    if (!user || !user.passwordHash || !user.isActive) {
      return NextResponse.json(
        { ok: false, error: "invalid_credentials" },
        { status: 401 },
      );
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return NextResponse.json(
        { ok: false, error: "invalid_credentials" },
        { status: 401 },
      );
    }

    // ✅ Authenticated: set main auth cookie + clear OTP cookie so they must re-verify
    const res = NextResponse.json({ ok: true });

    const isProd = process.env.NODE_ENV === "production";

    res.cookies.set(AUTH_COOKIE_NAME, user.id, {
      httpOnly: true,
      secure: isProd,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    // Clear any previous OTP verification
    res.cookies.set(OTP_COOKIE_NAME, "", {
      httpOnly: true,
      secure: isProd,
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    });

    return res;
  } catch (err) {
    console.error("Login handler error:", err);
    return NextResponse.json(
      { ok: false, error: "server_error" },
      { status: 500 },
    );
  }
}
