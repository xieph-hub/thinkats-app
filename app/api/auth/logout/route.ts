// app/api/auth/logout/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createSupabaseRouteClient } from "@/lib/supabaseRouteClient";

export async function POST(_req: NextRequest) {
  try {
    const supabase = createSupabaseRouteClient();
    await supabase.auth.signOut();
  } catch (err) {
    console.error("Logout error:", err);
    // We still return 200 – logout should be "best effort".
  }

  return NextResponse.json({ ok: true });
}
