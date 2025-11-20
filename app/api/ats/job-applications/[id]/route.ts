// app/api/ats/job-applications/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

// Small helper to map DB row (snake_case) → UI shape (camelCase)
function mapApplicationRow(row: any) {
  return {
    id: row.id,
    fullName: row.full_name,
    email: row.email,
    phone: row.phone,
    location: row.location,
    linkedinUrl: row.linkedin_url,
    portfolioUrl: row.portfolio_url,
    cvUrl: row.cv_url,
    coverLetter: row.cover_letter,
    source: row.source,
    stage: row.stage,
    status: row.status,
    createdAt: row.created_at,
  };
}

// PATCH /api/ats/job-applications/:id
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = params.id;

  if (!id) {
    return NextResponse.json(
      { error: "Missing application id in URL" },
      { status: 400 }
    );
  }

  let body: any = null;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  const { stage, status } = body || {};

  if (!stage && !status) {
    return NextResponse.json(
      { error: "No changes provided (stage or status required)" },
      { status: 400 }
    );
  }

  const updatePayload: Record<string, any> = {
    updated_at: new Date().toISOString(),
  };
  if (stage) updatePayload.stage = stage;
  if (status) updatePayload.status = status;

  const { data, error } = await supabaseAdmin
    .from("job_applications")
    .update(updatePayload)
    .eq("id", id)
    .select(
      `
        id,
        full_name,
        email,
        phone,
        location,
        linkedin_url,
        portfolio_url,
        cv_url,
        cover_letter,
        source,
        stage,
        status,
        created_at
      `
    )
    .single();

  if (error || !data) {
    console.error("Error updating job_application", error);
    return NextResponse.json(
      { error: "Could not update application" },
      { status: 500 }
    );
  }

  const application = mapApplicationRow(data);

  return NextResponse.json({ application });
}
