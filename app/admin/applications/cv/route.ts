export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
// ...rest of your existing imports and code
// app/admin/applications/cv/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const path = searchParams.get("path");

    if (!path) {
      return NextResponse.json(
        { error: "Missing path parameter" },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin.storage
      .from("resourcin-uploads")
      .createSignedUrl(path, 60 * 10); // 10 minutes

    if (error || !data?.signedUrl) {
      console.error("Error creating signed CV URL", error);
      return NextResponse.json(
        { error: "Could not generate CV download link" },
        { status: 500 }
      );
    }

    return NextResponse.redirect(data.signedUrl);
  } catch (err) {
    console.error("Error in /admin/applications/cv", err);
    return NextResponse.json(
      { error: "Unexpected error" },
      { status: 500 }
    );
  }
}
