// app/api/ats/auth/me/route.ts
import { NextResponse } from "next/server";
import { createSupabaseRouteClient } from "@/lib/supabaseRouteClient";

export const runtime = "nodejs";

export async function GET() {
  try {
    const supabase = createSupabaseRouteClient();

    const {
      data,
      error,
    } = await supabase.auth.getUser();

    if (error || !data?.user) {
      return NextResponse.json(
        {
          ok: false,
          email: null,
          isSuperAdmin: false,
        },
        { status: 200 },
      );
    }

    const email = data.user.email?.toLowerCase() ?? "";

    // 🔑 Super admin rule – your Gmail
    const isSuperAdmin = email === "resourcinhumancapitaladvisors@gmail.com";

    return NextResponse.json(
      {
        ok: true,
        email,
        isSuperAdmin,
      },
      { status: 200 },
    );
  } catch (err) {
    console.error("ATS auth/me error:", err);
    return NextResponse.json(
      {
        ok: false,
        email: null,
        isSuperAdmin: false,
      },
      { status: 200 },
    );
  }
}
