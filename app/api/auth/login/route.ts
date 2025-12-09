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
      // Fallback: try formData but swallow errors
      const formData = await req.formData();
      email = String(formData.get("email") ?? "").trim().toLowerCase();
      password = String(formData.get("password") ?? "");
    }
  } catch {
    email = "";
    password = "";
  }

  return { email, password };
}

export async function POST(req: NextRequest) {
  const { email, password } = await parseCredentials(req);

  if (!email || !password) {
    return NextResponse.json(
      { ok: false, error: "missing_credentials" },
      { status: 400 },
    );
  }

  const supabase = createSupabaseRouteClient();

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error || !data.session) {
    return NextResponse.json(
      { ok: false, error: "invalid_credentials" },
      { status: 401 },
    );
  }

  // Supabase auth helpers will set cookies on this response.
  return NextResponse.json({ ok: true });
}
