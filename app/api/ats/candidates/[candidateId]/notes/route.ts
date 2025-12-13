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

    // IMPORTANT: your page uses textarea name="body"
    // older route expected "noteBody"
    const noteBody =
      getFormString(formData, "body") || getFormString(formData, "noteBody");

    if (!noteBody) {
      return redirectToCandidate(req, candidateId);
    }

    const applicationIdRaw = getFormString(formData, "applicationId");
    const applicationId = applicationIdRaw ? applicationIdRaw : null;

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

    // Optional: if applicationId supplied, validate it is within this tenant
    let validatedApplicationId: string | null = null;
    if (applicationId) {
      const app = await prisma.jobApplication.findFirst({
        where: {
          id: applicationId,
          job: { tenantId: tenant.id },
          // (optional extra safety) also ensure this application is tied to candidateId if your schema allows:
          // candidateId: candidate.id,
        },
        select: { id: true },
      });

      if (app) validatedApplicationId = app.id;
    }

    const note = await prisma.note.create({
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
    });

    await prisma.activityLog.create({
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

    return redirectToCandidate(req, candidateId);
  } catch (err) {
    console.error("Candidate notes POST error:", err);
    return NextResponse.json(
      { ok: false, error: "Unexpected error adding note" },
      { status: 500 },
    );
  }
}
