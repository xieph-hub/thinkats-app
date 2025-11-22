// app/api/apply/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Server-only Supabase client (never sent to the browser)
function getSupabaseAdmin() {
  if (!SUPABASE_URL) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL is not set");
  }

  const key = SUPABASE_SERVICE_ROLE_KEY || SUPABASE_ANON_KEY;
  if (!key) {
    throw new Error(
      "Neither SUPABASE_SERVICE_ROLE_KEY nor NEXT_PUBLIC_SUPABASE_ANON_KEY is set"
    );
  }

  return createClient(SUPABASE_URL, key);
}

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const {
      jobSlugOrId,
      fullName,
      email,
      phone,          // not stored yet – we keep it here for future use
      location,       // same
      linkedinUrl,    // same
      portfolioUrl,   // same
      cvUrl,
      coverLetter,    // same
      source,
    } = body ?? {};

    if (
      !fullName ||
      typeof fullName !== "string" ||
      !email ||
      typeof email !== "string"
    ) {
      return NextResponse.json(
        { error: "Full name and email are required." },
        { status: 400 }
      );
    }

    const normalizedSource =
      typeof source === "string" && source.trim().length > 0
        ? source.trim()
        : "Website";

    const supabase = getSupabaseAdmin();

    // --- Resolve job_id from slug or id (only open + public jobs) ---
    let jobId: string | null = null;

    if (jobSlugOrId && typeof jobSlugOrId === "string") {
      const trimmed = jobSlugOrId.trim();
      const looksLikeUuid =
        /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(
          trimmed
        );

      let jobQuery = supabase
        .from("jobs")
        .select("id, slug, status, visibility")
        .eq("status", "open")
        .eq("visibility", "public")
        .limit(1);

      if (looksLikeUuid) {
        jobQuery = jobQuery.eq("id", trimmed);
      } else {
        jobQuery = jobQuery.eq("slug", trimmed);
      }

      const { data: jobRows, error: jobError } = await jobQuery;

      if (jobError) {
        console.error("Supabase job lookup error in /api/apply:", jobError);
        return NextResponse.json(
          { error: "Could not verify this role. Please try again." },
          { status: 500 }
        );
      }

      if (!jobRows || jobRows.length === 0) {
        return NextResponse.json(
          { error: "This role is no longer available." },
          { status: 404 }
        );
      }

      jobId = jobRows[0].id as string;
    }

    // --- Insert into job_applications ---
    // ONLY using columns we KNOW exist: id, job_id, full_name, email, cv_url, source, created_at
    const { data: inserted, error: insertError } = await supabase
      .from("job_applications")
      .insert({
        job_id: jobId,
        full_name: fullName,
        email,
        cv_url: cvUrl || null,
        source: normalizedSource,
      })
      .select("id")
      .single();

    if (insertError || !inserted) {
      console.error(
        "Supabase insert error in /api/apply:",
        insertError || "No row returned"
      );
      return NextResponse.json(
        { error: "Could not create application record." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      applicationId: inserted.id,
    });
  } catch (err) {
    console.error("Unexpected error in /api/apply:", err);
    return NextResponse.json(
      { error: "Unexpected error while creating your application." },
      { status: 500 }
    );
  }
}
