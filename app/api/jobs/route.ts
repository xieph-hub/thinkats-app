// app/api/jobs/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabaseServerClient";
import { getCurrentUserAndTenants } from "@/lib/getCurrentUserAndTenants";

/**
 * POST /api/jobs
 * Creates a new job under the current tenant.
 */
export async function POST(req: NextRequest) {
  try {
    // Get the logged-in user and their tenant
    const { user, currentTenant } = await getCurrentUserAndTenants();

    if (!user || !currentTenant) {
      return NextResponse.json(
        { error: "You must be logged in and linked to a tenant to create jobs." },
        { status: 401 }
      );
    }

    // Parse the incoming JSON body
    const body = await req.json();

    const {
      title,
      location,
      function: jobFunction,
      employment_type,
      seniority,
      summary,
      description,
      tags,
      is_published,
    } = body;

    if (!title || !location) {
      return NextResponse.json(
        { error: "Missing required fields: title and location" },
        { status: 400 }
      );
    }

    const supabase = await createSupabaseServerClient();

    // ✅ Insert the job into Supabase, linked to this tenant
    const { data, error } = await supabase
      .from("jobs")
      .insert([
        {
          tenant_id: currentTenant.id,
          title,
          location,
          function: jobFunction ?? null,
          employment_type: employment_type ?? null,
          seniority: seniority ?? null,
          summary: summary ?? null,
          description: description ?? null,
          tags: tags ?? [],
          is_published: is_published ?? false,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error("❌ Error creating job:", error);
      return NextResponse.json(
        { error: "Failed to create job. Check logs for details." },
        { status: 500 }
      );
    }

    return NextResponse.json(data, { status: 201 });
  } catch (err) {
    console.error("❌ Unexpected error in /api/jobs:", err);
    return NextResponse.json(
      { error: "An unexpected error occurred while creating the job." },
      { status: 500 }
    );
  }
}

/**
 * GET /api/jobs
 * Returns a list of jobs for the current tenant.
 */
export async function GET() {
  try {
    const { user, currentTenant } = await getCurrentUserAndTenants();

    if (!user || !currentTenant) {
      return NextResponse.json(
        { error: "You must be logged in and linked to a tenant." },
        { status: 401 }
      );
    }

    const supabase = await createSupabaseServerClient();

    const { data, error } = await supabase
      .from("jobs")
      .select(
        `
          id,
          title,
          location,
          function,
          employment_type,
          is_published,
          created_at
        `
      )
      .eq("tenant_id", currentTenant.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("⚠️ Error fetching jobs:", error);
      return NextResponse.json(
        { error: "Unable to load jobs" },
        { status: 500 }
      );
    }

    return NextResponse.json(data, { status: 200 });
  } catch (err) {
    console.error("⚠️ Unexpected error in GET /api/jobs:", err);
    return NextResponse.json(
      { error: "Unexpected server error" },
      { status: 500 }
    );
  }
}
