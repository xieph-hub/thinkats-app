// app/api/debug/public-jobs/route.ts
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from("jobs")
    .select(
      `
      id,
      title,
      tenant_id,
      status,
      visibility,
      internal_only,
      created_at
    `
    )
    .eq("visibility", "public")
    .order("created_at", { ascending: false })
    .limit(30);

  return NextResponse.json({ error, jobs: data });
}
