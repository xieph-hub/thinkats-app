// app/api/jobs/[slug]/apply/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

type RouteParams = {
  params: { slug: string };
};

export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const slugOrId = params.slug;

    let body: any;
    try {
      body = await req.json();
    } catch {
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
      headline,
      notes,
      source,
    } = body ?? {};

    if (!fullName || !email) {
      return NextResponse.json(
        { error: "Full name and email are required." },
        { status: 400 }
      );
    }

    // Combine any long-form text fields into cover_letter
    const combinedCoverLetter: string | null =
      (typeof coverLetter === "string" && coverLetter.trim().length > 0
        ? coverLetter.trim()
        : null) ??
      (typeof notes === "string" && notes.trim().length > 0
        ? notes.trim()
        : null) ??
      (typeof headline === "string" && headline.trim().length > 0
        ? headline.trim()
        : null) ??
      null;

    // 1) Look up an open, public job by slug OR id
    const { data: jobs, error: jobError } = await supabaseAdmin
      .from("jobs")
      .select("id,status,visibility")
      .or(`slug.eq.${slugOrId},id.eq.${slugOrId}`)
      .limit(1);

    if (jobError) {
      console.error("Job lookup error in /api/jobs/[slug]/apply:", jobError);
      return NextResponse.json(
        { error: "Could not look up job." },
        { status: 500 }
      );
    }

    const job = jobs?.[0];

    if (!job) {
      return NextResponse.json(
        { error: "Job not found." },
        { status: 404 }
      );
    }

    if (job.status !== "open" || job.visibility !== "public") {
      return NextResponse.json(
        { error: "This job is not accepting applications." },
        { status: 400 }
      );
    }

    // 2) Insert into job_applications
    const { data: inserted, error: insertError } = await supabaseAdmin
      .from("job_applications")
      .insert({
        job_id: job.id,
        // candidate_id stays null for now (we’ll wire it later)
        full_name: fullName,
        email,
        phone: phone || null,
        location: location || null,
        linkedin_url: linkedinUrl || null,
        portfolio_url: portfolioUrl || null,
        cv_url: cvUrl || null,
        cover_letter: combinedCoverLetter,
        source: source || "Website",
      })
      .select("id")
      .single();

    if (insertError) {
      console.error(
        "Application insert error in /api/jobs/[slug]/apply:",
        insertError
      );
      return NextResponse.json(
        { error: "Could not create job application." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      applicationId: inserted?.id ?? null,
    });
  } catch (err) {
    console.error(
      "Unexpected error in /api/jobs/[slug]/apply:",
      err
    );
    return NextResponse.json(
      { error: "Unexpected error while submitting application." },
      { status: 500 }
    );
  }
}

// Optional: explicitly 405 anything else
export function GET() {
  return NextResponse.json(
    { error: "Method not allowed." },
    { status: 405 }
  );
}
