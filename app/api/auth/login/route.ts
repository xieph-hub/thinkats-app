// app/api/auth/login/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createSupabaseRouteClient } from "@/lib/supabaseRouteClient";
import { isOfficialUser } from "@/lib/officialEmail";

type ParsedCreds = {
  email: string;
  password: string;
};

/**
 * Gracefully parse credentials whether the caller sent:
 * - application/json  (e.g. fetch("/api/auth/login", { body: JSON.stringify(...) }))
 * - application/x-www-form-urlencoded (standard <form method="POST">)
 * - multipart/form-data (FormData via fetch)
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
      // Fallback: try formData but swallow the undici error if it doesn't match
      const formData = await req.formData();
      email = String(formData.get("email") ?? "").trim().toLowerCase();
      password = String(formData.get("password") ?? "");
    }
  } catch {
    // If parsing fails for any reason, we'll treat it as missing credentials
    email = "";
    password = "";
  }

  return { email, password };
}

export async function POST(req: NextRequest) {
  const { email, password } = await parseCredentials(req);

  // Basic validation
  if (!email || !password) {
    const url = new URL("/login", req.url);
    url.searchParams.set("error", "missing_credentials");
    return NextResponse.redirect(url);
  }

  // Optional: keep the “official user” gate you’re already using elsewhere
  if (!isOfficialUser(email)) {
    const url = new URL("/login", req.url);
    url.searchParams.set("error", "unauthorised");
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

  // At this point:
  // - Supabase session cookie is set
  // - /ats layout + ensureOtpVerified will handle the OTP step
  const redirectUrl = new URL("/ats", req.url);
  return NextResponse.redirect(redirectUrl);
}
