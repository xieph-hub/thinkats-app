// app/api/apply/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { Buffer } from "buffer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function ensureString(value: FormDataEntryValue | null, field: string): string {
  if (typeof value !== "string") {
    throw new Error(`Missing or invalid field: ${field}`);
  }
  return value.trim();
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();

    // --- Required fields ---
    const jobId = ensureString(formData.get("jobId"), "jobId");
    const fullName = ensureString(formData.get("fullName"), "fullName");
    const emailRaw = ensureString(formData.get("email"), "email");
    const email = emailRaw.toLowerCase();

    // --- Optional fields ---
    const phone =
      typeof formData.get("phone") === "string"
        ? (formData.get("phone") as string).trim()
        : null;

    const location =
      typeof formData.get("location") === "string"
        ? (formData.get("location") as string).trim()
        : null;

    const linkedinUrl =
      typeof formData.get("linkedinUrl") === "string"
        ? (formData.get("linkedinUrl") as string).trim()
        : null;

    const portfolioUrl =
      typeof formData.get("portfolioUrl") === "string"
        ? (formData.get("portfolioUrl") as string).trim()
        : null;

    const coverLetter =
      typeof formData.get("coverLetter") === "string"
        ? (formData.get("coverLetter") as string).trim()
        : null;

    const source =
      typeof formData.get("source") === "string"
        ? (formData.get("source") as string).trim()
        : "Website";

    // --- CV file (required) ---
    const cv = formData.get("cv");
    if (!(cv instanceof File)) {
      return NextResponse.json(
        { error: "Please upload your CV (PDF or DOC)." },
        { status: 400 }
      );
    }

    // --- Find job (and tenant) ---
    const job = await prisma.job.findUnique({
      where: { id: jobId },
      select: { id: true, tenantId: true, title: true },
    });

    if (!job) {
      return NextResponse.json(
        { error: "This role no longer exists." },
        { status: 404 }
      );
    }

    const tenantId = job.tenantId;

    // --- Upsert candidate (per tenant + email) ---
    // Assumes in Prisma schema you have:
    // @@unique([tenantId, email], name: "Candidate_tenantId_email")
    const candidate = await prisma.candidate.upsert({
      where: {
        tenantId_email: {
          tenantId,
          email,
        },
      },
      update: {
        fullName,
        phone,
        location,
        linkedinUrl,
      },
      create: {
        tenantId,
        fullName,
        email,
        phone,
        location,
        linkedinUrl,
      },
    });

    // --- Prepare CV file for Supabase (Node: use Buffer) ---
    const fileExt =
      cv.name && cv.name.includes(".")
        ? cv.name.split(".").pop()!.toLowerCase()
        : "pdf";

    const objectPath = [
      "cvs",
      tenantId,
      job.id,
      `${Date.now()}_${Math.random().toString(36).slice(2)}.${fileExt}`,
    ].join("/");

    const arrayBuffer = await cv.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // --- Upload CV to Supabase bucket: resourcin-uploads ---
    const { data: uploadData, error: uploadError } =
      await supabaseAdmin.storage
        .from("resourcin-uploads")
        .upload(objectPath, buffer, {
          cacheControl: "3600",
          upsert: false,
          contentType: cv.type || "application/octet-stream",
        });

    if (uploadError || !uploadData?.path) {
      console.error("Supabase upload error:", {
        uploadError,
        bucket: "resourcin-uploads",
        objectPath,
        cvName: cv.name,
        cvType: cv.type,
        cvSize: (cv as any).size,
      });

      return NextResponse.json(
        {
          error:
            "Could not upload CV. Please try again in a moment, or email it directly if this persists.",
        },
        { status: 500 }
      );
    }

    const cvPath = uploadData.path; // path inside resourcin-uploads bucket

    // --- Create JobApplication record ---
    await prisma.jobApplication.create({
      data: {
        jobId: job.id,
        candidateId: candidate.id,
        fullName,
        email,
        phone,
        location,
        linkedinUrl,
        portfolioUrl,
        cvUrl: cvPath,
        coverLetter,
        source,
        status: "PENDING",
      },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Error in /api/apply:", error);
    return NextResponse.json(
      {
        error:
          "Something went wrong while submitting your application. Please try again.",
      },
      { status: 500 }
    );
  }
}
