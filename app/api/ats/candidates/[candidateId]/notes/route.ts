// app/api/ats/candidates/[candidateId]/notes/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getResourcinTenant } from "@/lib/tenant";
import { createSupabaseRouteClient } from "@/lib/supabaseRouteClient";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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
    const noteBodyRaw = formData.get("noteBody");
    const noteBody =
      typeof noteBodyRaw === "string" ? noteBodyRaw.trim() : "";

    if (!noteBody) {
      const redirectUrl = new URL(`/ats/candidates/${candidateId}`, req.url);
      return NextResponse.redirect(redirectUrl, { status: 303 });
    }

    // Optional future: allow binding to a specific application
    const applicationIdRaw = formData.get("applicationId");
    const applicationId =
      typeof applicationIdRaw === "string" && applicationIdRaw.trim()
        ? applicationIdRaw.trim()
        : null;

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

    // Ensure we have an app-level User record
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

    // Optional: if applicationId is provided, ensure it belongs to same tenant
    let validatedApplicationId: string | null = null;
    if (applicationId) {
      const app = await prisma.jobApplication.findFirst({
        where: {
          id: applicationId,
          job: {
            tenantId: tenant.id,
          },
        },
        select: { id: true },
      });
      if (app) {
        validatedApplicationId = app.id;
      }
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
        isPrivate: true, // internal-only by default
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

    const redirectUrl = new URL(`/ats/candidates/${candidateId}`, req.url);
    return NextResponse.redirect(redirectUrl, { status: 303 });
  } catch (err) {
    console.error("Candidate notes POST error:", err);
    return NextResponse.json(
      { ok: false, error: "Unexpected error adding note" },
      { status: 500 },
    );
  }
}
