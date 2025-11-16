// app/api/apply/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getDefaultTenant } from "@/lib/tenant";

export async function POST(req: Request) {
  try {
    const tenant = await getDefaultTenant();

    const contentType = req.headers.get("content-type") ?? "";
    let payload: Record<string, unknown>;

    if (contentType.includes("application/json")) {
      payload = (await req.json()) as Record<string, unknown>;
    } else {
      const formData = await req.formData();
      payload = Object.fromEntries(formData.entries());
    }

    const jobId = String(payload.jobId ?? "").trim();
    const fullName = String(payload.fullName ?? "").trim();
    const emailRaw = String(payload.email ?? "").trim();
    const email = emailRaw.toLowerCase();
    const phone = String(payload.phone ?? "").trim();
    const location = String(payload.location ?? "").trim();
    const linkedinUrl = String(payload.linkedinUrl ?? "").trim();
    const portfolioUrl = String(payload.portfolioUrl ?? "").trim();
    const coverLetter = String(payload.coverLetter ?? "").trim();
    const source = String(payload.source ?? "Website").trim() || "Website";

    if (!jobId || !fullName || !email) {
      return NextResponse.json(
        { ok: false, error: "Missing required fields." },
        { status: 400 }
      );
    }

    // Make sure job exists for this tenant
    const job = await prisma.job.findFirst({
      where: {
        id: jobId,
        tenantId: tenant.id,
        isPublished: true,
      },
    });

    if (!job) {
      return NextResponse.json(
        { ok: false, error: "Job not found." },
        { status: 404 }
      );
    }

    // Upsert candidate by compound unique [tenantId, email]
    const candidate = await prisma.candidate.upsert({
      where: {
        tenantId_email: {
          tenantId: tenant.id,
          email,
        },
      },
      update: {
        fullName,
        phone: phone || null,
        location: location || null,
        linkedinUrl: linkedinUrl || null,
        // extend with more fields if you collect them
      },
      create: {
        tenantId: tenant.id,
        fullName,
        email,
        phone: phone || null,
        location: location || null,
        linkedinUrl: linkedinUrl || null,
        yearsOfExperience: null,
        currentRole: null,
        currentCompany: null,
        primaryFunction: null,
        seniority: null,
        skills: [],
        cvUrl: null,
        notes: null,
      },
    });

    await prisma.jobApplication.create({
      data: {
        jobId: job.id,
        candidateId: candidate.id,
        fullName,
        email,
        phone: phone || null,
        location: location || null,
        linkedinUrl: linkedinUrl || null,
        portfolioUrl: portfolioUrl || null,
        cvUrl: candidate.cvUrl ?? null,
        coverLetter: coverLetter || null,
        source,
        // stage/status use defaults (ApplicationStage/APPLICATIONSTATUS)
      },
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Error submitting application:", err);
    return NextResponse.json(
      { ok: false, error: "Failed to submit application." },
      { status: 500 }
    );
  }
}
