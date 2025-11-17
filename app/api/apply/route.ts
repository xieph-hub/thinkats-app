// app/api/apply/route.ts

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

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
    // Currently NOT persisted (no column on Candidate)
    const sourceRaw = String(formData.get("source") || "DIRECT").trim();
    const coverLetter = String(formData.get("coverLetter") || "").trim();
    const file = formData.get("cv") as File | null;

    if (!jobId || !fullName || !email) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // ---------- CV upload to Supabase (best-effort) ----------
    let cvUrl: string | null = null;

    if (file && file.size > 0 && supabaseAdmin) {
      try {
        const ext = file.name.split(".").pop() || "pdf";
        const safeEmail = email.replace(/[^a-z0-9@._-]/gi, "");
        const ts = Date.now();
        const path = `cvs/${safeEmail}-${ts}.${ext}`;

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

    // ---------- Candidate: find existing for this tenant by email ----------
    let candidate = await prisma.candidate.findFirst({
      where: {
        email,
        // if you later go multi-tenant, this keeps things scoped
        tenant: { id: DEFAULT_TENANT_ID },
      },
    });

    if (candidate) {
      // Update profile snapshot
      candidate = await prisma.candidate.update({
        where: { id: candidate.id },
        data: {
          fullName,
          phone: phone || null,
          location: location || null,
          linkedinUrl: linkedinUrl || null,
          ...(cvUrl ? { cvUrl } : {}),
        },
      });
    } else {
      // Create new candidate attached to default tenant
      candidate = await prisma.candidate.create({
        data: {
          fullName,
          email,
          phone: phone || null,
          location: location || null,
          linkedinUrl: linkedinUrl || null,
          cvUrl: cvUrl ?? null,
          tenant: {
            connect: { id: DEFAULT_TENANT_ID },
          },
        },
      });
    }

    // ---------- Job application snapshot ----------
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
        // If ApplicationSource enum exists, "DIRECT" should match one of the values.
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
