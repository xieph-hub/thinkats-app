// app/api/ats/applications/[id]/interviews/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const applicationId = params.id;

    if (!applicationId) {
      return NextResponse.json(
        { error: "Missing application id" },
        { status: 400 }
      );
    }

    const body = await req.json();

    const scheduledAt = body.scheduledAt as string | undefined;
    const type = (body.type as string | undefined) || null;
    const location = (body.location as string | undefined) || null;
    const notes = (body.notes as string | undefined) || null;

    if (!scheduledAt) {
      return NextResponse.json(
        { error: "scheduledAt (ISO string) is required" },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from("application_interviews")
      .insert({
        application_id: applicationId,
        scheduled_at: scheduledAt,
        type,
        location,
        notes,
      })
      .select(
        "id, application_id, scheduled_at, type, location, notes, created_at"
      )
      .single();

    if (error || !data) {
      console.error("Error scheduling interview:", error);
      return NextResponse.json(
        { error: "Failed to schedule interview" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        id: data.id,
        application_id: data.application_id,
        scheduled_at: data.scheduled_at,
        type: data.type,
        location: data.location,
        notes: data.notes,
        created_at: data.created_at,
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("Unexpected error in interview scheduling:", err);
    return NextResponse.json(
      { error: "Unexpected error" },
      { status: 500 }
    );
  }
}
