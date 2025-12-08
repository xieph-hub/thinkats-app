// app/api/ats/tenant/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerUser } from "@/lib/auth/getServerUser";

export async function GET(_req: NextRequest) {
  try {
    const { user, isSuperAdmin } = await getServerUser();

    if (!user || !user.email) {
      return NextResponse.json(
        { ok: false, error: "unauthenticated" },
        { status: 401 },
      );
    }

    return NextResponse.json({
      ok: true,
      isSuperAdmin,
      user: {
        id: user.id,
        email: user.email,
        // adjust if your User model uses a different field name
        name: (user as any).name ?? null,
      },
      // Keep a placeholder so callers that expect a "tenant" key don't crash.
      tenant: null,
    });
  } catch (error) {
    console.error("/api/ats/tenant GET error", error);
    return NextResponse.json(
      { ok: false, error: "internal_error" },
      { status: 500 },
    );
  }
}
