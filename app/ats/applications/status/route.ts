// app/ats/applications/status/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const formData = await request.formData();

  const jobIdRaw = formData.get("jobId");
  const applicationIdRaw = formData.get("applicationId");
  const newStatusRaw = formData.get("newStatus");
  const redirectToRaw = formData.get("redirectTo");

  const jobId = typeof jobIdRaw === "string" ? jobIdRaw : "";
  const applicationId =
    typeof applicationIdRaw === "string" ? applicationIdRaw : "";
  const newStatus =
    typeof newStatusRaw === "string" ? newStatusRaw : "";

  const redirectTo =
    typeof redirectToRaw === "string" ? redirectToRaw : "";

  if (!jobId || !applicationId || !newStatus) {
    const fallbackUrl = new URL(request.url);
    fallbackUrl.pathname = "/ats/jobs";
    fallbackUrl.search = "";
    return NextResponse.redirect(fallbackUrl, { status: 303 });
  }

  try {
    await prisma.jobApplication.update({
      where: { id: applicationId },
      data: {
        status: newStatus,
      },
    });
  } catch (err) {
    console.error("Error updating application status:", err);
    // Still redirect; add error UI later if you want.
  }

  const redirectPath =
    redirectTo && redirectTo.startsWith("/")
      ? redirectTo
      : `/ats/jobs/${jobId}`;

  const url = new URL(request.url);
  url.pathname = redirectPath;
  url.search = "";

  return NextResponse.redirect(url, { status: 303 });
}
