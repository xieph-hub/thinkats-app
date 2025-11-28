// app/api/jobs/apply/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

/**
 * Helper to normalise strings from FormData
 */
function getStr(formData: FormData, key: string): string {
  const v = formData.get(key);
  if (!v) return "";
  return String(v).trim();
}

const CV_BUCKET =
  process.env.NEXT_PUBLIC_SUPABASE_CV_BUCKET || "candidate-cvs";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();

    const jobId = getStr(formData, "jobId");
    const fullName = getStr(formData, "fullName");
    const email = getStr(formData, "email").toLowerCase();
    const phone = getStr(formData, "phone");
    const location = getStr(formData, "location");
    const linkedinUrl = getStr(formData, "linkedinUrl");
    const currentGrossAnnual = getStr(formData, "currentGrossAnnual");
    const grossAnnualExpectation = getStr(
      formData,
      "grossAnnualExpectation",
    );
    const noticePeriod = getStr(formData, "noticePeriod");
    const source = getStr(formData, "source");
    const coverLetter = getStr(formData, "coverLetter");

    if (!jobId || !fullName || !email) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Missing required fields (jobId, fullName, email). Please check the form and try again.",
        },
        { status: 400 },
      );
    }

    // 🔹 Confirm job exists & get tenant
    const job = await prisma.job.findUnique({
      where: { id: jobId },
      select: { id: true, tenantId: true },
    });

    if (!job) {
      return NextResponse.json(
        {
          success: false,
          error: "Job not found or no longer accepting applications.",
        },
        { status: 404 },
      );
    }

    const tenantId = job.tenantId;

    // 🔹 Upload CV to Supabase Storage (if provided)
    let cvUrl: string | null = null;
    const cvFile = formData.get("cv");

    if (cvFile && cvFile instanceof File && cvFile.size > 0) {
      try {
        const originalName = cvFile.name || "cv.pdf";
        const ext = originalName.split(".").pop() || "pdf";
        const safeExt = ext.toLowerCase();
        const filePath = `cv/${tenantId}/${jobId}/${Date.now()}-${Math.random()
          .toString(36)
          .slice(2)}.${safeExt}`;

        const { data: uploadData, error: uploadError } =
          await supabaseAdmin.storage.from(CV_BUCKET).upload(filePath, cvFile, {
            cacheControl: "3600",
            upsert: false,
            contentType:
              cvFile.type ||
              (safeExt === "pdf"
                ? "application/pdf"
                : "application/octet-stream"),
          });

        if (uploadError) {
          console.error("Supabase CV upload error:", uploadError);
        } else if (uploadData?.path) {
          const { data: publicData } = supabaseAdmin.storage
            .from(CV_BUCKET)
            .getPublicUrl(uploadData.path);

          cvUrl = publicData?.publicUrl ?? null;
        }
      } catch (err) {
        console.error("Unexpected CV upload error:", err);
      }
    }

    // 🔹 Find or create Candidate (by tenant + email)
    let candidate = await prisma.candidate.findFirst({
      where: {
        tenantId,
        email,
      },
    });

    if (!candidate) {
      candidate = await prisma.candidate.create({
        data: {
          tenantId,
          fullName,
          email,
          location,
          linkedinUrl,
          // Only set cvUrl if we actually uploaded
          ...(cvUrl ? { cvUrl } : {}),
        },
      });
    } else {
      // Soft-enrich candidate profile, but don't wipe existing info
      candidate = await prisma.candidate.update({
        where: { id: candidate.id },
        data: {
          fullName: fullName || candidate.fullName,
          location: location || candidate.location,
          linkedinUrl: linkedinUrl || candidate.linkedinUrl,
          // If we got a fresh CV, overwrite
          ...(cvUrl ? { cvUrl } : {}),
        },
      });
    }

    // 🔹 Create JobApplication row with stage + status + CV + source
    await prisma.jobApplication.create({
      data: {
        jobId: job.id,
        candidateId: candidate.id,

        fullName,
        email,
        phone,
        location,

        linkedinUrl,
        currentGrossAnnual,
        grossAnnualExpectation,
        noticePeriod,

        source,
        coverLetter,

        stage: "APPLIED",
        status: "PENDING",

        cvUrl,
      },
    });

    // ✅ Response consumed by JobApplyForm.tsx
    return NextResponse.json({
      success: true,
      message:
        "This is to acknowledge receipt of your application. A member of our recruitment team will reach out to you if you are a good fit for the role.",
    });
  } catch (err) {
    console.error("Error in /api/jobs/apply:", err);
    return NextResponse.json(
      {
        success: false,
        error:
          "Something went wrong while submitting your application. Please try again in a moment.",
      },
      { status: 500 },
    );
  }
}
