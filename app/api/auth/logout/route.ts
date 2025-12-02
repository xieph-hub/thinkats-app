// app/api/auth/logout/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createSupabaseRouteClient } from "@/lib/supabaseRouteClient";

export async function POST(_req: NextRequest) {
  const supabase = createSupabaseRouteClient();

  const { error } = await supabase.auth.signOut();

  if (error) {
    console.error("Supabase logout error:", error);
    return NextResponse.json(
      { error: "Failed to log out." },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}
