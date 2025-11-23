// app/api/jobs/[slug]/apply/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabaseServerClient";

// This route accepts JSON only (NOT form-data)
// It is called by the React ApplyForm via fetch()
export async function POST(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const slugOrId = params.slug;

    const body = await req.json().catch(() => null);

    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { error: "Invalid request body." },
        { status: 400 }
      );
    }

    const {
      fullName,
      email,
      phone,
      location,
      linkedinUrl,
      portfolioUrl,
      cvUrl,
      coverLetter,
      source,
    } = body as {
      fullName?: string;
      email?: string;
      phone?: string | null;
      location?: string | null;
      linkedinUrl?: string | null;
      portfolioUrl?: string | null;
      cvUrl?: string | null;
      coverLetter?: string | null;
      source?: string | null;
    };

    if (!fullName || !email) {
      return NextResponse.json(
        { error: "Full name and email are required." },
        { status: 400 }
      );
    }

    const supabase = await createSupabaseServerClient();

    // -------- 1) Find an OPEN, PUBLIC job by slug OR id --------
    const selectCols = `
      id,
      slug,
      status,
      visibility
    `;

    let { data: bySlug, error: slugError } = await supabase
      .from("jobs")
      .select(selectCols)
      .eq("slug", slugOrId)
      .eq("status", "open")
      .eq("visibility", "public")
      .limit(1);

    if (slugError) {
      console.error("Error querying job by slug in apply API:", slugError);
    }

    let jobRow = bySlug?.[0];

    if (!jobRow) {
      const { data: byId, error: idError } = await supabase
        .from("jobs")
        .select(selectCols)
        .eq("id", slugOrId)
        .eq("status", "open")
        .eq("visibility", "public")
        .limit(1);

      if (idError) {
        console.error("Error querying job by id in apply API:", idError);
      }

      jobRow = byId?.[0];
    }

    if (!jobRow) {
      return NextResponse.json(
        { error: "Job not found or not open/public." },
        { status: 404 }
      );
    }

    const jobId = jobRow.id as string;

    // -------- 2) Insert job_application --------
    const { data: inserted, error: insertError } = await supabase
      .from("job_applications")
      .insert({
        job_id: jobId,
        full_name: fullName,
        email,
        phone: phone ?? null,
        location: location ?? null,
        linkedin_url: linkedinUrl ?? null,
        portfolio_url: portfolioUrl ?? null,
        cv_url: cvUrl ?? null, // simple link for now
        cover_letter: coverLetter ?? null,
        source: source ?? "Website",
        stage: "APPLIED",
        status: "PENDING",
      })
      .select("id")
      .single();

    if (insertError) {
      console.error("Error inserting job_application:", insertError);
      return NextResponse.json(
        {
          error:
            "Unexpected error while creating your application. Please try again.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { ok: true, applicationId: inserted.id },
      { status: 200 }
    );
  } catch (err) {
    console.error("Apply API error:", err);
    return NextResponse.json(
      { error: "Unexpected error while submitting application." },
      { status: 500 }
    );
  }
}
