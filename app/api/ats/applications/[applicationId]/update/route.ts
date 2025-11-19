// app/api/ats/applications/[applicationId]/update/route.ts
import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabaseServerClient";
import { getCurrentUserAndTenants } from "@/lib/getCurrentUserAndTenants";

type RouteParams = {
  params: {
    applicationId: string;
  };
};

export async function POST(req: Request, { params }: RouteParams) {
  const applicationId = params.applicationId;

  if (!applicationId) {
    return NextResponse.json(
      { error: "Missing applicationId in URL." },
      { status: 400 }
    );
  }

  // 1) Make sure user is logged in and has a current tenant
  const { user, currentTenant } = await getCurrentUserAndTenants();
  if (!user) {
    return NextResponse.json(
      { error: "Not authenticated." },
      { status: 401 }
    );
  }

  if (!currentTenant) {
    return NextResponse.json(
      { error: "No ATS tenant linked to this user." },
      { status: 403 }
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

  const { stage, status } = body || {};

  if (!stage && !status) {
    return NextResponse.json(
      { error: "Nothing to update." },
      { status: 400 }
    );
  }

  const supabase = await createSupabaseServerClient();

  // 2) Load the application first to find its job & tenant
  const { data: appRow, error: appError } = await supabase
    .from("job_applications")
    .select("id, job_id")
    .eq("id", applicationId)
    .single();

  if (appError || !appRow) {
    console.error("Application not found", appError);
    return NextResponse.json(
      { error: "Application not found." },
      { status: 404 }
    );
  }

  // 3) Check the job belongs to the current tenant
  const { data: jobRow, error: jobError } = await supabase
    .from("jobs")
    .select("id, tenant_id")
    .eq("id", appRow.job_id)
    .single();

  if (jobError || !jobRow) {
    console.error("Job not found for application", jobError);
    return NextResponse.json(
      { error: "Job not found for this application." },
      { status: 404 }
    );
  }

  if (jobRow.tenant_id !== currentTenant.id) {
    return NextResponse.json(
      { error: "You do not have access to this application." },
      { status: 403 }
    );
  }

  // 4) Perform the update
  const updatePayload: Record<string, string> = {};
  if (stage) updatePayload.stage = stage;
  if (status) updatePayload.status = status;

  const { error: updateError } = await supabase
    .from("job_applications")
    .update(updatePayload)
    .eq("id", applicationId);

  if (updateError) {
    console.error("Error updating application", updateError);
    return NextResponse.json(
      { error: "Could not update application." },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}
