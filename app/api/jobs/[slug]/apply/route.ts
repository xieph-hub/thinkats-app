// app/api/jobs/[slug]/apply/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_SERVICE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    if (!SUPABASE_URL || !SUPABASE_KEY) {
      console.error("Supabase env vars are missing", {
        hasUrl: !!SUPABASE_URL,
        hasKey: !!SUPABASE_KEY,
      });
      return NextResponse.json(
        { error: "Server is not fully configured for Supabase." },
        { status: 500 }
      );
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
      auth: { persistSession: false },
    });

    // Parse JSON body
    let body: any = null;
    try {
      body = await req.json();
    } catch (parseErr) {
      console.error("Apply route JSON parse error:", parseErr);
      return NextResponse.json(
        { error: "Invalid JSON body." },
        { status: 400 }
      );
    }

    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { error: "Invalid request body." },
        { status: 400 }
      );
    }

    const {
      jobSlug,
      fullName,
      email,
      phone,
      location,
      linkedinUrl,
      portfolioUrl,
      cvUrl,
      headline,
      notes,
      coverLetter,
      source,
    } = body;

    if (!fullName || !email) {
      return NextResponse.json(
        { error: "Full name and email are required." },
        { status: 400 }
      );
    }

    const slugOrId = (jobSlug || params.slug || "").trim();
    if (!slugOrId) {
      return NextResponse.json(
        { error: "Missing job identifier." },
        { status: 400 }
      );
    }

    // --- Resolve job id (must be open + public) ---
    let jobRowId: string | null = null;

    // Try by slug
    const { data: slugRows, error: slugError } = await supabase
      .from("jobs")
      .select("id")
      .eq("slug", slugOrId)
      .eq("status", "open")
      .eq("visibility", "public")
      .limit(1);

    if (slugError) {
      console.error("Error loading job by slug in apply route:", slugError);
    }

    if (slugRows && slugRows.length > 0) {
      jobRowId = slugRows[0].id as string;
    } else {
      // Try by id (UUID)
      const { data: idRows, error: idError } = await supabase
        .from("jobs")
        .select("id")
        .eq("id", slugOrId)
        .eq("status", "open")
        .eq("visibility", "public")
        .limit(1);

      if (idError) {
        console.error("Error loading job by id in apply route:", idError);
      }

      if (idRows && idRows.length > 0) {
        jobRowId = idRows[0].id as string;
      }
    }

    if (!jobRowId) {
      return NextResponse.json(
        {
          error:
            "Job not found or not open/public. Please check that this link is still valid.",
        },
        { status: 404 }
      );
    }

    // Prefer explicit coverLetter, then headline, then notes
    const finalCoverLetter =
      (coverLetter as string | undefined) ||
      (headline as string | undefined) ||
      (notes as string | undefined) ||
      null;

    // --- Insert into job_applications ---
    const { data: inserted, error: insertError } = await supabase
      .from("job_applications")
      .insert({
        job_id: jobRowId,
        full_name: fullName,
        email,
        phone: phone || null,
        location: location || null,
        linkedin_url: linkedinUrl || null,
        portfolio_url: portfolioUrl || null,
        cv_url: cvUrl || null,
        cover_letter: finalCoverLetter,
        source: source || "Website",
        // stage/status/created_at/updated_at should use DB defaults
      })
      .select("id")
      .single();

    if (insertError || !inserted) {
      console.error("Error inserting job_application:", insertError);
      // Surface the *actual* Supabase error message so we can see it in the UI
      const debugMessage =
        (insertError as any)?.message ||
        (insertError as any)?.details ||
        (insertError as any)?.hint ||
        "Unexpected error while creating your application.";

      return NextResponse.json(
        { error: debugMessage },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { ok: true, applicationId: inserted.id },
      { status: 201 }
    );
  } catch (err: any) {
    console.error("Apply route unexpected error:", err);
    return NextResponse.json(
      {
        error:
          err?.message ||
          "Unexpected error while creating your application. Please try again.",
      },
      { status: 500 }
    );
  }
}
