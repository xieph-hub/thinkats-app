// app/api/auth/logout/route.ts
import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabaseServerClient";

export async function POST() {
  const supabase = await createSupabaseServerClient();

  const { error } = await supabase.auth.signOut();

  if (error) {
    console.error("Supabase sign-out error:", error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }

  // Auth cookies are cleared by Supabase via our cookie adapter
  return NextResponse.json({ success: true });
}
