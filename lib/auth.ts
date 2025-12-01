// lib/auth.ts
import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { prisma } from "@/lib/prisma";

export const SESSION_COOKIE_NAME = "thinkats_session";

const encoder = new TextEncoder();

export function getAuthSecret(): string {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error(
      "AUTH_SECRET env var is required (set it in your .env / Vercel project).",
    );
  }
  return secret;
}

type AuthTokenPayload = {
  userId: string;
  email?: string | null;
};

export async function getCurrentUser() {
  const cookieStore = cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;

  try {
    const secret = getAuthSecret();

    const { payload } = await jwtVerify<AuthTokenPayload>(
      token,
      encoder.encode(secret),
    );

    if (!payload.userId || typeof payload.userId !== "string") {
      return null;
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      include: { userTenantRoles: true },
    });

    if (!user) return null;

    return {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      roles: user.userTenantRoles.map((r) => ({
        tenantId: r.tenantId,
        role: r.role,
        isPrimary: r.isPrimary,
      })),
    };
  } catch (err) {
    console.error("Failed to verify auth token", err);
    return null;
  }
}
