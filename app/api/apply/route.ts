// app/api/apply/route.ts

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const RESUME_BUCKET =
  process.env.SUPABASE_RESUME_BUCKET || "resumes";

// Helper: upload resume file to Supabase Storage via REST API
async function uploadResumeToSupabase(file: File, email: string | null) {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.warn(
      "Supabase env vars not set, skipping resume upload"
    );
    return null;
  }

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const ext =
    (file.name.split(".").pop() || "bin").toLowerCase();
  const safeEmail = (email || "candidate")
    .toLowerCase()
    .replace(/[^a-z0-9_-]/gi, "_");

  const path = `${safeEmail}/${Date.now()}-${Math.random()
    .toString(36)
    .slice(2)}.${ext}`;

  const uploadUrl = `${SUPABASE_URL}/storage/v1/object/${encodeURIComponent(
    RESUME_BUCKET
  )}/${path}`;

  const res = await fetch(uploadUrl, {
    method: "POST",
    headers: {
      "Content-Type":
        file.type || "application/octet-stream",
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
    },
    body: buffer,
  });

  if (!res.ok) {
    const text = await res.text();
    console.error(
      "Supabase resume upload failed:",
      res.status,
      text
    );
    return null;
  }

  const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/${encodeURIComponent(
    RESUME_BUCKET
  )}/${path}`;

  return publicUrl;
}

export async function POST(req: Request) {
  try {
    const contentType =
      req.headers.get("content-type") || "";

    let formData: FormData;

    // Prefer multipart/form-data for file upload
    if (contentType.includes("multipart/form-data")) {
      formData = await req.formData();
    } else {
      // Fallback for JSON callers (legacy behaviour)
      const body = await req.json().catch(() => ({}));
      formData = new FormData();
      Object.entries(body || {}).forEach(
        ([key, value]) => {
          if (typeof value === "string") {
            formData.append(key, value);
          }
        }
      );
    }

    const jobIdFromForm =
      (formData.get("jobId") as string) || null;
    const jobSlug =
      (formData.get("jobSlug") as string) || null;

    const name = (
      (formData.get("name") as string) || ""
    ).trim();
    const emailRaw = (
      (formData.get("email") as string) || ""
    ).trim();
    const phone = (
      (formData.get("phone") as string) || ""
    ).trim();
    const location = (
      (formData.get("location") as string) || ""
    ).trim();
    const source =
      (
        (formData.get("source") as string) ||
        "website"
      ).trim() || "website";

    if (!emailRaw) {
      return NextResponse.json(
        {
          success: false,
          ok: false,
          error: "Email is required",
          message: "Email is required",
        },
        { status: 400 }
      );
    }

    const normalizedEmail = emailRaw.toLowerCase();

    // Find the job either by id or slug
    let job = null;

    if (jobIdFromForm) {
      job = await prisma.job.findUnique({
        where: { id: jobIdFromForm },
      });
    }

    if (!job && jobSlug) {
      job = await prisma.job.findUnique({
        where: { slug: jobSlug },
      });
    }

    if (!job) {
      return NextResponse.json(
        {
          success: false,
          ok: false,
          error: "Job not found",
          message: "Job not found",
        },
        { status: 404 }
      );
    }

    // Handle resume: file + optional legacy resumeUrl field
    let resumeUrl: string | null = null;

    const resumeFile = formData.get("resume");
    if (
      resumeFile instanceof File &&
      resumeFile.size > 0
    ) {
      const uploadedUrl =
        await uploadResumeToSupabase(
          resumeFile,
          normalizedEmail
        );
      if (uploadedUrl) {
        resumeUrl = uploadedUrl;
      }
    }

    if (!resumeUrl) {
      const resumeUrlField =
        (formData.get("resumeUrl") as string) || "";
      if (resumeUrlField) {
        resumeUrl = resumeUrlField;
      }
    }

    // Find or create candidate by email
    let candidate = await prisma.candidate.findFirst({
      where: { email: normalizedEmail },
    });

    if (!candidate) {
      candidate = await prisma.candidate.create({
        data: {
          job: {
            connect: { id: job.id },
          },
          fullname: name || null,
          email: normalizedEmail,
          phone: phone || null,
          location: location || null,
          resumeUrl: resumeUrl || null,
          source,
        },
      });
    } else {
      candidate = await prisma.candidate.update({
        where: { id: candidate.id },
        data: {
          fullname:
            candidate.fullname || name || null,
          phone: phone || candidate.phone,
          location:
            location || candidate.location,
          resumeUrl:
            resumeUrl || candidate.resumeUrl,
          source: candidate.source || source,
          ...(candidate.jobId
            ? {}
            : {
                job: {
                  connect: { id: job.id },
                },
              }),
        },
      });
    }

    // Create application record – now also connecting required candidate relation
    const application =
      await prisma.application.create({
        data: {
          job: { connect: { id: job.id } },
          candidate: { connect: { id: candidate.id } },
          fullName:
            name ||
            candidate.fullname ||
            "Candidate",
          email: normalizedEmail,
          phone: phone || candidate.phone,
          location:
            location || candidate.location,
          source,
          resumeUrl,
          stage: "APPLIED",
        } as any,
      });

    return NextResponse.json(
      {
        success: true,
        ok: true,
        applicationId: application.id,
        message: "Application received",
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Apply API error:", error);

    const errMessage =
      error?.message ||
      "Something went wrong while processing your application.";

    return NextResponse.json(
      {
        success: false,
        ok: false,
        error: errMessage,
        message: errMessage,
      },
      { status: 500 }
    );
  }
}
