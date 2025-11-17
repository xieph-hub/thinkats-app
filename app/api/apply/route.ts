// app/api/apply/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@supabase/supabase-js";

// --- Supabase setup (server-side) ---
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Supabase environment variables are not set");
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

function getTenantId() {
  // Single-tenant for now, but keeps you future-proof
  return process.env.DEFAULT_TENANT_ID ?? "resourcin";
}

export async function POST(req: Request) {
  try {
    const formData = await req.formData();

    const jobId = formData.get("jobId");
    const fullName = formData.get("fullName");
    const email = formData.get("email");
    const phone = formData.get("phone");
    const location = formData.get("location");
    const linkedinUrl = formData.get("linkedinUrl");
    const portfolioUrl = formData.get("portfolioUrl"); // may exist on form but NOT saved to Prisma
    const coverLetter = formData.get("coverLetter");
    const source = formData.get("source") ?? "job_detail";

    // --- Basic validation ---
    if (!jobId || typeof jobId !== "string") {
      return NextResponse.json(
        { ok: false, error: "Missing or invalid job." },
        { status: 400 }
      );
    }

    if (
      !fullName ||
      typeof fullName !== "string" ||
      !email ||
      typeof email !== "string"
    ) {
      return NextResponse.json(
        { ok: false, error: "Name and email are required." },
        { status: 400 }
      );
    }

    // --- Optional CV upload to Supabase Storage ---
    const cvFile = formData.get("cv");
    let cvUrl: string | undefined;

    if (cvFile instanceof File && cvFile.size > 0) {
      const safeName =
        cvFile.name.replace(/[^a-zA-Z0-9.\-_]/g, "_") || "cv.pdf";
      const path = `cvs/${jobId}/${Date.now()}-${safeName}`;

      const { error: uploadError } = await supabase.storage
        .from("resourcin-uploads")
        .upload(path, cvFile, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) {
        console.error("Supabase upload error", uploadError);
        return NextResponse.json(
          {
            ok: false,
            error:
              "Could not upload CV. Please try again in a moment, or email it directly if this persists.",
          },
          { status: 500 }
        );
      }

      const { data: publicData } = supabase.storage
        .from("resourcin-uploads")
        .getPublicUrl(path);

      cvUrl = publicData.publicUrl;
    }

    const tenantId = getTenantId();

    // --- Make sure the job exists ---
    const job = await prisma.job.findUnique({
      where: { id: jobId },
      select: { id: true },
    });

    if (!job) {
      return NextResponse.json(
        { ok: false, error: "This role no longer exists." },
        { status: 404 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();
    const trimmedName = fullName.trim();

    // --- Upsert candidate by email (single-tenant, but tenantId stored on Candidate) ---
    const candidate = await prisma.candidate.upsert({
      where: { email: normalizedEmail },
      update: {
        fullName: trimmedName,
        phone:
          typeof phone === "string" && phone.trim() ? phone.trim() : undefined,
        location:
          typeof location === "string" && location.trim()
            ? location.trim()
            : undefined,
        linkedinUrl:
          typeof linkedinUrl === "string" && linkedinUrl.trim()
            ? linkedinUrl.trim()
            : undefined,
        // portfolioUrl is NOT a Prisma field, so we don't set it here
        cvUrl: cvUrl ?? undefined,
      },
      create: {
        tenantId, // Candidate has tenantId in your schema
        fullName: trimmedName,
        email: normalizedEmail,
        phone:
          typeof phone === "string" && phone.trim() ? phone.trim() : undefined,
        location:
          typeof location === "string" && location.trim()
            ? location.trim()
            : undefined,
        linkedinUrl:
          typeof linkedinUrl === "string" && linkedinUrl.trim()
            ? linkedinUrl.trim()
            : undefined,
        // portfolioUrl is NOT a Prisma field, so we don't set it here
        cvUrl: cvUrl ?? undefined,
      },
    });

    // --- Create job application (use relations, not raw jobId/candidateId fields) ---
    await prisma.jobApplication.create({
      data: {
        job: {
          connect: { id: jobId },
        },
        candidate: {
          connect: { id: candidate.id },
        },
        source:
          typeof source === "string" && source
            ? source
            : "job_detail",
        coverLetter:
          typeof coverLetter === "string" && coverLetter.trim()
            ? coverLetter.trim()
            : null,
        cvUrl: cvUrl ?? candidate.cvUrl,
        // stage/status rely on enum defaults from your Prisma schema
      },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Error in /api/apply", error);
    return NextResponse.json(
      {
        ok: false,
        error:
          "Something went wrong while submitting your application. Please try again.",
      },
      { status: 500 }
    );
  }
}
