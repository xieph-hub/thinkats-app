// app/ats/applications/status/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const contentType = request.headers.get("content-type") || "";

  // 🔹 Path 1: JSON body (bulk update via fetch)
  if (contentType.includes("application/json")) {
    try {
      const body = await request.json();
      const { jobId, applicationIds, newStatus } = body ?? {};

      if (
        !jobId ||
        !newStatus ||
        !Array.isArray(applicationIds) ||
        applicationIds.length === 0
      ) {
        return NextResponse.json(
          {
            success: false,
            error: "Missing jobId, newStatus or applicationIds",
          },
          { status: 400 },
        );
      }

      const result = await prisma.jobApplication.updateMany({
        where: {
          jobId,
          id: { in: applicationIds },
        },
        data: {
          status: newStatus,
        },
      });

      return NextResponse.json({
        success: true,
        updated: result.count,
        status: newStatus,
      });
    } catch (err) {
      console.error("Bulk status update error:", err);
      return NextResponse.json(
        { success: false, error: "Failed to update status" },
        { status: 500 },
      );
    }
  }

  // 🔹 Path 2: Form POST from inline controls on /ats/jobs/[jobId]
  try {
    const formData = await request.formData();
    const jobId = formData.get("jobId");
    const applicationId = formData.get("applicationId");
    const newStatus = formData.get("newStatus");

    if (
      typeof jobId !== "string" ||
      typeof applicationId !== "string" ||
      typeof newStatus !== "string" ||
      !jobId ||
      !applicationId ||
      !newStatus
    ) {
      const fallbackUrl = new URL(request.url);
      fallbackUrl.pathname = "/ats/jobs";
      fallbackUrl.search = "";
      return NextResponse.redirect(fallbackUrl, { status: 303 });
    }

    await prisma.jobApplication.update({
      where: { id: applicationId },
      data: { status: newStatus },
    });

    const redirectUrl = new URL(request.url);
    redirectUrl.pathname = `/ats/jobs/${jobId}`;
    redirectUrl.search = "";
    return NextResponse.redirect(redirectUrl, { status: 303 });
  } catch (err) {
    console.error("Inline status update error:", err);
    const fallbackUrl = new URL(request.url);
    fallbackUrl.pathname = "/ats/jobs";
    fallbackUrl.search = "";
    return NextResponse.redirect(fallbackUrl, { status: 303 });
  }
}
