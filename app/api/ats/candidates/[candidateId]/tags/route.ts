// app/api/ats/candidates/[candidateId]/tags/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getResourcinTenant } from "@/lib/tenant";
import { createSupabaseRouteClient } from "@/lib/supabaseRouteClient";

export const runtime = "nodejs";

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
    const tagName =
      typeof rawTagName === "string" ? rawTagName.trim() : "";

    if (!tagName) {
      // Nothing to do — bounce back to candidate page.
      const redirectUrl = new URL(`/ats/candidates/${candidateId}`, req.url);
      return NextResponse.redirect(redirectUrl, { status: 303 });
    }

    // Ensure caller is an authenticated app user (for audit later if needed)
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

    // Make sure we have an app-level User record for this email
    const appUser = await prisma.user.upsert({
      where: { email },
      update: { isActive: true },
      create: {
        email,
        fullName: user.user_metadata?.full_name ?? null,
        globalRole: "USER",
      },
    });

    // Sanity check candidate belongs to this tenant
    const candidate = await prisma.candidate.findFirst({
      where: {
        id: candidateId,
        tenantId: tenant.id,
      },
      select: { id: true },
    });

    if (!candidate) {
      return NextResponse.json(
        { ok: false, error: "Candidate not found for this tenant" },
        { status: 404 },
      );
    }

    // Find or create Tag for this tenant
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
          // you can later add color logic here if you like
        },
      });
    }

    // Attach tag to candidate if not already attached
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

      // Optional: log to ActivityLog for audit trail
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
