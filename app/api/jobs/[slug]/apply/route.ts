// app/api/jobs/[slug]/apply/route.ts

import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const { slug } = params;

    // 1) Look up the job by slug (and published state)
    const job = await prisma.job.findFirst({
      where: {
        slug,
        isPublished: true,
      },
    });

    if (!job) {
      return NextResponse.json(
        { error: "Job not found or not accepting applications." },
        { status: 404 }
      );
    }

    // 2) Read form data
    const formData = await req.formData();

    const get = (key: string) => {
      const v = formData.get(key);
      return typeof v === "string" ? v.trim() : "";
    };

    // tolerant to slightly different field names
    const fullName = get("fullName") || get("name") || "Unknown";
    const email = get("email");
    const phone = get("phone") || get("phoneNumber");
    const location = get("location") || get("currentLocation");
    const linkedinUrl = get("linkedinUrl") || get("linkedin");
    const portfolioUrl = get("portfolioUrl") || get("portfolio");
    const coverLetter = get("coverLetter") || get("notes") || "";

    // For now we treat CV as a URL/string. We can wire real file uploads later.
    const cvUrl =
      get("cvUrl") ||
      get("cv") ||
      get("resumeUrl") ||
      get("resume") ||
      "";

    if (!email) {
      return NextResponse.json(
        { error: "Email is required." },
        { status: 400 }
      );
    }

    // 3) Create JobApplication row
    await prisma.jobApplication.create({
      data: {
        jobId: job.id,
        fullName,
        email,
        phone: phone || null,
        location: location || null,
        linkedinUrl: linkedinUrl || null,
        portfolioUrl: portfolioUrl || null,
        cvUrl: cvUrl || null,
        coverLetter: coverLetter || null,
        source: "Website",
      },
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Error creating application", err);
    return NextResponse.json(
      { error: "Unexpected error while submitting application." },
      { status: 500 }
    );
  }
}
