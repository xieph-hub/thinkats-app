// lib/auth.ts
import { cookies } from "next/headers";
import { SignJWT, jwtVerify, JWTPayload } from "jose";
import { prisma } from "@/lib/prisma";

export const AUTH_COOKIE_NAME = "thinkats_session";

function getSecretKey(): Uint8Array {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error("AUTH_SECRET env var is not set");
  }
  return new TextEncoder().encode(secret);
}

export async function createAuthToken(userId: string): Promise<string> {
  const jwt = await new SignJWT({ sub: userId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(getSecretKey());

  return jwt;
}

export async function verifyAuthToken(
  token: string,
): Promise<JWTPayload> {
  const { payload } = await jwtVerify(token, getSecretKey());
  return payload;
}

/**
 * Server-side helper: get the currently logged in user (or null).
 * Use this inside server components / route handlers (NOT middleware).
 */
export async function getSessionUser() {
  const token = cookies().get(AUTH_COOKIE_NAME)?.value;
  if (!token) return null;

  try {
    const payload = await verifyAuthToken(token);
    const userId = payload.sub as string | undefined;
    if (!userId) return null;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { userTenantRoles: true },
    });

    if (!user || !user.isActive) return null;
    return user;
  } catch {
    return null;
  }
}

/**
 * Same as getSessionUser but throws if no user (for routes that REQUIRE auth).
 */
export async function requireSessionUser() {
  const user = await getSessionUser();
  if (!user) {
    throw new Error("Unauthenticated");
  }
  return user;
}
