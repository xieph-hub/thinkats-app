// app/api/auth/login/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createSupabaseRouteClient } from "@/lib/supabaseRouteClient";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const email = typeof body.email === "string" ? body.email.trim() : "";
    const password =
      typeof body.password === "string" ? body.password : "";

    if (!email || !password) {
      return NextResponse.json(
        { ok: false, error: "missing_credentials" },
        { status: 400 },
      );
    }

    const supabase = createSupabaseRouteClient();

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error || !data?.user) {
      console.error("Supabase sign-in error:", error?.message);
      return NextResponse.json(
        { ok: false, error: "invalid_credentials" },
        { status: 401 },
      );
    }

    // At this point Supabase has set the auth cookie
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Login handler error:", err);
    return NextResponse.json(
      { ok: false, error: "server_error" },
      { status: 500 },
    );
  }
}
