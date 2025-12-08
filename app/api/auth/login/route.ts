// app/api/auth/login/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createSupabaseRouteClient } from "@/lib/supabaseRouteClient";

export async function POST(req: NextRequest) {
  try {
    const supabase = createSupabaseRouteClient();

    const body = await req.json().catch(() => ({}));
    const email = (body.email as string | undefined)?.trim().toLowerCase();
    const password = body.password as string | undefined;

    if (!email || !password) {
      return NextResponse.json(
        { ok: false, error: "Email and password are required." },
        { status: 400 },
      );
    }

    const {
      data,
      error,
    } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error || !data.session) {
      return NextResponse.json(
        { ok: false, error: "Invalid email or password." },
        { status: 400 },
      );
    }

    // Where should we go after login?
    const callbackUrl =
      req.nextUrl.searchParams.get("callbackUrl") || "/ats";

    return NextResponse.json({
      ok: true,
      redirectTo: callbackUrl,
    });
  } catch (err) {
    console.error("Login error:", err);
    return NextResponse.json(
      { ok: false, error: "Something went wrong during login." },
      { status: 500 },
    );
  }
}
