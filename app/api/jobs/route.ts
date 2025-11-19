// app/api/jobs/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabaseServerClient";
import { getCurrentUserAndTenants } from "@/lib/getCurrentUserAndTenants";

/**
 * POST /api/jobs
 * Creates a new job under the current tenant in the canonical `Jobs` table.
 */
export async function POST(req: NextRequest) {
  try {
    const { user, currentTenant } = await getCurrentUserAndTenants();

    if (!user || !currentTenant) {
      return NextResponse.json(
        {
          error:
            "You must be logged in and linked to a tenant to create jobs.",
        },
        { status: 401 }
      );
    }

    const body = await req.json();

    const {
      slug,
      title,
      location,
      department,
      jobType,
      level,
      function: jobFunction, // still available if you want to store it
      industry,
      remoteOption,
      experienceMax,
      salaryCurrency,
      salaryMin,
      salaryMax,
      summary,
      description,
      requirements,
      clientName,
      clientSlug,
      clientCompanyId,
      employmentType,
      seniority,
      tags,
      isPublished,
      status,
    } = body;

    // Basic required fields – tighten as you wish
    if (!title || !slug || !location) {
      return NextResponse.json(
        { error: "Missing required fields: title, slug and location" },
        { status: 400 }
      );
    }

    const supabase = await createSupabaseServerClient();

    // ✅ Insert into the canonical `Jobs` table (the one you pasted the columns for)
    const { data, error } = await supabase
      .from("Jobs")
      .insert([
        {
          slug,
          title,
          excerpt: summary ?? null, // optional – or keep null
          department: department ?? null,
          location,
          description: description ?? null,
          postedAt: new Date().toISOString(), // or null if you prefer
          isPublished: isPublished ?? false,
          clientName: clientName ?? null,
          clientSlug: clientSlug ?? null,
          status: status ?? "draft",
          ClientID: null, // if you’re not using this yet
          jobType: jobType ?? null,
          level: level ?? null,
          function: jobFunction ?? null,
          industry: industry ?? null,
          remoteOption: remoteOption ?? null,
          experienceMax: experienceMax ?? null,
          salaryCurrency: salaryCurrency ?? null,
          salaryMin: salaryMin ?? null,
          salaryMax: salaryMax ?? null,
          summary: summary ?? null,
          requirements: requirements ?? null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          tenantId: currentTenant.id, // 🔑 tie to current tenant
          clientCompanyId: clientCompanyId ?? null,
          employmentType: employmentType ?? null,
          seniority: seniority ?? null,
          tags: tags ?? [],
        },
      ])
      .select()
      .single();

    if (error) {
      console.error("❌ Error creating job in Jobs table:", error);
      return NextResponse.json(
        { error: "Failed to create job. Check logs for details." },
        { status: 500 }
      );
    }

    return NextResponse.json(data, { status: 201 });
  } catch (err) {
    console.error("❌ Unexpected error in POST /api/jobs:", err);
    return NextResponse.json(
      { error: "An unexpected error occurred while creating the job." },
      { status: 500 }
    );
  }
}

/**
 * GET /api/jobs
 * Returns a list of jobs for the current tenant from `Jobs`.
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
      .from("Jobs")
      .select(
        `
          id,
          slug,
          title,
          department,
          location,
          employmentType,
          isPublished,
          createdAt,
          tenantId
        `
      )
      .eq("tenantId", currentTenant.id)
      .order("createdAt", { ascending: false });

    if (error) {
      console.error("⚠️ Error fetching jobs from Jobs table:", error);
      return NextResponse.json(
        { error: "Unable to load jobs" },
        { status: 500 }
      );
    }

    return NextResponse.json(data ?? [], { status: 200 });
  } catch (err) {
    console.error("⚠️ Unexpected error in GET /api/jobs:", err);
    return NextResponse.json(
      { error: "Unexpected server error" },
      { status: 500 }
    );
  }
}
