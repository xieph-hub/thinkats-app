// app/api/job-applications/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    const jobId = formData.get("jobId")?.toString() || "";
    const jobSlug = formData.get("jobSlug")?.toString() || "";
    const fullName = formData.get("fullName")?.toString().trim() || "";
    const email = formData.get("email")?.toString().trim() || "";

    if (!jobId || !fullName || !email) {
      console.error("job-applications: missing required fields", {
        jobId,
        fullName,
        email,
      });
      return redirectWithFlag(request, jobSlug || jobId, "0");
    }

    const phone = formData.get("phone")?.toString().trim() || "";
    const location = formData.get("location")?.toString().trim() || "";
    const linkedinUrl = formData.get("linkedinUrl")?.toString().trim() || "";
    const portfolioUrl = formData.get("portfolioUrl")?.toString().trim() || "";
    const source = formData.get("source")?.toString().trim() || "careers_site";

    const coverLetter = formData
      .get("coverLetter")
      ?.toString()
      .trim() || "";

    // Extra screening fields (we'll fold them into cover_letter text for now)
    const workPermit = formData.get("workPermit")?.toString() || "";
    const expectedSalary = formData.get("expectedSalary")?.toString() || "";
    const currentSalary = formData.get("currentSalary")?.toString() || "";
    const noticePeriod = formData.get("noticePeriod")?.toString() || "";
    const howHeard = formData.get("howHeard")?.toString() || "";
    const marketingOptIn = formData.get("marketingOptIn") === "on";

    const extraLines: string[] = [];

    if (workPermit) extraLines.push(`Work permit for role country: ${workPermit}`);
    if (expectedSalary)
      extraLines.push(`Expected gross annual compensation: ${expectedSalary}`);
    if (currentSalary)
      extraLines.push(`Current gross annual compensation (self-reported): ${currentSalary}`);
    if (noticePeriod)
      extraLines.push(`Notice period: ${noticePeriod}`);
    if (howHeard) extraLines.push(`How they heard about this role: ${howHeard}`);
    if (marketingOptIn)
      extraLines.push(
        "Candidate consented to hear about future opportunities."
      );

    const extraBlock =
      extraLines.length > 0
        ? `\n\n---\nScreening details:\n${extraLines.join("\n")}`
        : "";

    const combinedCover = [coverLetter, extraBlock]
      .map((s) => s.trim())
      .filter(Boolean)
      .join("\n\n");

    // ---- Upload CV to Supabase Storage (resourcin-uploads) ----
    const cvFile = formData.get("cv") as File | null;
    let cvUrl: string | null = null;

    if (cvFile && cvFile.size > 0) {
      try {
        const arrayBuffer = await cvFile.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        const ext = cvFile.name.split(".").pop() || "pdf";
        const path = `cv/${jobId}/${Date.now()}-${Math.random()
          .toString(36)
          .slice(2)}.${ext}`;

        const { data: uploadData, error: uploadError } =
          await supabaseAdmin.storage
            .from("resourcin-uploads")
            .upload(path, buffer, {
              contentType: cvFile.type || "application/octet-stream",
            });

        if (uploadError || !uploadData) {
          console.error("job-applications: error uploading CV", uploadError);
        } else {
          const { data: publicUrlData } = supabaseAdmin.storage
            .from("resourcin-uploads")
            .getPublicUrl(uploadData.path);

          cvUrl = publicUrlData.publicUrl;
        }
      } catch (err) {
        console.error("job-applications: unexpected error uploading CV", err);
      }
    }

    // ---- Insert into job_applications table ----
    const { error: insertError } = await supabaseAdmin
      .from("job_applications")
      .insert([
        {
          job_id: jobId,
          full_name: fullName,
          email,
          phone: phone || null,
          location: location || null,
          linkedin_url: linkedinUrl || null,
          portfolio_url: portfolioUrl || null,
          cv_url: cvUrl,
          cover_letter: combinedCover || null,
          source,
          stage: "applied",
          status: "active",
        },
      ]);

    if (insertError) {
      console.error("job-applications: error inserting job_application", insertError);
      return redirectWithFlag(request, jobSlug || jobId, "0");
    }

    return redirectWithFlag(request, jobSlug || jobId, "1");
  } catch (err) {
    console.error("job-applications: unexpected error", err);
    // We don't know the slug here; fallback to jobs root
    const url = new URL(request.nextUrl);
    url.pathname = "/jobs";
    url.searchParams.set("applied", "0");
    return NextResponse.redirect(url.toString(), { status: 303 });
  }
}

function redirectWithFlag(
  request: NextRequest,
  slugOrId: string,
  flag: "0" | "1"
) {
  const url = new URL(request.nextUrl);
  url.pathname = `/jobs/${encodeURIComponent(slugOrId)}`;
  url.searchParams.set("applied", flag);
  return NextResponse.redirect(url.toString(), { status: 303 });
}
