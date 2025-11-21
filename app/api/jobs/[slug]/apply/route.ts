// app/api/jobs/[slug]/apply/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { uploadCv } from "@/lib/uploadCv";

export const runtime = "nodejs"; // ensure Node runtime (for Buffer/Supabase)

export async function POST(
  req: Request,
  { params }: { params: { slug: string } }
) {
  try {
    const formData = await req.formData();

    const jobSlugFromBody =
      ((formData.get("jobSlug") as string | null) || "").trim();

    const fullName = (formData.get("fullName") as string | null)?.trim();
    const email = (formData.get("email") as string | null)?.trim();
    const phone = (formData.get("phone") as string | null) || null;
    const location = (formData.get("location") as string | null) || null;
    const linkedinUrl = (formData.get("linkedinUrl") as string | null) || null;
    const portfolioUrl =
      (formData.get("portfolioUrl") as string | null) || null;
    const coverLetter =
      (formData.get("coverLetter") as string | null) || null;

    // 👇 The uploaded CV file from <input name="cv" type="file" />
    const cvFile = formData.get("cv") as File | null;

    if (!fullName || !email) {
      return NextResponse.json(
        { error: "Full name and email are required." },
        { status: 400 }
      );
    }

    const slug = (jobSlugFromBody || params.slug).trim();

    // 1) Find the Resourcin tenant (use env if available, else fallback)
    const tenant = await prisma.tenant.findFirst({
      where: {
        slug: process.env.RESOURCIN_TENANT_SLUG || "resourcin",
      },
    });

    if (!tenant) {
      return NextResponse.json(
        { error: "Tenant configuration missing." },
        { status: 500 }
      );
    }

    // 2) Find the job by slug within this tenant
    const job = await prisma.job.findFirst({
      where: {
        slug,
        tenantId: tenant.id,
      },
    });

    if (!job) {
      return NextResponse.json(
        { error: "Job not found for this slug." },
        { status: 404 }
      );
    }

    // 3) Upload CV if present
    let cvUrl: string | null = null;
    if (cvFile && cvFile.size > 0) {
      cvUrl = await uploadCv({
        file: cvFile,
        jobId: job.id,
        candidateEmail: email,
      });
    }

    // 4) Upsert candidate (one per email)
    const candidate = await prisma.candidate.upsert({
      where: { email }, // email unique in your schema
      create: {
        tenantId: tenant.id,
        fullName,
        email,
        phone,
        location,
        linkedinUrl,
        cvUrl,
      },
      update: {
        fullName,
        phone,
        location,
        linkedinUrl,
        cvUrl,
      },
    });

    // 5) Create JobApplication
    const application = await prisma.jobApplication.create({
      data: {
        jobId: job.id,
        candidateId: candidate.id,
        fullName,
        email,
        phone,
        location,
        linkedinUrl,
        portfolioUrl,
        cvUrl,
        coverLetter,
        source: "Website", // keep your original label
        // stage/status will use your enum defaults (APPLIED / PENDING)
      },
    });

    return NextResponse.json(
      { ok: true, applicationId: application.id },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating application", error);
    return NextResponse.json(
      {
        error:
          "Unexpected error while creating your application. Please try again.",
      },
      { status: 500 }
    );
  }
}
