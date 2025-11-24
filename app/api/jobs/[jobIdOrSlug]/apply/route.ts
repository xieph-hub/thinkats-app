// app/api/jobs/[jobIdOrSlug]/apply/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";

type JobRow = {
  id: string;
  tenant_id: string | null;
  slug: string | null;
  status: string | null;
  visibility: string | null;
  internal_only: boolean | null;
};

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    value
  );
}

export async function POST(
  req: NextRequest,
  { params }: { params: { jobIdOrSlug: string } }
) {
  try {
    const identifier = params.jobIdOrSlug;

    if (!identifier) {
      return NextResponse.json(
        { error: "Missing job identifier in URL." },
        { status: 400 }
      );
    }

    // 1) Resolve the job by slug first (public), then by id if it looks like a UUID
    let job: JobRow | null = null;

    const { data: slugData, error: slugError } = await supabaseAdmin
      .from("jobs")
      .select("id, tenant_id, slug, status, visibility, internal_only")
      .eq("slug", identifier)
      .eq("visibility", "public")
      .limit(1);

    if (slugError) {
      console.error("Apply – error looking up job by slug:", slugError);
    }

    job = (slugData?.[0] as JobRow | undefined) || null;

    if (!job && isUuid(identifier)) {
      const { data: idData, error: idError } = await supabaseAdmin
        .from("jobs")
        .select("id, tenant_id, slug, status, visibility, internal_only")
        .eq("id", identifier)
        .eq("visibility", "public")
        .limit(1);

      if (idError) {
        console.error("Apply – error looking up job by id:", idError);
      }

      job = (idData?.[0] as JobRow | undefined) || null;
    }

    if (!job) {
      return NextResponse.json(
        { error: "This role is no longer available or cannot be applied to." },
        { status: 404 }
      );
    }

    if (job.status && job.status !== "open") {
      return NextResponse.json(
        { error: "This role is not currently open for applications." },
        { status: 400 }
      );
    }

    if (job.internal_only) {
      // Extra guard: public endpoint shouldn't accept for internal-only roles
      return NextResponse.json(
        {
          error:
            "This role is restricted and cannot be applied to via the public jobs page.",
        },
        { status: 403 }
      );
    }

    // 2) Parse body (JSON expected from the public apply form)
    const body = await req.json().catch(() => null);

    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { error: "Invalid request body. Expected JSON." },
        { status: 400 }
      );
    }

    // Allow a bit of flexibility in naming coming from the frontend
    const fullName =
      (body.fullName as string | undefined)?.trim() ||
      (body.name as string | undefined)?.trim() ||
      "";
    const email = (body.email as string | undefined)?.trim() || "";
    const phone = (body.phone as string | undefined)?.trim() || null;
    const location =
      (body.location as string | undefined)?.trim() ||
      (body.city as string | undefined)?.trim() ||
      null;
    const cvUrl =
      (body.cvUrl as string | undefined)?.trim() ||
      (body.cv_url as string | undefined)?.trim() ||
      null;
    const source =
      (body.source as string | undefined)?.trim() ||
      (body.source_label as string | undefined)?.trim() ||
      "public_jobs_page";
    const message =
      (body.message as string | undefined)?.trim() ||
      (body.coverLetter as string | undefined)?.trim() ||
      (body.notes as string | undefined)?.trim() ||
      null;

    if (!fullName || !email) {
      return NextResponse.json(
        { error: "Full name and email are required." },
        { status: 400 }
      );
    }

    // 3) Insert into job_applications and link to job & tenant
    const insertPayload: Record<string, unknown> = {
      job_id: job.id,
      tenant_id: job.tenant_id ?? null,
      full_name: fullName,
      email,
      phone,
      location,
      cv_url: cvUrl,
      source,
      message,
      status: "applied",
    };

    const { data: application, error: insertError } = await supabaseAdmin
      .from("job_applications")
      .insert(insertPayload)
      .select("id")
      .single();

    if (insertError || !application) {
      console.error("Apply – error inserting job_application:", insertError);
      return NextResponse.json(
        {
          error:
            "We couldn't submit your application. Please try again or email your CV directly.",
        },
        { status: 500 }
      );
    }

    // 4) Success – frontend can show the "Thank you" state
    return NextResponse.json(
      {
        success: true,
        applicationId: application.id as string,
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("Apply – unexpected error:", err);
    return NextResponse.json(
      {
        error:
          "We couldn't submit your application. Please try again or email your CV directly.",
      },
      { status: 500 }
    );
  }
}
