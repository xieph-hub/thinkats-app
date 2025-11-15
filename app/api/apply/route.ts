// app/api/apply/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase =
  SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY
    ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
    : null;

export async function POST(req: Request) {
  try {
    const contentType = req.headers.get("content-type") || "";

    let name = "";
    let email = "";
    let phone: string | null = null;
    let location: string | null = null;
    let jobSlug = "";
    let source = "website";
    let cvFile: File | null = null;

    // We support both multipart/form-data (form with file) and JSON (no file)
    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();

      name = String(formData.get("name") ?? "").trim();
      email = String(formData.get("email") ?? "").trim();
      phone = String(formData.get("phone") ?? "").trim() || null;
      location = String(formData.get("location") ?? "").trim() || null;
      jobSlug = String(formData.get("jobSlug") ?? "").trim();
      source = String(formData.get("source") ?? "website").trim() || "website";

      const file = formData.get("resume");
      cvFile = file instanceof File ? file : null;
    } else if (contentType.includes("application/json")) {
      const body = await req.json();

      name = (body.name ?? "").trim();
      email = (body.email ?? "").trim();
      phone = body.phone || null;
      location = body.location || null;
      jobSlug = (body.jobSlug ?? "").trim();
      source = body.source || "website";
      // no file in this case
    } else {
      return NextResponse.json(
        { ok: false, message: "Unsupported content type." },
        { status: 400 }
      );
    }

    if (!jobSlug || !name || !email) {
      return NextResponse.json(
        {
          ok: false,
          message: "Missing required fields (jobSlug, name, email).",
        },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase();

    const job = await prisma.job.findUnique({
      where: { slug: jobSlug },
    });

    if (!job || !job.isPublished) {
      return NextResponse.json(
        { ok: false, message: "Job not found or not published." },
        { status: 404 }
      );
    }

    // 1) Upload CV to Supabase Storage (if provided)
    let resumeUrl: string | null = null;
    let uploadError: string | null = null;

    if (cvFile && supabase) {
      try {
        const arrayBuffer = await cvFile.arrayBuffer();

        const safeSlug = jobSlug.replace(/[^a-zA-Z0-9-_]/g, "-") || "general";
        const originalName = cvFile.name || "cv";
        const safeName = originalName.replace(/[^\w.-]/g, "_");
        const timestamp = Date.now();
        const path = `${safeSlug}/${timestamp}-${safeName}`;

        const { data, error } = await supabase.storage
          .from("resumes") // bucket name
          .upload(path, arrayBuffer, {
            cacheControl: "3600",
            upsert: false,
            contentType: cvFile.type || "application/octet-stream",
          });

        if (error || !data) {
          console.error("Supabase storage error:", error);
          const msg =
            (error as any)?.message ||
            JSON.stringify(error, Object.getOwnPropertyNames(error ?? {}));
          uploadError = `Supabase storage error: ${msg}`;
        } else {
          const {
            data: { publicUrl },
          } = supabase.storage.from("resumes").getPublicUrl(data.path);
          resumeUrl = publicUrl ?? null;
        }
      } catch (err: any) {
        console.error("CV upload exception:", err);
        const msg =
          typeof err?.message === "string"
            ? err.message
            : JSON.stringify(err, Object.getOwnPropertyNames(err ?? {}));
        uploadError = `Upload exception: ${msg}`;
      }
    }

    // 2) Find or create Candidate for this job + email
    let candidate = await prisma.candidate.findFirst({
      where: {
        jobId: job.id,
        email: normalizedEmail,
      },
    });

    if (!candidate) {
      candidate = await prisma.candidate.create({
        data: {
          jobId: job.id,
          fullname: name,
          email: normalizedEmail,
          phone,
          location,
          source,
          resumeUrl,
        },
      });
    } else {
      candidate = await prisma.candidate.update({
        where: { id: candidate.id },
        data: {
          fullname: name || candidate.fullname,
          phone: phone ?? candidate.phone,
          location: location ?? candidate.location,
          source,
          ...(resumeUrl ? { resumeUrl } : {}),
        },
      });
    }

    // 3) Find or create Application for this job + candidate
    let application = await prisma.application.findFirst({
      where: {
        jobId: job.id,
        candidate: {
          id: candidate.id,
        },
      },
    });

    if (!application) {
      application = await prisma.application.create({
        data: {
          job: { connect: { id: job.id } },
          candidate: { connect: { id: candidate.id } },
          // stage uses default (APPLIED)
        },
      });
    }

    return NextResponse.json(
      {
        ok: true,
        message: "Application received.",
        uploadError,
        applicationId: application.id,
        candidateId: candidate.id,
        resumeUrl,
      },
      { status: 200 }
    );
  } catch (err: any) {
    console.error("Apply route fatal error:", err);
    const msg =
      typeof err?.message === "string"
        ? err.message
        : JSON.stringify(err, Object.getOwnPropertyNames(err ?? {}));

    return NextResponse.json(
      {
        ok: false,
        message: `Server error while saving application: ${msg}`,
      },
      { status: 500 }
    );
  }
}
