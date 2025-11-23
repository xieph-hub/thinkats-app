// app/api/jobs/[slug]/apply/route.ts

import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    value
  );
}

export async function POST(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const slugOrId = params.slug;

    // 1) Find the open, public job by slug OR id
    let jobQuery = supabaseAdmin
      .from("jobs")
      .select("id, tenant_id, status, visibility")
      .eq("status", "open")
      .eq("visibility", "public")
      .limit(1);

    if (isUuid(slugOrId)) {
      jobQuery = jobQuery.eq("id", slugOrId);
    } else {
      jobQuery = jobQuery.eq("slug", slugOrId);
    }

    const { data: job, error: jobError } = await jobQuery.maybeSingle();

    if (jobError || !job) {
      console.error("Public apply: job not found", {
        slugOrId,
        jobError,
      });
      return NextResponse.json(
        { error: "Job not found or not open." },
        { status: 404 }
      );
    }

    const body = await req.json().catch(() => null);

    if (!body || typeof body !== "object") {
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
      source,
    } = body as {
      fullName?: string;
      email?: string;
      phone?: string;
      location?: string;
      linkedinUrl?: string;
      portfolioUrl?: string;
      cvUrl?: string;
      coverLetter?: string;
      source?: string;
    };

    if (!fullName || !email) {
      return NextResponse.json(
        { error: "Full name and email are required." },
        { status: 400 }
      );
    }

    const trimmedFullName = fullName.trim();
    const trimmedEmail = email.trim();

    // 2) Ensure a candidate exists for (tenant_id, email)
    let candidateId: string | null = null;

    const {
      data: existingCandidate,
      error: existingCandidateError,
    } = await supabaseAdmin
      .from("candidates")
      .select("id")
      .eq("tenant_id", job.tenant_id)
      .eq("email", trimmedEmail)
      .maybeSingle();

    if (existingCandidateError) {
      console.error("Public apply: error checking candidate", {
        tenantId: job.tenant_id,
        email: trimmedEmail,
        existingCandidateError,
      });
    }

    if (existingCandidate?.id) {
      candidateId = existingCandidate.id;
    } else {
      const {
        data: newCandidate,
        error: createCandidateError,
      } = await supabaseAdmin
        .from("candidates")
        .insert({
          tenant_id: job.tenant_id,
          full_name: trimmedFullName,
          email: trimmedEmail,
          phone: phone || null,
          location: location || null,
          linkedin_url: linkedinUrl || null,
          current_title: null,
          current_company: null,
          cv_url: cvUrl || null,
          source: source || "Website",
        })
        .select("id")
        .single();

      if (createCandidateError || !newCandidate) {
        console.error("Public apply: failed to create candidate", {
          tenantId: job.tenant_id,
          email: trimmedEmail,
          createCandidateError,
        });
        return NextResponse.json(
          { error: "Could not save candidate profile." },
          { status: 500 }
        );
      }

      candidateId = newCandidate.id;
    }

    // 3) Create job_application
    const {
      data: application,
      error: applicationError,
    } = await supabaseAdmin
      .from("job_applications")
      .insert({
        job_id: job.id,
        candidate_id: candidateId,
        full_name: trimmedFullName,
        email: trimmedEmail,
        phone: phone || null,
        location: location || null,
        linkedin_url: linkedinUrl || null,
        portfolio_url: portfolioUrl || null,
        cv_url: cvUrl || null,
        cover_letter: coverLetter || null,
        source: source || "Website",
        // stage/status can use DB defaults
      })
      .select("id")
      .single();

    if (applicationError || !application) {
      console.error("Public apply: failed to create job_application", {
        jobId: job.id,
        candidateId,
        applicationError,
      });
      return NextResponse.json(
        { error: "Could not save job application." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      applicationId: application.id,
    });
  } catch (err) {
    console.error("Public apply: unexpected error", err);
    return NextResponse.json(
      { error: "Unexpected error while submitting application." },
      { status: 500 }
    );
  }
}
