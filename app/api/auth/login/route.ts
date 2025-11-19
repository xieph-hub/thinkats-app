// app/api/auth/login/route.ts
import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabaseServerClient";

export async function POST(req: Request) {
  const supabase = createSupabaseServerClient();

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  const { email, password } = body || {};

  if (!email || !password) {
    return NextResponse.json(
      { error: "Email and password are required" },
      { status: 400 }
    );
  }

  const { data, error } =
    await supabase.auth.signInWithPassword({
      email,
      password,
    });

  if (error) {
    console.error("Supabase sign-in error:", error);
    return NextResponse.json(
      { error: error.message },
      { status: 401 }
    );
  }

  // At this point, Supabase has set the auth cookies via our cookie adapter.
  return NextResponse.json({
    success: true,
    user: data.user,
  });
}
