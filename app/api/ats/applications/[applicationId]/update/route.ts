// app/api/ats/applications/[id]/status/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";

export async function PATCH(
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
    const status = (body.status as string | undefined)?.trim();
    const note = (body.note as string | undefined)?.trim() || null;

    if (!status) {
      return NextResponse.json(
        { error: "New status is required" },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from("job_applications")
      .update({
        status,
        status_note: note,
        status_changed_at: new Date().toISOString(),
      })
      .eq("id", applicationId)
      .select("id, status, status_note, status_changed_at")
      .maybeSingle();

    if (error || !data) {
      console.error("Error updating application status:", error);
      return NextResponse.json(
        { error: "Failed to update status" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        id: data.id,
        status: data.status,
        status_note: data.status_note,
        status_changed_at: data.status_changed_at,
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("Unexpected error in status update:", err);
    return NextResponse.json(
      { error: "Unexpected error" },
      { status: 500 }
    );
  }
}
