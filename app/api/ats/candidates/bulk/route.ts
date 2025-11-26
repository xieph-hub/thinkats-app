// app/api/ats/candidates/bulk/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getResourcinTenant } from "@/lib/tenant";

export async function POST(req: Request) {
  const tenant = await getResourcinTenant();
  if (!tenant) {
    return NextResponse.json(
      { error: "Missing tenant" },
      { status: 400 },
    );
  }

  const formData = await req.formData();

  const action = formData.get("action") as string | null;
  const rawIds = formData.getAll("applicationIds") || [];
  const applicationIds = rawIds
    .map((v) => (typeof v === "string" ? v : String(v)))
    .filter((v) => v.length > 0);

  const q = (formData.get("q") as string | null) || "";
  const jobId = (formData.get("jobId") as string | null) || "all";
  const source =
    (formData.get("source") as string | null) || "all";
  const view = (formData.get("view") as string | null) || "all";

  const redirectUrl = new URL("/ats/candidates", req.url);
  if (q) redirectUrl.searchParams.set("q", q);
  if (jobId && jobId !== "all") {
    redirectUrl.searchParams.set("jobId", jobId);
  }
  if (source && source !== "all") {
    redirectUrl.searchParams.set("source", source);
  }
  if (view && view !== "all") {
    redirectUrl.searchParams.set("view", view);
  }

  if (!action || applicationIds.length === 0) {
    return NextResponse.redirect(redirectUrl);
  }

  try {
    if (action === "setStage") {
      const stage = (formData.get("stage") as string | null) || "";
      if (stage) {
        await prisma.jobApplication.updateMany({
          where: {
            id: { in: applicationIds },
            job: { tenantId: tenant.id },
          },
          data: {
            stage,
          } as any, // assumes `stage` scalar field on JobApplication
        });
      }
      return NextResponse.redirect(redirectUrl);
    }

    if (action === "setStatus") {
      const status =
        (formData.get("status") as string | null) || "";
      if (status) {
        await prisma.jobApplication.updateMany({
          where: {
            id: { in: applicationIds },
            job: { tenantId: tenant.id },
          },
          data: {
            status,
          } as any, // assumes `status` scalar field on JobApplication
        });
      }
      return NextResponse.redirect(redirectUrl);
    }

    if (action === "addTag") {
      const tag = (formData.get("tag") as string | null)?.trim();
      if (tag) {
        const apps = await prisma.jobApplication.findMany({
          where: {
            id: { in: applicationIds },
            job: { tenantId: tenant.id },
          },
          select: {
            candidateId: true,
          },
        });

        const candidateIds = Array.from(
          new Set(apps.map((a) => a.candidateId)),
        ).filter((id) => !!id);

        await Promise.all(
          candidateIds.map((candidateId) =>
            prisma.candidate.update({
              where: { id: candidateId },
              data: {
                // Requires `tags String[] @default([])` on Candidate model
                tags: {
                  push: tag,
                },
              } as any,
            }),
          ),
        );
      }
      return NextResponse.redirect(redirectUrl);
    }

    if (action === "exportEmails") {
      const apps = await prisma.jobApplication.findMany({
        where: {
          id: { in: applicationIds },
          job: { tenantId: tenant.id },
        },
        select: {
          email: true,
        },
      });

      const emails = Array.from(
        new Set(
          apps
            .map((a) => a.email)
            .filter((e): e is string => !!e && e.length > 0),
        ),
      ).join(", ");

      return new NextResponse(emails || "No emails", {
        status: 200,
        headers: {
          "content-type": "text/plain; charset=utf-8",
        },
      });
    }

    // Fallback – nothing matched
    return NextResponse.redirect(redirectUrl);
  } catch (error) {
    console.error("Bulk candidates action error", error);
    return NextResponse.redirect(redirectUrl);
  }
}
