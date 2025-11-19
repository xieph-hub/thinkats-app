// app/api/jobs/[jobId]/apply/route.ts
import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabaseServerClient";

const RESOURCIN_TENANT_ID = "54286a10-0503-409b-a9d4-a324e9283c1c";

type RouteParams = {
  params: {
    jobId: string;
  };
};

export async function POST(req: Request, { params }: RouteParams) {
  const jobId = params.jobId;

  if (!jobId) {
    return NextResponse.json(
      { error: "Missing jobId in URL." },
      { status: 400 }
    );
  }

  const supabase = await createSupabaseServerClient();

  // 1) Make sure the job exists and belongs to the Resourcin tenant
  const { data: job, error: jobError } = await supabase
    .from("jobs")
    .select("id, tenant_id, is_published")
    .eq("id", jobId)
    .eq("tenant_id", RESOURCIN_TENANT_ID)
    .eq("is_published", true)
    .single();

  if (jobError || !job) {
    console.error("Job not found for public apply", jobError);
    return NextResponse.json(
      { error: "Job not found or not accepting applications." },
      { status: 404 }
    );
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body." },
      { status: 400 }
    );
  }

  const {
    full_name,
    email,
    phone,
    location,
    linkedin_url,
    portfolio_url,
    cover_letter,
    source,
  } = body || {};

  if (!full_name || !email) {
    return NextResponse.json(
      { error: "full_name and email are required." },
      { status: 400 }
    );
  }

  const { error: insertError } = await supabase
    .from("job_applications")
    .insert({
      job_id: jobId,
      full_name,
      email,
      phone,
      location,
      linkedin_url,
      portfolio_url,
      cover_letter,
      source: source || "Resourcin job board",
      stage: "APPLIED",
      status: "PENDING",
    });

  if (insertError) {
    console.error("Error inserting job application", insertError);
    return NextResponse.json(
      { error: "Could not submit application." },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}
