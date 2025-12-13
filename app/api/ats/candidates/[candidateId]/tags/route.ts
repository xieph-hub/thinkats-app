import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getResourcinTenant } from "@/lib/tenant";
import { createSupabaseRouteClient } from "@/lib/supabaseRouteClient";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function redirectToCandidate(req: NextRequest, candidateId: string) {
  const redirectUrl = new URL(`/ats/candidates/${candidateId}`, req.url);
  return NextResponse.redirect(redirectUrl, { status: 303 });
}

function getFormString(formData: FormData, key: string) {
  const v = formData.get(key);
  return typeof v === "string" ? v.trim() : "";
}

export async function POST(
  req: NextRequest,
  { params }: { params: { candidateId: string } },
) {
  try {
    const candidateId = params?.candidateId?.trim();
    if (!candidateId) {
      return NextResponse.json(
        { ok: false, error: "Missing candidateId" },
        { status: 400 },
      );
    }

    // Tenant from host context
    const tenant = await getResourcinTenant();
    if (!tenant) {
      return NextResponse.json(
        { ok: false, error: "No tenant configured" },
        { status: 400 },
      );
    }

    const formData = await req.formData();
    const tagName = getFormString(formData, "tagName");

    // Empty tag -> just return to candidate page
    if (!tagName) {
      return redirectToCandidate(req, candidateId);
    }

    // Ensure caller is authenticated (ATS)
    const supabase = createSupabaseRouteClient();
    const {
      data: { user },
      error: userErr,
    } = await supabase.auth.getUser();

    if (userErr || !user?.email) {
      return NextResponse.json(
        { ok: false, error: "Unauthenticated" },
        { status: 401 },
      );
    }

    const email = user.email.toLowerCase();

    // App-level user row (global)
    const appUser = await prisma.user.upsert({
      where: { email },
      update: { isActive: true },
      create: {
        email,
        fullName: (user.user_metadata as any)?.full_name ?? null,
        globalRole: "USER",
      },
    });

    // Sanity check: candidate must belong to this tenant
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

    // Find or create tag (tenant-scoped) – case-insensitive match
    let tag = await prisma.tag.findFirst({
      where: {
        tenantId: tenant.id,
        name: { equals: tagName, mode: "insensitive" },
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

    // Attach tag to candidate (tenant-scoped). Avoid duplicates safely.
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

      // Optional audit trail (tenant-scoped)
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
          },
        },
      });
    }

    return redirectToCandidate(req, candidateId);
  } catch (err) {
    console.error("Candidate tags POST error:", err);
    return NextResponse.json(
      { ok: false, error: "Unexpected error adding tag" },
      { status: 500 },
    );
  }
}
