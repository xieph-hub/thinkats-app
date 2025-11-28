// app/api/ats/candidates/bulk/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * Bulk candidate stage updates.
 *
 * - JSON requests (fetch) => return JSON { success, updated, stage }
 * - Form POST from /ats/candidates => redirect back to /ats/candidates
 */
export async function POST(request: Request) {
  const contentType = request.headers.get("content-type") || "";

  // 🔹 Path 1: JSON body (programmatic bulk call)
  if (contentType.includes("application/json")) {
    try {
      const body = await request.json();
      const { candidateIds, newStage } = body ?? {};

      if (!Array.isArray(candidateIds) || !newStage) {
        return NextResponse.json(
          {
            success: false,
            error: "Missing candidateIds or newStage",
          },
          { status: 400 },
        );
      }

      const result = await prisma.jobApplication.updateMany({
        where: {
          candidateId: { in: candidateIds as string[] },
        },
        data: {
          stage: newStage as string,
        },
      });

      return NextResponse.json({
        success: true,
        updated: result.count,
        stage: newStage,
      });
    } catch (err) {
      console.error("Bulk candidate stage JSON error:", err);
      return NextResponse.json(
        { success: false, error: "Failed to update stage" },
        { status: 500 },
      );
    }
  }

  // 🔹 Path 2: form POST from /ats/candidates (your bulk UI)
  try {
    const formData = await request.formData();

    // Try a few common field names for selected IDs
    const ids: string[] = [];
    const idKeys = [
      "candidateIds",
      "candidateId",
      "selectedCandidateIds",
      "selected",
    ];

    for (const key of idKeys) {
      const all = formData.getAll(key);
      for (const v of all) {
        if (typeof v === "string" && v.trim()) {
          ids.push(v.trim());
        }
      }
    }

    const uniqueCandidateIds = Array.from(new Set(ids));

    const newStage =
      (formData.get("newStage") as string | null) ||
      (formData.get("stage") as string | null) ||
      "";

    if (uniqueCandidateIds.length === 0 || !newStage) {
      const fallbackUrl = new URL(request.url);
      fallbackUrl.pathname = "/ats/candidates";
      fallbackUrl.search = "";
      return NextResponse.redirect(fallbackUrl, { status: 303 });
    }

    const result = await prisma.jobApplication.updateMany({
      where: {
        candidateId: { in: uniqueCandidateIds },
      },
      data: {
        stage: newStage,
      },
    });

    console.log(
      `Bulk candidate stage update via form: stage=${newStage}, updated=${result.count}`,
    );

    const redirectUrl = new URL(request.url);
    redirectUrl.pathname = "/ats/candidates";
    redirectUrl.search = "";
    return NextResponse.redirect(redirectUrl, { status: 303 });
  } catch (err) {
    console.error("Bulk candidate stage FORM error:", err);
    const fallbackUrl = new URL(request.url);
    fallbackUrl.pathname = "/ats/candidates";
    fallbackUrl.search = "";
    return NextResponse.redirect(fallbackUrl, { status: 303 });
  }
}
