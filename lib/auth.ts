// lib/auth.ts
import { cookies } from "next/headers";
import { jwtVerify, SignJWT, type JWTPayload } from "jose";
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

type AuthTokenPayload = JWTPayload & {
  userId: string;
  email?: string | null;
};

export type CurrentUser = {
  id: string;
  fullName: string | null;
  email: string | null;
  globalRole: string;
  isActive: boolean;
  roles: {
    tenantId: string;
    role: string;
    isPrimary: boolean;
  }[];
  /**
   * SUPER_ADMIN (global or tenant) can see all tenants.
   */
  canSeeAllTenants: boolean;
  /**
   * For non-SUPER_ADMIN, which tenants they’re scoped to.
   * Empty when canSeeAllTenants = true.
   */
  allowedTenantIds: string[];
  /**
   * Convenience: their primary tenant (if any).
   */
  primaryTenantId?: string;
};

/**
 * Decode session cookie → fetch user + tenant roles + globalRole.
 */
export async function getCurrentUser(): Promise<CurrentUser | null> {
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

    if (!user || !user.isActive) return null;

    const superTenantRoles = user.userTenantRoles.filter(
      (r) => r.role === "SUPER_ADMIN",
    );
    const canSeeAllTenants =
      user.globalRole === "SUPER_ADMIN" || superTenantRoles.length > 0;

    const nonSuperRoles = user.userTenantRoles.filter(
      (r) => r.role !== "SUPER_ADMIN",
    );

    const allowedTenantIds = canSeeAllTenants
      ? []
      : nonSuperRoles.map((r) => r.tenantId);

    const primaryTenant =
      user.userTenantRoles.find((r) => r.isPrimary) ?? user.userTenantRoles[0];

    return {
      id: user.id,
      fullName: user.fullName ?? null,
      email: user.email ?? null,
      globalRole: user.globalRole,
      isActive: user.isActive,
      roles: user.userTenantRoles.map((r) => ({
        tenantId: r.tenantId,
        role: r.role,
        isPrimary: r.isPrimary,
      })),
      canSeeAllTenants,
      allowedTenantIds,
      primaryTenantId: primaryTenant?.tenantId,
    };
  } catch (err) {
    console.error("Failed to verify auth token", err);
    return null;
  }
}

/**
 * True when user is "global" SUPER_ADMIN or has SUPER_ADMIN role on any tenant.
 */
export function isSuperAdmin(user: CurrentUser | null | undefined): boolean {
  if (!user) return false;
  if (user.globalRole === "SUPER_ADMIN") return true;
  return user.roles.some((r) => r.role === "SUPER_ADMIN");
}

/**
 * Helper for server components / route handlers:
 *
 *  - Normalises tenantId from URL against what the user is allowed to see.
 *  - SUPER_ADMIN: can see any tenantId (or fallback to primary).
 *  - Others: only tenantIds they have UserTenantRole for.
 */
export async function getUserAndTenantScope(
  tenantIdFromUrl?: string | null,
): Promise<{ user: CurrentUser | null; tenantId: string | null }> {
  const user = await getCurrentUser();
  if (!user) return { user: null, tenantId: null };

  // SUPER_ADMIN (global or tenant) — allow whatever tenantId they pick,
  // or fall back to primary.
  if (isSuperAdmin(user)) {
    const tenantId =
      tenantIdFromUrl || user.primaryTenantId || null;
    return { user, tenantId };
  }

  const allowed = user.allowedTenantIds;
  if (!allowed.length) {
    return { user, tenantId: null };
  }

  let effectiveTenantId: string;

  if (tenantIdFromUrl && allowed.includes(tenantIdFromUrl)) {
    effectiveTenantId = tenantIdFromUrl;
  } else if (
    user.primaryTenantId &&
    allowed.includes(user.primaryTenantId)
  ) {
    effectiveTenantId = user.primaryTenantId;
  } else {
    effectiveTenantId = allowed[0];
  }

  return { user, tenantId: effectiveTenantId };
}

/**
 * Helper for APIs that should only be accessible to SUPER_ADMIN.
 * Throws 403-style error that you can handle in route handlers.
 */
export function assertSuperAdmin(user: CurrentUser | null | undefined) {
  if (!isSuperAdmin(user)) {
    const err = new Error("Forbidden – SUPER_ADMIN required");
    // @ts-expect-error – simple way to tag status code.
    err.statusCode = 403;
    throw err;
  }
}

/**
 * Issue a signed JWT token for a given user.
 */
export async function createSessionToken(userId: string, email: string | null) {
  const secret = getAuthSecret();

  return new SignJWT({
    userId,
    email,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(encoder.encode(secret));
}
