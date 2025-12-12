// app/api/invites/accept/route.ts
import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

function isUuid(v: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    v,
  );
}

function hashToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function safeError(message: string) {
  return NextResponse.json({ ok: false, error: message }, { status: 400 });
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => null)) as
      | { token?: string; password?: string; fullName?: string | null }
      | null;

    const token = String(body?.token || "").trim();
    const password = String(body?.password || "");
    const fullName = (body?.fullName ?? null) ? String(body?.fullName).trim() : null;

    if (!token || !isUuid(token)) return safeError("invalid_token");
    if (!password || password.length < 8) return safeError("weak_password");

    const tokenHash = hashToken(token);
    const now = new Date();

    const invite = await prisma.tenantInvitation.findFirst({
      where: {
        tokenHash,
        usedAt: null,
        expiresAt: { gt: now },
      },
      select: {
        id: true,
        tenantId: true,
        email: true,
        role: true,
      },
    });

    if (!invite) {
      return NextResponse.json(
        { ok: false, error: "invite_not_found_or_expired" },
        { status: 404 },
      );
    }

    const email = invite.email.toLowerCase().trim();

    // If app user already exists, do NOT reset password here (avoid takeover risk).
    const existingUser = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });

    if (existingUser) {
      return NextResponse.json(
        { ok: false, error: "account_exists_sign_in" },
        { status: 409 },
      );
    }

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json(
        {
          ok: false,
          error: "missing_supabase_service_role",
          hint: "Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in Vercel env vars.",
        },
        { status: 500 },
      );
    }

    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    // ✅ Create Auth user first → gives us an auth.users.id that satisfies users_id_fkey
    const { data: created, error: createErr } =
      await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: fullName ? { full_name: fullName } : {},
      });

    if (createErr || !created?.user?.id) {
      const msg = String(createErr?.message || "auth_create_failed");
      // If they already exist in auth, require sign-in flow (don’t reset here)
      if (msg.toLowerCase().includes("already") || msg.toLowerCase().includes("registered")) {
        return NextResponse.json(
          { ok: false, error: "account_exists_sign_in" },
          { status: 409 },
        );
      }
      return NextResponse.json(
        { ok: false, error: "auth_create_failed", detail: msg.slice(0, 180) },
        { status: 500 },
      );
    }

    const authUserId = created.user.id; // UUID from auth.users

    // ✅ Create app row + attach tenant role + consume invitation (atomic)
    await prisma.$transaction(async (tx) => {
      await tx.user.create({
        data: {
          id: authUserId,          // IMPORTANT: must match auth.users.id
          email,
          fullName: fullName || null,
          globalRole: "USER",
          isActive: true,
        },
      });

      await tx.userTenantRole.create({
        data: {
          userId: authUserId,
          tenantId: invite.tenantId,
          role: invite.role,
          isPrimary: true,
        },
      });

      await tx.tenantInvitation.update({
        where: { id: invite.id },
        data: {
          userId: authUserId,
          usedAt: new Date(),
        },
      });
    });

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("POST /api/invites/accept failed", err);
    return NextResponse.json(
      { ok: false, error: "server_error" },
      { status: 500 },
    );
  }
}
