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

// Light canonicalization so "  product  design " doesn't create variants.
function canonicalizeTagName(input: string) {
  return input.replace(/\s+/g, " ").trim();
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

    const tenant = await getResourcinTenant();
    if (!tenant) {
      return NextResponse.json(
        { ok: false, error: "No tenant configured" },
        { status: 400 },
      );
    }

    const formData = await req.formData();
    const raw = getFormString(formData, "tagName");
    const tagName = canonicalizeTagName(raw);

    if (!tagName) {
      return redirectToCandidate(req, candidateId);
    }

    // Auth gate (ATS only)
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

    await prisma.$transaction(async (tx) => {
      // Ensure app-level User row exists (global)
      const appUser = await tx.user.upsert({
        where: { email },
        update: { isActive: true },
        create: {
          email,
          fullName: (user.user_metadata as any)?.full_name ?? null,
          globalRole: "USER",
        },
      });

      // Confirm candidate belongs to tenant (critical)
      const candidate = await tx.candidate.findFirst({
        where: { id: candidateId, tenantId: tenant.id },
        select: { id: true },
      });

      if (!candidate) {
        // Throw to escape transaction with clean error response
        throw Object.assign(new Error("Candidate not found for this tenant"), {
          status: 404,
        });
      }

      // Upsert tag within tenant using composite unique
      // Your UI "Add tag…" is GENERAL kind by default.
      const tag = await tx.tag.upsert({
        where: {
          tenantId_name_kind: {
            tenantId: tenant.id,
            name: tagName,
            kind: "GENERAL",
          },
        },
        update: {
          // keep as-is, but touch updatedAt automatically
          // you can also set color here later if desired
        },
        create: {
          tenantId: tenant.id,
          name: tagName,
          kind: "GENERAL",
          isSystem: false,
        },
        select: { id: true, name: true },
      });

      // Upsert candidate-tag join (unique is candidateId+tagId)
      await tx.candidateTag.upsert({
        where: {
          candidateId_tagId: {
            candidateId: candidate.id,
            tagId: tag.id,
          },
        },
        update: {
          // nothing to update; existence is enough
        },
        create: {
          tenantId: tenant.id,
          candidateId: candidate.id,
          tagId: tag.id,
        },
      });

      // Audit trail (optional but good practice)
      await tx.activityLog.create({
        data: {
          tenantId: tenant.id,
          actorId: appUser.id,
          entityType: "candidate",
          entityId: candidate.id,
          action: "tag_added",
          metadata: {
            tagName: tag.name,
            tagId: tag.id,
            kind: "GENERAL",
          },
        },
      });
    });

    return redirectToCandidate(req, candidateId);
  } catch (err: any) {
    const status = typeof err?.status === "number" ? err.status : 500;

    if (status === 404) {
      return NextResponse.json(
        { ok: false, error: "Candidate not found for this tenant" },
        { status: 404 },
      );
    }

    console.error("Candidate tags POST error:", err);
    return NextResponse.json(
      { ok: false, error: "Unexpected error adding tag" },
      { status },
    );
  }
}
