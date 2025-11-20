// app/api/jobs/[slug]/apply/route.ts

import { NextRequest, NextResponse } from "next/server";
import supabaseAdmin from "@/lib/supabaseAdmin";

export async function POST(
  req: NextRequest,
  context: { params: { slug: string } }
) {
  const { slug } = context.params;
  const supabase = supabaseAdmin as any;

  try {
    // 1) Find the job by slug, fall back to id if needed
    let job: any = null;

    // Try by slug
    {
      const { data, error } = await supabase
        .from("jobs")
        .select("id, tenant_id, title")
        .eq("slug", slug)
        .limit(1);

      if (error) {
        console.error("Error fetching job by slug in apply route:", error);
      }

      if (data && data.length > 0) {
        job = data[0];
      }
    }

    // Try by id if not found by slug
    if (!job) {
      const { data, error } = await supabase
        .from("jobs")
        .select("id, tenant_id, title")
        .eq("id", slug)
        .limit(1);

      if (error) {
        console.error("Error fetching job by id in apply route:", error);
      }

      if (data && data.length > 0) {
        job = data[0];
      }
    }

    if (!job) {
      return NextResponse.json(
        { ok: false, message: "Job not found" },
        { status: 404 }
      );
    }

    // 2) Read payload (JSON or form-data)
    let raw: any = null;

    // Try JSON first
    try {
      raw = await req.json();
    } catch {
      // Then try formData (from HTML <form>)
      try {
        const formData = await req.formData();
        raw = Object.fromEntries(formData.entries());
      } catch {
        raw = null;
      }
    }

    if (!raw) {
      return NextResponse.json(
        { ok: false, message: "Invalid request body" },
        { status: 400 }
      );
    }

    // Normalise fields (accept snake_case and camelCase)
    const fullNameRaw = raw.full_name ?? raw.fullName ?? "";
    const emailRaw = raw.email ?? "";
    const phoneRaw = raw.phone ?? null;
    const locationRaw = raw.location ?? null;
    const linkedinRaw = raw.linkedin_url ?? raw.linkedinUrl ?? null;
    const portfolioRaw = raw.portfolio_url ?? raw.portfolioUrl ?? null;
    const cvRaw = raw.cv_url ?? raw.cvUrl ?? null;
    const coverRaw = raw.cover_letter ?? raw.coverLetter ?? null;
    const sourceRaw = raw.source ?? "Website";

    const full_name = String(fullNameRaw).trim();
    const email = String(emailRaw).trim().toLowerCase();
    const phone = phoneRaw ? String(phoneRaw).trim() : null;
    const location = locationRaw ? String(locationRaw).trim() : null;
    const linkedin_url = linkedinRaw ? String(linkedinRaw).trim() : null;
    const portfolio_url = portfolioRaw ? String(portfolioRaw).trim() : null;
    const cv_url = cvRaw ? String(cvRaw).trim() : null;
    const cover_letter = coverRaw ? String(coverRaw).trim() : null;
    const source = String(sourceRaw).trim() || "Website";

    if (!full_name || !email) {
      return NextResponse.json(
        {
          ok: false,
          message: "Missing required fields: full_name and email",
        },
        { status: 400 }
      );
    }

    // 3) Insert into job_applications
    const { error: insertError } = await supabase
      .from("job_applications")
      .insert({
        job_id: job.id,
        candidate_id: null, // can be wired to candidates table later
        full_name,
        email,
        phone,
        location,
        linkedin_url,
        portfolio_url,
        cv_url,
        cover_letter,
        source,
        stage: "APPLIED", // default
        status: "PENDING", // default
      });

    if (insertError) {
      console.error("Error inserting job_application:", insertError);
      return NextResponse.json(
        {
          ok: false,
          message: "Failed to create application",
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        ok: true,
        message: "Application submitted successfully",
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("Unexpected error in job apply route:", err);
    return NextResponse.json(
      {
        ok: false,
        message: "Unexpected error while submitting application",
      },
      { status: 500 }
    );
  }
}
