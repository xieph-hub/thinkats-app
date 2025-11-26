// app/api/jobs/[jobId]/apply/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getResourcinTenant } from "@/lib/tenant";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase =
  supabaseUrl && supabaseServiceRoleKey
    ? createClient(supabaseUrl, supabaseServiceRoleKey)
    : null;

const CV_BUCKET = "resourcin-uploads";

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

    // 1) Create or update Candidate (without relying on composite unique)
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

    // 2) Upload CV to Supabase (if file & client configured)
    let cvUrl: string | null = null;

    if (supabase && cvFile) {
      try {
        const ext = cvFile.name.split(".").pop() || "cv";
        const path = `${tenant.id}/${job.id}/${candidate.id}-${Date.now()}.${ext}`;

        const { error: uploadError } = await supabase.storage
          .from(CV_BUCKET)
          .upload(path, cvFile, {
            contentType: cvFile.type || "application/octet-stream",
            upsert: false,
          });

        if (uploadError) {
          console.error("Supabase CV upload error:", uploadError);
        } else {
          const { data: publicData } = supabase.storage
            .from(CV_BUCKET)
            .getPublicUrl(path);
          cvUrl = publicData?.publicUrl || null;

          // store on Candidate too if you like
          await prisma.candidate.update({
            where: { id: candidate.id },
            data: {
              cvUrl,
            },
          });
        }
      } catch (err) {
        console.error("Supabase CV upload unexpected error:", err);
      }
    }

    // 3) Get default pipeline stage (first by sortOrder)
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
