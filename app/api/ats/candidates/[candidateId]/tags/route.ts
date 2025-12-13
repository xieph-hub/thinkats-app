// app/api/ats/candidates/[candidateId]/tags/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getResourcinTenant } from "@/lib/tenant";
import { createSupabaseRouteClient } from "@/lib/supabaseRouteClient";

export const runtime = "nodejs";

function normalizeTagName(input: string) {
  return input.trim().toLowerCase().replace(/\s+/g, " ");
}

export async function POST(
  req: NextRequest,
  { params }: { params: { candidateId: string } },
) {
  try {
    const candidateId = params.candidateId;
    if (!candidateId) {
      return NextResponse.json(
        { ok: false, error: "Missing candidateId" },
        { status: 400 },
      );
    }

    const tenant = await getResourcinTenant();
    if (!tenant) {
      return NextResponse.json(
        { ok: false, error: "No tenant configured" },
        { status: 400 },
      );
    }

    const formData = await req.formData();
    const rawTagName = formData.get("tagName");
    const tagName = typeof rawTagName === "string" ? rawTagName.trim() : "";

    if (!tagName) {
      const redirectUrl = new URL(`/ats/candidates/${candidateId}`, req.url);
      return NextResponse.redirect(redirectUrl, { status: 303 });
    }

    // Ensure caller is authenticated (future audit trail)
    const supabase = createSupabaseRouteClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user || !user.email) {
      return NextResponse.json(
        { ok: false, error: "Unauthenticated" },
        { status: 401 },
      );
    }

    const email = user.email.toLowerCase();

    // Ensure app-level User row exists
    const appUser = await prisma.user.upsert({
      where: { email },
      update: { isActive: true },
      create: {
        email,
        fullName: (user.user_metadata as any)?.full_name ?? null,
        globalRole: "USER",
      },
    });

    // Candidate must belong to tenant
    const candidate = await prisma.candidate.findFirst({
      where: { id: candidateId, tenantId: tenant.id },
      select: { id: true },
    });

    if (!candidate) {
      return NextResponse.json(
        { ok: false, error: "Candidate not found for this tenant" },
        { status: 404 },
      );
    }

    const normalizedName = normalizeTagName(tagName);

    // ✅ Atomic + concurrency-safe tag create/get
    const tag = await prisma.tag.upsert({
      where: {
        tenantId_normalizedName_kind: {
          tenantId: tenant.id,
          normalizedName,
          kind: "GENERAL",
        },
      },
      update: {
        // If user typed different casing, keep display name fresh
        name: tagName,
      },
      create: {
        tenantId: tenant.id,
        name: tagName,
        normalizedName,
        kind: "GENERAL",
      },
    });

    // Link tag → candidate (safe by unique constraint)
    const existing = await prisma.candidateTag.findFirst({
      where: {
        tenantId: tenant.id,
        candidateId: candidate.id,
        tagId: tag.id,
      },
      select: { id: true },
    });

    if (!existing) {
      await prisma.candidateTag.create({
        data: {
          tenantId: tenant.id,
          candidateId: candidate.id,
          tagId: tag.id,
        },
      });

      await prisma.activityLog.create({
        data: {
          tenantId: tenant.id,
          actorId: appUser.id,
          entityType: "candidate",
          entityId: candidate.id,
          action: "tag_added",
          metadata: {
            tagId: tag.id,
            tagName: tag.name,
            normalizedName: tag.normalizedName,
            kind: tag.kind,
          },
        },
      });
    }

    const redirectUrl = new URL(`/ats/candidates/${candidateId}`, req.url);
    return NextResponse.redirect(redirectUrl, { status: 303 });
  } catch (err) {
    console.error("Candidate tags POST error:", err);
    return NextResponse.json(
      { ok: false, error: "Unexpected error adding tag" },
      { status: 500 },
    );
  }
}
