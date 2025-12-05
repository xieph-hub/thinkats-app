// app/api/ats/candidates/[candidateId]/notes/route.ts
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
    const noteBodyRaw = formData.get("noteBody");
    const noteBody =
      typeof noteBodyRaw === "string" ? noteBodyRaw.trim() : "";

    if (!noteBody) {
      return NextResponse.json(
        { ok: false, error: "Note body is required" },
        { status: 400 },
      );
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
      return NextResponse.json(
        { ok: false, error: "Candidate not found for this tenant" },
        { status: 404 },
      );
    }

    // Resolve current app user via Supabase session
    const supabase = createSupabaseRouteClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user || !user.email) {
      return NextResponse.json(
        { ok: false, error: "Unauthenticated" },
        { status: 401 },
      );
    }

    const email = user.email.toLowerCase();

    let appUser = await prisma.user.findUnique({
      where: { email },
    });

    if (!appUser) {
      appUser = await prisma.user.create({
        data: {
          email,
          fullName:
            (user.user_metadata as any)?.full_name ??
            (user.user_metadata as any)?.name ??
            null,
          globalRole: "USER",
          isActive: true,
        },
      });
    }

    const note = await prisma.note.create({
      data: {
        tenantId: candidate.tenantId,
        candidateId: candidate.id,
        applicationId: null,
        authorId: appUser.id,
        noteType: "general",
        body: noteBody,
        isPrivate: true,
      },
    });

    // Audit log (best-effort)
    await prisma.activityLog.create({
      data: {
        tenantId: candidate.tenantId,
        actorId: appUser.id,
        entityType: "candidate",
        entityId: candidate.id,
        action: "note_created",
        metadata: {
          noteId: note.id,
          length: noteBody.length,
        },
      },
    });

    const redirectUrl = new URL(
      `/ats/candidates/${candidate.id}`,
      req.url,
    );
    return NextResponse.redirect(redirectUrl, { status: 303 });
  } catch (err) {
    console.error("Create candidate note error:", err);
    return NextResponse.json(
      { ok: false, error: "Unexpected error creating note" },
      { status: 500 },
    );
  }
}
