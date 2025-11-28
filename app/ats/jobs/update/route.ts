// app/ats/jobs/update/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const formData = await request.formData();

  const jobId = formData.get("jobId");
  const status = formData.get("status");
  const visibility = formData.get("visibility");
  const internalOnlyRaw = formData.get("internalOnly");
  const confidentialRaw = formData.get("confidential");

  if (typeof jobId !== "string" || !jobId) {
    // Fallback – no jobId? Go back to ATS jobs list
    const fallbackUrl = new URL(request.url);
    fallbackUrl.pathname = "/ats/jobs";
    fallbackUrl.search = "";
    return NextResponse.redirect(fallbackUrl, { status: 303 });
  }

  const data: any = {};

  if (typeof status === "string" && status) {
    data.status = status; // "open" | "draft" | "closed"
  }

  if (typeof visibility === "string" && visibility) {
    data.visibility = visibility; // "public" | "internal"
  }

  // Checkboxes: presence = true, absence = false
  data.internalOnly = internalOnlyRaw != null;
  data.confidential = confidentialRaw != null;

  try {
    await prisma.job.update({
      where: { id: jobId },
      data,
    });
  } catch (err) {
    console.error("Error updating job inline:", err);
  }

  const redirectUrl = new URL(request.url);
  redirectUrl.pathname = `/ats/jobs/${jobId}`;
  redirectUrl.search = "";
  return NextResponse.redirect(redirectUrl, { status: 303 });
}
