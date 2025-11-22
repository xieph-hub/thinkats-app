// app/api/jobs/[slug]/apply/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createSupabaseServerClient } from "@/lib/supabaseServerClient";

export async function POST(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const slugOrId = params.slug;

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
      fullName,
      email,
      phone,
      location,
      linkedinUrl,
      portfolioUrl,
      cvUrl,
      headline,
      notes,
      jobSlug, // not strictly needed, but available
    } = body ?? {};

    if (!fullName || !email) {
      return NextResponse.json(
        { error: "Full name and email are required." },
        { status: 400 }
      );
    }

    // Resolve job.id from slugOrId using Supabase, but no Prisma `job` model
    const supabase = await createSupabaseServerClient();

    const selectCols = `
      id,
      slug,
      status,
      visibility
    `;

    let { data, error } = await supabase
      .from("jobs")
      .select(selectCols)
      .eq("slug", slugOrId)
      .eq("status", "open")
      .eq("visibility", "public")
      .limit(1);

    if (error) {
      console.error("Error loading job in apply endpoint (slug)", error);
    }

    let jobId: string | null = null;

    if (data && data.length > 0) {
      jobId = data[0].id;
    } else {
      const { data: dataById, error: errorById } = await supabase
        .from("jobs")
        .select(selectCols)
        .eq("id", slugOrId)
        .eq("status", "open")
        .eq("visibility", "public")
        .limit(1);

      if (errorById) {
        console.error("Error loading job in apply endpoint (id)", errorById);
      }

      if (!dataById || dataById.length === 0) {
        return NextResponse.json(
          { error: "This job is no longer accepting applications." },
          { status: 404 }
        );
      }

      jobId = dataById[0].id;
    }

    const application = await prisma.jobApplication.create({
      data: {
        jobId: jobId!,
        fullName,
        email,
        phone: phone || null,
        location: location || null,
        linkedinUrl: linkedinUrl || null,
        portfolioUrl: portfolioUrl || null,
        cvUrl: cvUrl || null,
        coverLetter: notes || headline || null,
        source: "Website",
        stage: "APPLIED",
        status: "PENDING",
      },
    });

    return NextResponse.json(
      { ok: true, applicationId: application.id },
      { status: 200 }
    );
  } catch (err) {
    console.error("Error creating application", err);
    return NextResponse.json(
      {
        error:
          "Unexpected error while creating your application. Please try again.",
      },
      { status: 500 }
    );
  }
}
