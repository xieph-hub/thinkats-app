// app/api/jobs/[slug]/apply/route.ts

import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";

// Tiny helper – safely read string from formData
function asString(value: FormDataEntryValue | null): string {
  return typeof value === "string" ? value.trim() : "";
}

// Basic UUID check so we don’t break Supabase when value is a slug
function looksLikeUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    value
  );
}

export async function POST(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const formData = await req.formData();

    // --- 1) Read inputs from the form ---
    const jobIdFromForm = asString(formData.get("job_id"));
    const fullName = asString(formData.get("full_name"));
    const email = asString(formData.get("email"));
    const phone = asString(formData.get("phone"));
    const location = asString(formData.get("location"));
    const linkedinUrl = asString(formData.get("linkedin_url"));
    const portfolioUrl = asString(formData.get("portfolio_url"));
    const coverLetter = asString(formData.get("cover_letter"));
    const source =
      asString(formData.get("source")) || "careers_site"; // default

    // Required fields
    if (!fullName || !email) {
      return NextResponse.json(
        { error: "Missing required fields: full_name and email" },
        { status: 400 }
      );
    }

    // --- 2) Find the job in `jobs` table ---
    const slugFromUrl = params.slug;
    let job: { id: string; slug: string | null; status: string; visibility: string } | null =
      null;

    // 2a. Try by job_id from the form if it looks like a UUID
    if (jobIdFromForm && looksLikeUuid(jobIdFromForm)) {
      const { data, error } = await supabaseAdmin
        .from("jobs")
        .select("id, slug, status, visibility")
        .eq("id", jobIdFromForm)
        .limit(1);

      if (error) {
        console.error("Error fetching job by id:", error);
        return NextResponse.json(
          { error: "Failed to verify job (by id)." },
          { status: 500 }
        );
      }

      if (data && data.length > 0) {
        job = data[0] as any;
      }
    }

    // 2b. If still not found, try by slug from the URL
    if (!job) {
      const { data, error } = await supabaseAdmin
        .from("jobs")
        .select("id, slug, status, visibility")
        .eq("slug", slugFromUrl)
        .limit(1);

      if (error) {
        console.error("Error fetching job by slug:", error);
        return NextResponse.json(
          { error: "Failed to verify job (by slug)." },
          { status: 500 }
        );
      }

      if (data && data.length > 0) {
        job = data[0] as any;
      }
    }

    if (!job) {
      console.warn("Job not found for apply request", {
        jobIdFromForm,
        slugFromUrl,
      });
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    // Optional: enforce only open + public jobs are apply-able
    if (job.status !== "open" || job.visibility !== "public") {
      return NextResponse.json(
        { error: "Job is not open for applications." },
        { status: 400 }
      );
    }

    // --- 3) (For now) ignore file upload; cv_url = null ---
    const cvUrl: string | null = null;

    // --- 4) Insert into job_applications ---
    const { error: insertError } = await supabaseAdmin
      .from("job_applications")
      .insert({
        job_id: job.id,
        candidate_id: null,
        full_name: fullName,
        email,
        phone: phone || null,
        location: location || null,
        linkedin_url: linkedinUrl || null,
        portfolio_url: portfolioUrl || null,
        cv_url: cvUrl,
        cover_letter: coverLetter || null,
        source,
        // stage, status, created_at, updated_at use defaults
      });

    if (insertError) {
      console.error("Error inserting into job_applications:", insertError);
      return NextResponse.json(
        { error: "Failed to submit application." },
        { status: 500 }
      );
    }

    // --- 5) Redirect back to job page with success flag ---
    const slugOrId = job.slug || job.id;
    const redirectUrl = new URL(
      `/jobs/${slugOrId}?applied=1`,
      req.nextUrl.origin
    );

    return NextResponse.redirect(redirectUrl, 302);
  } catch (err) {
    console.error("Unexpected error in POST /api/jobs/[slug]/apply:", err);
    return NextResponse.json(
      { error: "Unexpected error submitting application." },
      { status: 500 }
    );
  }
}
