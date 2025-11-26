// app/api/jobs/[jobId]/apply/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getResourcinTenant } from "@/lib/tenant";
import { uploadCvToSupabase } from "@/lib/storage";

export const runtime = "nodejs";

export async function POST(
  req: NextRequest,
  { params }: { params: { jobId: string } }
) {
  try {
    const tenant = await getResourcinTenant();
    const jobId = params.jobId;

    const job = await prisma.job.findFirst({
      where: {
        id: jobId,
        tenantId: tenant.id,
        isPublished: true,
        isPublic: true,
        status: "OPEN",
      },
    });

    if (!job) {
      return NextResponse.json(
        { error: "Job not found or not open for applications" },
        { status: 404 }
      );
    }

    const formData = await req.formData();

    const fullName = (formData.get("fullName") as string | null)?.trim();
    const email = (formData.get("email") as string | null)?.trim();
    const location = (formData.get("location") as string | null)?.trim();
    const currentTitle = (formData.get("currentTitle") as string | null)?.trim();
    const currentCompany = (formData.get("currentCompany") as string | null)?.trim();
    const cvFile = formData.get("cv") as File | null;

    if (!fullName || !email) {
      return NextResponse.json(
        { error: "Full name and email are required" },
        { status: 400 }
      );
    }

    // 1) Create or update Candidate
    let candidate = await prisma.candidate.findFirst({
      where: {
        tenantId: tenant.id,
        email,
      },
    });

    if (candidate) {
      candidate = await prisma.candidate.update({
        where: { id: candidate.id },
        data: {
          fullName,
          location: location || candidate.location,
          currentTitle: currentTitle || candidate.currentTitle,
          currentCompany: currentCompany || candidate.currentCompany,
          source: candidate.source || "DIRECT_APPLY",
        },
      });
    } else {
      candidate = await prisma.candidate.create({
        data: {
          tenantId: tenant.id,
          fullName,
          email,
          location: location || null,
          currentTitle: currentTitle || null,
          currentCompany: currentCompany || null,
          source: "DIRECT_APPLY",
        },
      });
    }

    // 2) Upload CV via shared helper
    let cvUrl: string | null = null;

    if (cvFile) {
      try {
        const { publicUrl } = await uploadCvToSupabase({
          tenantId: tenant.id,
          jobId: job.id,
          candidateId: candidate.id,
          file: cvFile,
        });

        if (publicUrl) {
          cvUrl = publicUrl;

          // Optionally store on Candidate profile
          await prisma.candidate.update({
            where: { id: candidate.id },
            data: {
              cvUrl,
            },
          });
        }
      } catch (err) {
        console.error("Unexpected CV upload error:", err);
        // We don't fail the whole application if CV upload fails
      }
    }

    // 3) Find default pipeline stage
    const defaultStage = await prisma.pipelineStage.findFirst({
      where: { tenantId: tenant.id },
      orderBy: { sortOrder: "asc" },
    });

    // 4) Create JobApplication
    const application = await prisma.jobApplication.create({
      data: {
        tenantId: tenant.id,
        jobId: job.id,
        candidateId: candidate.id,
        clientCompanyId: job.clientCompanyId,
        pipelineStageId: defaultStage?.id ?? null,
        status: "IN_REVIEW",
        source: "careers_site",
        cvUrl,
        submittedAt: new Date(),
      },
    });

    return NextResponse.json(
      {
        success: true,
        applicationId: application.id,
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("POST /api/jobs/[jobId]/apply error", err);
    return NextResponse.json(
      {
        error:
          "We couldn't submit your application due to a server error. Please try again or email your CV.",
      },
      { status: 500 }
    );
  }
}
