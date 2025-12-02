// app/api/auth/login/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createSupabaseRouteClient } from "@/lib/supabaseRouteClient";

export async function POST(req: NextRequest) {
  const supabase = createSupabaseRouteClient();

  const body = await req.json().catch(() => ({}));
  const { email, password } = body as { email?: string; password?: string };

  if (!email || !password) {
    return NextResponse.json(
      { error: "Email and password are required." },
      { status: 400 }
    );
  }

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    console.error("Supabase login error:", error);
    return NextResponse.json(
      { error: "Invalid email or password." },
      { status: 400 }
    );
  }

  const url = req.nextUrl;
  const callbackUrl = url.searchParams.get("callbackUrl") || "/ats";

  return NextResponse.json({
    success: true,
    redirectTo: callbackUrl,
  });
}
