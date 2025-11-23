// app/api/jobs/[slug]/apply/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Safety check – avoid crashing with undefined env
function getSupabaseAdmin() {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("Supabase env vars are missing in /api/jobs/[slug]/apply");
  }

  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });
}

type RouteContext = {
  params: { slug: string };
};

export async function POST(req: NextRequest, context: RouteContext) {
  const { slug } = context.params;

  try {
    const supabase = getSupabaseAdmin();

    // -----------------------------
    // 1) Find an open, public job by slug OR id
    // -----------------------------
    const slugOrId = slug;

    const selectJobCols =
      "id, tenant_id, title, status, visibility";

    // First try by slug
    let { data: jobsBySlug, error: jobBySlugError } = await supabase
      .from("jobs")
      .select(selectJobCols)
      .eq("slug", slugOrId)
      .eq("status", "open")
      .eq("visibility", "public")
      .limit(1);

    if (jobBySlugError) {
      console.error("Error looking up job by slug:", jobBySlugError);
    }

    let jobRow = jobsBySlug && jobsBySlug.length > 0 ? jobsBySlug[0] : null;

    // Fallback: try by id
    if (!jobRow) {
      const { data: jobsById, error: jobByIdError } = await supabase
        .from("jobs")
        .select(selectJobCols)
        .eq("id", slugOrId)
        .eq("status", "open")
        .eq("visibility", "public")
        .limit(1);

      if (jobByIdError) {
        console.error("Error looking up job by id:", jobByIdError);
      }

      if (jobsById && jobsById.length > 0) {
        jobRow = jobsById[0];
      }
    }

    if (!jobRow) {
      return NextResponse.json(
        { error: "Job not found or not open/public." },
        { status: 404 }
      );
    }

    const jobId: string = jobRow.id;
    const tenantId: string = jobRow.tenant_id;

    // -----------------------------
    // 2) Parse body (support both ApplyForm + JobApplyForm shapes)
    // -----------------------------
    let body: any;
    try {
      body = await req.json();
    } catch (err) {
      console.error("Failed to parse JSON body in job apply route:", err);
      return NextResponse.json(
        { error: "Invalid request body." },
        { status: 400 }
      );
    }

    // Support multiple naming conventions
    const fullName: string | undefined =
      body.fullName || body.full_name || undefined;
    const email: string | undefined = body.email || undefined;
    const phone: string | null =
      body.phone && String(body.phone).trim().length > 0
        ? String(body.phone).trim()
        : null;
    const location: string | null =
      body.location && String(body.location).trim().length > 0
        ? String(body.location).trim()
        : null;

    const linkedinUrl: string | null =
      body.linkedinUrl ||
      body.linkedin_url ||
      null;

    const portfolioUrl: string | null =
      body.portfolioUrl ||
      body.portfolio_url ||
      null;

    // CV URL can be from:
    // - Manual link (ApplyForm / JobApplyForm)
    // - Previously uploaded Supabase Storage URL (JobApplyForm)
    const cvUrl: string | null =
      body.cvUrl ||
      body.cv_url ||
      null;

    // Cover letter / notes / headline
    const coverLetter: string | null =
      body.coverLetter ||
      body.notes ||
      null;

    const source: string =
      body.source ||
      "Website";

    if (!fullName || !email) {
      return NextResponse.json(
        { error: "Full name and email are required." },
        { status: 400 }
      );
    }

    // -----------------------------
    // 3) Find or create candidate in `candidates`
    // -----------------------------
    let candidateId: string | null = null;

    // 3a) Try to find existing candidate by (tenant_id, email)
    const {
      data: existingCandidates,
      error: existingCandError,
    } = await supabase
      .from("candidates")
      .select("id, cv_url")
      .eq("tenant_id", tenantId)
      .eq("email", email)
      .limit(1);

    if (existingCandError) {
      console.error("Error querying existing candidate:", existingCandError);
      // We won't fail the whole request yet; we'll still try to create a new one.
    }

    if (existingCandidates && existingCandidates.length > 0) {
      const existing = existingCandidates[0];
      candidateId = existing.id;

      // Optionally update candidate.cv_url if they didn't have one before and we now have one
      if (!existing.cv_url && cvUrl) {
        const { error: updateCandError } = await supabase
          .from("candidates")
          .update({ cv_url: cvUrl })
          .eq("id", existing.id);

        if (updateCandError) {
          console.error("Error updating candidate cv_url:", updateCandError);
        }
      }
    } else {
      // 3b) Create new candidate
      const { data: newCandidate, error: createCandError } = await supabase
        .from("candidates")
        .insert({
          tenant_id: tenantId,
          full_name: fullName,
          email,
          phone,
          location,
          linkedin_url: linkedinUrl,
          current_title: null, // can wire to "headline" later
          current_company: null,
          cv_url: cvUrl,
          source,
        })
        .select("id")
        .single();

      if (createCandError || !newCandidate) {
        console.error("Error creating candidate record:", createCandError);
        return NextResponse.json(
          { error: "Could not create candidate record." },
          { status: 500 }
        );
      }

      candidateId = newCandidate.id;
    }

    // -----------------------------
    // 4) Create job_application linked to candidate
    // -----------------------------
    const { data: application, error: appError } = await supabase
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
        cover_letter: coverLetter,
        source,
        // stage + status will use defaults: 'APPLIED' / 'PENDING'
      })
      .select("id")
      .single();

    if (appError || !application) {
      console.error("Error creating job application:", appError);
      return NextResponse.json(
        { error: "Could not create application record." },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { ok: true, applicationId: application.id },
      { status: 201 }
    );
  } catch (err) {
    console.error("Unexpected error in /api/jobs/[slug]/apply:", err);
    return NextResponse.json(
      { error: "Unexpected error while creating your application. Please try again." },
      { status: 500 }
    );
  }
}
