// app/api/auth/logout/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createSupabaseRouteClient } from "@/lib/supabaseRouteClient";

export async function POST(req: NextRequest) {
  const { supabase, res } = createSupabaseRouteClient(req);

  // Clear Supabase auth session (and its cookies)
  await supabase.auth.signOut();

  return NextResponse.json(
    { success: true },
    {
      status: 200,
      headers: res.headers, // forward updated cookies from Supabase
    }
  );
}
