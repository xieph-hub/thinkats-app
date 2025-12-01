// app/api/auth/login/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabaseServerClient";

/**
 * Email + password login.
 *
 * Uses the server Supabase client wired to `cookies()`, so
 * auth cookies are set correctly and are visible to both:
 * - your Server Components (/ats, dashboards, etc.)
 * - your middleware (via the Supabase proxy / route client)
 */
export async function POST(req: NextRequest) {
  // Server-side Supabase client (uses next/headers cookies under the hood)
  const supabase = await createSupabaseServerClient();

  // Parse body safely
  const body = (await req.json().catch(() => ({}))) as {
    email?: string;
    password?: string;
  };

  const { email, password } = body;

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
      { status: 400 }
    );
  }

  // At this point, Supabase has already written the auth cookies
  // via the createSupabaseServerClient() helper.
  // We just return a simple JSON payload the login page can use.
  return NextResponse.json(
    {
      success: true,
      user: data.user ?? null,
      redirectTo: "/ats", // your intended post-login landing
    },
    { status: 200 }
  );
}
