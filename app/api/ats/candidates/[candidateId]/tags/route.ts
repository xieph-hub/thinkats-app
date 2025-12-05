// app/api/ats/candidates/[candidateId]/tags/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getResourcinTenant } from "@/lib/tenant";

export const runtime = "nodejs";

export async function POST(
  req: NextRequest,
  { params }: { params: { candidateId: string } },
) {
  try {
    const tenant = await getResourcinTenant();
    if (!tenant) {
      return NextResponse.json(
        { ok: false, error: "No tenant configured" },
        { status: 400 },
      );
    }

    const candidateId = params.candidateId;
    if (!candidateId) {
      return NextResponse.json(
        { ok: false, error: "Missing candidateId" },
        { status: 400 },
      );
    }

    const formData = await req.formData();
    const tagNameRaw = formData.get("tagName");
    const tagName =
      typeof tagNameRaw === "string" ? tagNameRaw.trim() : "";

    const redirectUrl = new URL(
      `/ats/candidates/${candidateId}`,
      req.url,
    );

    if (!tagName) {
      // Nothing to add – just bounce back to profile
      return NextResponse.redirect(redirectUrl, { status: 303 });
    }

    const candidate = await prisma.candidate.findFirst({
      where: {
        id: candidateId,
        tenantId: tenant.id,
      },
      select: {
        id: true,
        tenantId: true,
      },
    });

    if (!candidate) {
      return NextResponse.redirect(redirectUrl, { status: 303 });
    }

    // Find or create tag for this tenant
    let tag = await prisma.tag.findFirst({
      where: {
        tenantId: tenant.id,
        name: tagName,
      },
    });

    if (!tag) {
      tag = await prisma.tag.create({
        data: {
          tenantId: tenant.id,
          name: tagName,
        },
      });
    }

    // Check if candidate already has this tag
    const existing = await prisma.candidateTag.findFirst({
      where: {
        tenantId: tenant.id,
        candidateId: candidate.id,
        tagId: tag.id,
      },
    });

    if (!existing) {
      await prisma.candidateTag.create({
        data: {
          tenantId: tenant.id,
          candidateId: candidate.id,
          tagId: tag.id,
        },
      });

      // Audit log (optional / best-effort)
      await prisma.activityLog.create({
        data: {
          tenantId: tenant.id,
          actorId: null,
          entityType: "candidate",
          entityId: candidate.id,
          action: "tag_added",
          metadata: {
            tagId: tag.id,
            tagName: tag.name,
          },
        },
      });
    }

    return NextResponse.redirect(redirectUrl, { status: 303 });
  } catch (err) {
    console.error("Add candidate tag error:", err);
    // On failure, still go back to profile so UI isn't stuck
    const fallback = new URL(
      `/ats/candidates/${params.candidateId}`,
      req.url,
    );
    return NextResponse.redirect(fallback, { status: 303 });
  }
}
