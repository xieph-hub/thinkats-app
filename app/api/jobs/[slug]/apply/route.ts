// app/api/jobs/[slug]/apply/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(
  req: NextRequest,
  context: { params: { slug: string } }
) {
  try {
    const slugOrId = decodeURIComponent(context.params.slug);

    const body = await req.json();

    const jobSlug = (body.jobSlug ?? "").toString().trim();
    const fullName = (body.fullName ?? "").toString().trim();
    const email = (body.email ?? "").toString().trim().toLowerCase();
    const phone =
      (body.phone ?? "").toString().trim() || null;
    const location =
      (body.location ?? "").toString().trim() || null;
    const linkedinUrl =
      (body.linkedinUrl ?? "").toString().trim() || null;
    const portfolioUrl =
      (body.portfolioUrl ?? "").toString().trim() || null;
    const cvUrl =
      (body.cvUrl ?? "").toString().trim() || null;

    // You were collecting these as "headline" + "notes" on the form.
    // We'll merge them into one cover_letter for now.
    const headline =
      (body.headline ?? "").toString().trim() || "";
    const notes =
      (body.notes ?? "").toString().trim() || "";
    const coverLetter =
      (headline || notes) ? `${headline}\n\n${notes}`.trim() : null;

    const source = "Website";

    if (!fullName || !email) {
      return NextResponse.json(
        { error: "Full name and email are required." },
        { status: 400 }
      );
    }

    // Optional: sanity check that the slug in the URL and payload line up.
    if (jobSlug && jobSlug !== slugOrId) {
      console.warn(
        "Job slug mismatch between URL and payload",
        { urlSlug: slugOrId, bodySlug: jobSlug }
      );
    }

    // 1) Find an OPEN, PUBLIC job by slug OR id
    let jobRow: any | null = null;

    // 1a. Try by slug
    {
      const { data, error } = await supabaseAdmin
        .from("jobs")
        .select(
          "id, tenant_id, title, status, visibility"
        )
        .eq("slug", slugOrId)
        .eq("status", "open")
        .eq("visibility", "public")
        .limit(1);

      if (error) {
        console.error("Error loading job by slug", error);
      }

      if (data && data.length > 0) {
        jobRow = data[0];
      }
    }

    // 1b. If not found, try by id
    if (!jobRow) {
      const { data, error } = await supabaseAdmin
        .from("jobs")
        .select(
          "id, tenant_id, title, status, visibility"
        )
        .eq("id", slugOrId)
        .eq("status", "open")
        .eq("visibility", "public")
        .limit(1);

      if (error) {
        console.error("Error loading job by id", error);
      }

      if (data && data.length > 0) {
        jobRow = data[0];
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

    // 2) Upsert candidate (per tenant + email)
    let candidateId: string | null = null;

    // 2a. Check if candidate already exists for this tenant + email
    const { data: existingCandidates, error: existingError } =
      await supabaseAdmin
        .from("candidates")
        .select("id")
        .eq("tenant_id", tenantId)
        .eq("email", email)
        .limit(1);

    if (existingError) {
      console.error(
        "Error checking existing candidate",
        existingError
      );
    }

    if (existingCandidates && existingCandidates.length > 0) {
      candidateId = existingCandidates[0].id as string;
    } else {
      // 2b. Create a new candidate
      const { data: newCandidate, error: createCandError } =
        await supabaseAdmin
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

      if (createCandError) {
        console.error(
          "Error creating candidate record",
          createCandError
        );
        return NextResponse.json(
          { error: "Could not create candidate record." },
          { status: 500 }
        );
      }

      candidateId = newCandidate?.id ?? null;
    }

    // 3) Create job_application row linked to this candidate
    const { data: application, error: appError } =
      await supabaseAdmin
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
          // stage & status default to APPLIED / PENDING in DB, but it's fine
          // to be explicit if you prefer:
          stage: "APPLIED",
          status: "PENDING",
        })
        .select("id")
        .single();

    if (appError || !application) {
      console.error(
        "Error creating job application",
        appError
      );
      return NextResponse.json(
        {
          error:
            "Unexpected error while creating your application. Please try again.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        ok: true,
        applicationId: application.id,
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("Job application handler error", err);
    return NextResponse.json(
      {
        error:
          "Unexpected error while submitting application.",
      },
      { status: 500 }
    );
  }
}
