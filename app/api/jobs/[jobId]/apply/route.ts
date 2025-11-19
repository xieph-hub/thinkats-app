// app/api/jobs/[jobId]/apply/route.ts
import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabaseServerClient";

type Params = {
  params: {
    jobId: string;
  };
};

export async function POST(req: Request, { params }: Params) {
  const supabase = await createSupabaseServerClient();
  const jobId = params.jobId;

  if (!jobId) {
    return NextResponse.json(
      { error: "Missing jobId in URL" },
      { status: 400 }
    );
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
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
  } = body || {};

  if (!fullName || !email) {
    return NextResponse.json(
      { error: "Full name and email are required." },
      { status: 400 }
    );
  }

  // Optional: verify the job exists
  const { data: job, error: jobError } = await supabase
    .from("jobs")
    .select("id")
    .eq("id", jobId)
    .single();

  if (jobError || !job) {
    return NextResponse.json(
      { error: "Job not found." },
      { status: 404 }
    );
  }

  const { error: insertError } = await supabase
    .from("job_applications")
    .insert({
      job_id: jobId,
      full_name: fullName,
      email,
      phone: phone ?? null,
      location: location ?? null,
      linkedin_url: linkedinUrl ?? null,
      portfolio_url: portfolioUrl ?? null,
      cv_url: cvUrl ?? null,
      cover_letter: coverLetter ?? null,
      source: source ?? "Website",
      // stage/status default in DB
    });

  if (insertError) {
    console.error(
      "Error inserting job application",
      insertError
    );
    return NextResponse.json(
      { error: "Could not submit application." },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}
