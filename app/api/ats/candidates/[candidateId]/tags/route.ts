// app/api/ats/candidates/[candidateId]/tags/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getResourcinTenant } from "@/lib/tenant";
import { createSupabaseRouteClient } from "@/lib/supabaseRouteClient";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function normalizeTagName(input: string) {
  return input
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
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
    const normalizedName = tagName ? normalizeTagName(tagName) : "";

    if (!normalizedName) {
      const redirectUrl = new URL(`/ats/candidates/${candidateId}`, req.url);
      return NextResponse.redirect(redirectUrl, { status: 303 });
    }

    // Ensure caller is authenticated
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

    // Ensure app-level User record
    const appUser = await prisma.user.upsert({
      where: { email },
      update: { isActive: true },
      create: {
        email,
        fullName: (user.user_metadata as any)?.full_name ?? null,
        globalRole: "USER",
      },
    });

    // Sanity check candidate belongs to this tenant
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

    // ✅ Best practice: atomic upsert on (tenantId, kind, normalizedName)
    const tag = await prisma.tag.upsert({
      where: {
        tenant_kind_normalizedName: {
          tenantId: tenant.id,
          kind: "GENERAL",
          normalizedName,
        },
      },
      update: {
        // Keep "display name" fresh if someone typed a nicer casing later
        name: tagName,
        updatedAt: new Date(),
      },
      create: {
        tenantId: tenant.id,
        kind: "GENERAL",
        name: tagName,
        normalizedName,
      },
    });

    // Attach tag if not already attached (unique constraint on candidateId+tagId)
    await prisma.candidateTag.upsert({
      where: {
        candidateId_tagId: {
          candidateId: candidate.id,
          tagId: tag.id,
        },
      },
      update: {},
      create: {
        tenantId: tenant.id,
        candidateId: candidate.id,
        tagId: tag.id,
      },
    });

    // Activity log (best-effort; don’t fail tag attach if logging fails)
    try {
      await prisma.activityLog.create({
        data: {
          tenantId: tenant.id,
          actorId: appUser.id,
          entityType: "candidate",
          entityId: candidate.id,
          action: "tag_added",
          metadata: { tagId: tag.id, tagName: tag.name },
        },
      });
    } catch (e) {
      console.warn("ActivityLog create failed (non-blocking):", e);
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
