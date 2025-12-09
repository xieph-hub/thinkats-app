// app/api/auth/login/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createSupabaseRouteClient } from "@/lib/supabaseRouteClient";

type ParsedCreds = {
  email: string;
  password: string;
};

/**
 * Gracefully parse credentials whether the caller sent:
 * - application/json
 * - application/x-www-form-urlencoded
 * - multipart/form-data
 */
async function parseCredentials(req: NextRequest): Promise<ParsedCreds> {
  const contentType = req.headers.get("content-type") || "";
  let email = "";
  let password = "";

  try {
    if (contentType.includes("application/json")) {
      const body: any = await req.json().catch(() => ({}));
      email = (body.email ?? "").toString().trim().toLowerCase();
      password = (body.password ?? "").toString();
    } else if (
      contentType.includes("application/x-www-form-urlencoded") ||
      contentType.includes("multipart/form-data")
    ) {
      const formData = await req.formData();
      email = String(formData.get("email") ?? "").trim().toLowerCase();
      password = String(formData.get("password") ?? "");
    } else {
      // Fallback: try formData but swallow undici errors if it doesn't match
      const formData = await req.formData();
      email = String(formData.get("email") ?? "").trim().toLowerCase();
      password = String(formData.get("password") ?? "");
    }
  } catch {
    // If parsing fails, treat as missing credentials
    email = "";
    password = "";
  }

  return { email, password };
}

export async function POST(req: NextRequest) {
  const { email, password } = await parseCredentials(req);

  if (!email || !password) {
    const url = new URL("/login", req.url);
    url.searchParams.set("error", "missing_credentials");
    return NextResponse.redirect(url);
  }

  const supabase = createSupabaseRouteClient();

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error || !data.session) {
    const url = new URL("/login", req.url);
    url.searchParams.set("error", "invalid_credentials");
    return NextResponse.redirect(url);
  }

  // Supabase session cookie is now set. /ats layout + ensureOtpVerified
  // will handle the OTP step and official-email gating.
  const redirectUrl = new URL("/ats", req.url);
  return NextResponse.redirect(redirectUrl);
}
