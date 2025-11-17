// app/api/apply/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const CV_BUCKET = "resourcin-uploads";

// Server-side Supabase client (safe because we use the service role key only on the server)
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    const jobId = String(formData.get("jobId") ?? "").trim();
    const fullName = String(formData.get("fullName") ?? "").trim();
    const email = String(formData.get("email") ?? "").trim().toLowerCase();
    const phone = formData.get("phone")
      ? String(formData.get("phone"))
      : undefined;
    const location = formData.get("location")
      ? String(formData.get("location"))
      : undefined;
    const linkedinUrl = formData.get("linkedinUrl")
      ? String(formData.get("linkedinUrl"))
      : undefined;
    const portfolioUrl = formData.get("portfolioUrl")
      ? String(formData.get("portfolioUrl"))
      : undefined;
    const coverLetter = formData.get("coverLetter")
      ? String(formData.get("coverLetter"))
      : undefined;
    const source = formData.get("source")
      ? String(formData.get("source"))
      : "Website";

    const file = formData.get("cv") as File | null;

    if (!jobId || !fullName || !email) {
      return NextResponse.json(
        { ok: false, error: "Missing required fields." },
        { status: 400 }
      );
    }

    // ---------------------------
    // 1) Upload CV to Supabase
    // ---------------------------
    let cvUrl: string | undefined;

    if (file && file.size > 0) {
      const safeName = fullName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .slice(0, 50);
      const extGuess = file.name.includes(".")
        ? file.name.split(".").pop()
        : "pdf";
      const path = `cvs/${jobId}/${Date.now()}-${safeName}.${extGuess}`;

      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      const { error: uploadError } = await supabase.storage
        .from(CV_BUCKET)
        .upload(path, buffer, {
          contentType: file.type || "application/octet-stream",
          upsert: false,
        });

      if (uploadError) {
        console.error("Supabase upload error:", uploadError);
        return NextResponse.json(
          {
            ok: false,
            error:
              "Could not upload CV. Please try again in a moment, or email it directly if this persists.",
          },
          { status: 500 }
        );
      }

      const { data } = supabase.storage.from(CV_BUCKET).getPublicUrl(path);
      cvUrl = data.publicUrl;
    }

    const tenantId = process.env.DEFAULT_TENANT_ID ?? "resourcin";

    // ---------------------------
    // 2) Upsert Candidate by email
    // ---------------------------
    const candidate = await prisma.candidate.upsert({
      where: { email }, // email is unique in your schema
      update: {
        fullName,
        phone,
        location,
        linkedinUrl,
        cvUrl: cvUrl ?? undefined, // only overwrite if we have a fresh upload
      },
      create: {
        tenantId,
        fullName,
        email,
        phone,
        location,
        linkedinUrl,
        cvUrl: cvUrl ?? "",
      },
    });

    // ---------------------------
    // 3) Create Job Application
    // ---------------------------
    const application = await prisma.jobApplication.create({
      data: {
        jobId,
        candidateId: candidate.id,
        fullName,
        email,
        phone,
        location,
        linkedinUrl,
        portfolioUrl,
        coverLetter,
        source,
        cvUrl: cvUrl || "",
        status: "PENDING",
        stage: "APPLIED",
      },
    });

    return NextResponse.json({
      ok: true,
      applicationId: application.id,
    });
  } catch (err) {
    console.error("Apply route error:", err);
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
