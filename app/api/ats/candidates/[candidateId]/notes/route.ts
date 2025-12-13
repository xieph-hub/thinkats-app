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

    const tenant = await getResourcinTenant();
    if (!tenant) {
      return NextResponse.json(
        { ok: false, error: "No tenant configured" },
        { status: 400 },
      );
    }

    const formData = await req.formData();

    // Your page uses textarea name="body"
    // Your earlier API used "noteBody"
    const noteBody =
      getFormString(formData, "body") || getFormString(formData, "noteBody");

    if (!noteBody) {
      return redirectToCandidate(req, candidateId);
    }

    const applicationIdRaw = getFormString(formData, "applicationId");
    const applicationId = applicationIdRaw ? applicationIdRaw : null;

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

      // Confirm candidate belongs to tenant
      const candidate = await tx.candidate.findFirst({
        where: { id: candidateId, tenantId: tenant.id },
        select: { id: true },
      });

      if (!candidate) {
        throw Object.assign(new Error("Candidate not found for this tenant"), {
          status: 404,
        });
      }

      // Optional: validate applicationId is in this tenant
      let validatedApplicationId: string | null = null;
      if (applicationId) {
        const app = await tx.jobApplication.findFirst({
          where: {
            id: applicationId,
            job: { tenantId: tenant.id },
            // Optional extra-safety if you want:
            // candidateId: candidate.id,
          },
          select: { id: true },
        });
        if (app) validatedApplicationId = app.id;
      }

      const note = await tx.note.create({
        data: {
          tenantId: tenant.id,
          candidateId: candidate.id,
          applicationId: validatedApplicationId,
          authorId: appUser.id,
          authorName: appUser.fullName ?? appUser.email ?? null,
          noteType: "general",
          body: noteBody,
          isPrivate: true,
        },
        select: { id: true },
      });

      await tx.activityLog.create({
        data: {
          tenantId: tenant.id,
          actorId: appUser.id,
          entityType: "candidate",
          entityId: candidate.id,
          action: "note_created",
          metadata: {
            noteId: note.id,
            applicationId: validatedApplicationId,
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

    console.error("Candidate notes POST error:", err);
    return NextResponse.json(
      { ok: false, error: "Unexpected error adding note" },
      { status },
    );
  }
}
