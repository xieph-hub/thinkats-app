// app/api/admin/resume-url/route.ts
import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/storage";

// GET /api/admin/resume-url?path=<objectPath>
export async function GET(req: Request) {
  const url = new URL(req.url);
  const path = url.searchParams.get("path");
  if (!path) return NextResponse.json({ ok: false, message: "Missing path" }, { status: 400 });

  const { data, error } = await supabaseServer.storage
    .from("resumes")
    .createSignedUrl(path, 60 * 10); // 10 minutes
  if (error) return NextResponse.json({ ok: false, message: error.message }, { status: 500 });

  return NextResponse.json({ ok: true, url: data?.signedUrl });
}
