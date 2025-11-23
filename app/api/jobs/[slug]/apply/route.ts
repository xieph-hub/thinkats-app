// app/api/jobs/[slug]/apply/route.ts

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Use the same envs as your /api/upload-cv route
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const dynamic = "force-dynamic";

function getSupabaseClient() {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error("Supabase env vars are missing");
  }
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

type RouteContext = {
  params: { slug: string };
};

export async function POST(req: NextRequest, { params }: RouteContext) {
  try {
    const supabase = getSupabaseClient();
    const slugOrId = params.slug;

    if (!slugOrId) {
      return NextResponse.json(
        { error: "Missing job slug or id in URL." },
        { status: 400 }
      );
    }

    // ----- 1) Parse JSON body from JobApplyForm -----
    let body: any;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON payload." },
        { status: 400 }
      );
    }

    const getString = (key: string): string | undefined => {
      const value = body?.[key];
      if (typeof value !== "string") return undefined;
      const trimmed = value.trim();
      return trimmed.length ? trimmed : undefined;
    };

    const fullName = getString("fullName");
    const email = getString("email")?.toLowerCase();
    const phone = getString("phone") ?? null;
    const location = getString("location") ?? null;
    const linkedinUrl = getString("linkedinUrl") ?? null;
    const portfolioUrl = getString("portfolioUrl") ?? null;
    const cvUrl = getString("cvUrl") ?? null;
    const headline = getString("headline") ?? "";
    const notes = getString("notes") ?? "";
    const source = "Website";

    if (!fullName || !email) {
      return NextResponse.json(
        { error: "Full name and email are required." },
        { status: 400 }
      );
    }

    // ----- 2) Find job by slug or ID, ensure open + public -----
    const selectCols = "id, tenant_id, status, visibility, title";

    let { data: jobData, error: jobError } = await supabase
      .from("jobs")
      .select(selectCols)
      .eq("slug", slugOrId)
      .eq("status", "open")
      .eq("visibility", "public")
      .maybeSingle();

    if (jobError) {
      console.error("Error loading job by slug:", jobError);
    }

    if (!jobData) {
      const { data: jobById, error: jobByIdError } = await supabase
        .from("jobs")
        .select(selectCols)
        .eq("id", slugOrId)
        .eq("status", "open")
        .eq("visibility", "public")
        .maybeSingle();

      if (jobByIdError) {
        console.error("Error loading job by id:", jobByIdError);
      }

      jobData = jobById ?? null;
    }

    if (!jobData) {
      return NextResponse.json(
        { error: "Job not found or not accepting applications." },
        { status: 404 }
      );
    }

    const jobId: string = jobData.id;
    const tenantId: string | null = jobData.tenant_id ?? null;

    // ----- 3) Try to find or create a candidate (but don't break if RLS blocks it) -----
    let candidateId: string | null = null;

    if (tenantId && email) {
      try {
        const { data: existing, error: existingError } = await supabase
          .from("candidates")
          .select("id")
          .eq("tenant_id", tenantId)
          .eq("email", email)
          .limit(1);

        if (existingError) {
          console.error("Error looking up candidate:", existingError);
        }

        if (existing && existing.length > 0) {
          candidateId = existing[0].id as string;
        } else {
          const { data: inserted, error: insertError } = await supabase
            .from("candidates")
            .insert({
              tenant_id: tenantId,
              full_name: fullName,
              email,
              phone,
              location,
              linkedin_url: linkedinUrl,
              current_title: null,
              current_company: null,
              cv_url: cvUrl,
              source,
            })
            .select("id")
            .single();

          if (insertError) {
            console.error("Error inserting candidate:", insertError);
          } else if (inserted) {
            candidateId = inserted.id as string;
          }
        }
      } catch (candidateErr) {
        // Never block the application if candidate creation fails
        console.error("Unexpected candidate handling error:", candidateErr);
      }
    }

    const coverCombined = [headline, notes].filter(Boolean).join("\n\n");

    // ----- 4) Create job_application -----
    const { data: insertedApp, error: appError } = await supabase
      .from("job_applications")
      .insert({
        job_id: jobId,
        candidate_id: candidateId,
        full_name: fullName,
        email,
        phone,
        location,
        linkedin_url: linkedinUrl,
        portfolio_url: portfolioUrl,
        cv_url: cvUrl,
        cover_letter: coverCombined || null,
        source,
      })
      .select("id")
      .single();

    if (appError) {
      console.error("Error creating job application:", appError);
      return NextResponse.json(
        { error: "Could not create application." },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        ok: true,
        applicationId: insertedApp?.id ?? null,
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("Unexpected error in POST /api/jobs/[slug]/apply:", err);
    return NextResponse.json(
      { error: "Unexpected error while creating your application." },
      { status: 500 }
    );
  }
}

// Optional: if someone does GET /api/jobs/[slug]/apply, return 405 explicitly
export async function GET() {
  return NextResponse.json(
    { error: "Method not allowed" },
    { status: 405 }
  );
}
