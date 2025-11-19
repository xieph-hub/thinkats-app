// app/api/jobs/route.ts
import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "../../../lib/supabaseServerClient";

// Create a new job for the current tenant (authenticated ATS user)
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      title,
      department,
      location,
      employment_type,
      seniority,
      description,
      tenant_id,
    } = body;

    const supabase = await createSupabaseServerClient();

    // Get current user (must be logged in)
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: job, error } = await supabase
      .from("jobs")
      .insert({
        tenant_id,
        title,
        department,
        location,
        employment_type,
        seniority,
        description,
        status: "open",
        visibility: "public",
        created_by: user.id,
      })
      .select("*")
      .single();

    if (error) {
      console.error("[POST /api/jobs] error:", error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ job });
  } catch (e: any) {
    console.error("[POST /api/jobs] exception:", e);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
