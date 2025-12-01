// app/api/auth/login/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createSupabaseRouteClient } from "@/lib/supabaseRouteClient";

export async function POST(req: NextRequest) {
  const { supabase, res } = createSupabaseRouteClient(req);

  const body = await req.json().catch(() => ({}));
  const { email, password } = body as {
    email?: string;
    password?: string;
  };

  if (!email || !password) {
    return NextResponse.json(
      { error: "Email and password are required." },
      { status: 400 }
    );
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return NextResponse.json(
      { error: error.message },
      {
        status: 401,
        headers: res.headers, // forward Set-Cookie (even on error)
      }
    );
  }

  // At this point Supabase has written auth cookies into `res`
  return NextResponse.json(
    {
      user: data.user,
    },
    {
      status: 200,
      headers: res.headers, // includes the auth Set-Cookie headers
    }
  );
}
