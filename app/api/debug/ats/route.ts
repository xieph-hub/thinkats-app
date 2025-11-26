// app/api/debug/ats/route.ts
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getCurrentTenantId } from "@/lib/tenant";

export const runtime = "nodejs";

export async function GET() {
  try {
    const tenantId = await getCurrentTenantId();

    const { data: jobs, error: jobsError } = await supabaseAdmin
      .from("jobs")
      .select("id, title, tenant_id, status, visibility, created_at")
      .eq("tenant_id", tenantId)
      .order("created_at", { ascending: false })
      .limit(20);

    const { data: apps, error: appsError } = await supabaseAdmin
      .from("job_applications")
      .select("id, job_id, full_name, email, created_at, stage, status")
      .order("created_at", { ascending: false })
      .limit(20);

    return NextResponse.json({
      tenantId,
      jobsError,
      appsError,
      jobs,
      apps,
    });
  } catch (err: any) {
    console.error("Debug ATS route error", err);
    return NextResponse.json(
      { error: "Debug route failed", message: err?.message },
      { status: 500 }
    );
  }
}
