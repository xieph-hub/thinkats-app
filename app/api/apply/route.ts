// app/api/apply/route.ts

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

// Single-tenant helper: always attach candidates/applications to this tenant.
const DEFAULT_TENANT_ID =
  process.env.DEFAULT_TENANT_ID || "default-tenant";

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get("content-type") || "";

    if (!contentType.includes("multipart/form-data")) {
      return NextResponse.json(
        { error: "Invalid content type" },
        { status: 400 }
      );
    }

    const formData = await req.formData();

    const jobId = String(formData.get("jobId") || "").trim();
    const fullName = String(formData.get("fullName") || "").trim();
    const email = String(formData.get("email") || "").trim().toLowerCase();
    const phone = String(formData.get("phone") || "").trim();
    const location = String(formData.get("location") || "").trim();
    const linkedinUrl = String(formData.get("linkedinUrl") || "").trim();
    // We currently do NOT persist portfolioUrl (schema doesn’t have it)
    const portfolioUrl = String(formData.get("portfolioUrl") || "").trim();
    const sourceRaw = String(formData.get("source") || "DIRECT").trim();
    const coverLetter = String(formData.get("coverLetter") || "").trim();
    const file = formData.get("cv") as File | null;

    if (!jobId || !fullName || !email) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // --- Upload CV to Supabase (best-effort, non-fatal if it fails) ---
    let cvUrl: string | null = null;

    if (file && file.size > 0 && supabaseAdmin) {
      try {
        const fileExt = file.name.split(".").pop() || "pdf";
        const safeEmail = email.replace(/[^a-z0-9@._-]/gi, "");
        const timestamp = Date.now();
        const path = `cvs/${safeEmail}-${timestamp}.${fileExt}`;

        const { data, error } = await supabaseAdmin.storage
          .from("resourcin-uploads")
          .upload(path, file, {
            cacheControl: "3600",
            upsert: false,
          });

        if (error) {
          console.error("[Supabase] CV upload error:", error);
        } else if (data?.path) {
          const { data: publicData } = supabaseAdmin.storage
            .from("resourcin-uploads")
            .getPublicUrl(data.path);

          cvUrl = publicData?.publicUrl ?? null;
        }
      } catch (err) {
        console.error("[Supabase] Unexpected CV upload error:", err);
      }
    }

    // --- Find candidate for this tenant (email + tenant) ---
    let candidate = await prisma.candidate.findFirst({
      where: {
        email,
        // if multi-tenant is ever real, this keeps things scoped
        tenant: { id: DEFAULT_TENANT_ID },
      },
    });

    // --- Update existing candidate profile snapshot ---
    if (candidate) {
      candidate = await prisma.candidate.update({
        where: { id: candidate.id },
        data: {
          fullName,
          phone: phone || null,
          location: location || null,
          linkedinUrl: linkedinUrl || null,
          // portfolioUrl intentionally NOT saved (no column yet)
          ...(cvUrl ? { cvUrl } : {}),
        },
      });
    } else {
      // --- Create new candidate, attaching to default tenant ---
      candidate = await prisma.candidate.create({
        data: {
          fullName,
          email,
          phone: phone || null,
          location: location || null,
          linkedinUrl: linkedinUrl || null,
          cvUrl: cvUrl ?? null,
          tenant: {
            connect: {
              // Must match TenantWhereUniqueInput – typically "id"
              id: DEFAULT_TENANT_ID,
            },
          },
        },
      });
    }

    // --- Create job application snapshot ---
    await prisma.jobApplication.create({
      data: {
        job: {
          connect: { id: jobId },
        },
        candidate: {
          connect: { id: candidate.id },
        },
        fullName: candidate.fullName,
        email: candidate.email,
        source: (sourceRaw || "DIRECT") as any,
        coverLetter,
        cvUrl: cvUrl ?? (candidate as any).cvUrl ?? "",
      } as any,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[API /apply] Unexpected error:", err);
    return NextResponse.json(
      {
        error:
          "Something went wrong while submitting your application. Please try again.",
      },
      { status: 500 }
    );
  }
}
