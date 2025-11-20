// app/api/jobs/[slug]/apply/route.ts

import { NextRequest, NextResponse } from "next/server";
import supabaseAdmin from "@/lib/supabaseAdmin";

type ApplyBody = {
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

export async function POST(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    let body: ApplyBody | null = null;

    try {
      body = (await req.json()) as ApplyBody;
    } catch (err) {
      return NextResponse.json(
        { error: "Invalid JSON body." },
        { status: 400 }
      );
    }

    const fullName = body.fullName?.trim();
    const email = body.email?.trim();

    if (!fullName || !email) {
      return NextResponse.json(
        { error: "Full name and email are required." },
        { status: 400 }
      );
    }

    // 1) Find the job by slug
    const { data: job, error: jobError } = await supabaseAdmin
      .from("jobs")
      .select("id, status, visibility")
      .eq("slug", params.slug)
      .single();

    if (jobError || !job) {
      console.error("Job not found for apply", jobError);
      return NextResponse.json(
        { error: "Job not found or no longer accepting applications." },
        { status: 404 }
      );
    }

    if (job.status !== "open" || job.visibility !== "public") {
      return NextResponse.json(
        { error: "This job is not currently accepting applications." },
        { status: 400 }
      );
    }

    // 2) Insert into job_applications
    const { error: insertError } = await supabaseAdmin
      .from("job_applications")
      .insert({
        job_id: job.id,
        candidate_id: null,
        full_name: fullName,
        email,
        phone: body.phone || null,
        location: body.location || null,
        linkedin_url: body.linkedinUrl || null,
        portfolio_url: body.portfolioUrl || null,
        cv_url: body.cvUrl || null,
        cover_letter: body.coverLetter || null,
        source: body.source || "Website",
        // stage/status will use table defaults: APPLIED / PENDING
      });

    if (insertError) {
      console.error("Error inserting job application", insertError);
      return NextResponse.json(
        { error: "Failed to submit application. Please try again later." },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (err) {
    console.error("Unexpected error in job apply route", err);
    return NextResponse.json(
      { error: "Unexpected error. Please try again." },
      { status: 500 }
    );
  }
}
