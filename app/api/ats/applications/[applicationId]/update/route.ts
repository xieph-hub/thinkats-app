// app/api/ats/applications/[id]/update/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";

type ApplicationStatus =
  | "applied"
  | "screening"
  | "interview"
  | "offer"
  | "rejected";

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

    const body = await req.json().catch(() => ({}));

    const status = body.status as ApplicationStatus | undefined;
    const note = (body.note as string | undefined)?.trim() || null;

    if (!status && !note) {
      return NextResponse.json(
        {
          error: "Nothing to update. Provide at least a new status or a note.",
        },
        { status: 400 }
      );
    }

    // 1) Update application status (and only use columns we’re sure exist)
    const updatePayload: Record<string, unknown> = {};
    if (status) {
      updatePayload.status = status;
    }

    const { data: updated, error } = await supabaseAdmin
      .from("job_applications")
      .update(updatePayload)
      .eq("id", applicationId)
      .select("id, job_id, full_name, email, status")
      .single();

    if (error || !updated) {
      console.error("ATS applications/update – error updating application:", error);
      return NextResponse.json(
        { error: "Failed to update application" },
        { status: 500 }
      );
    }

    // 2) Log status change into application_events
    try {
      await supabaseAdmin.from("application_events").insert({
        application_id: updated.id,
        type: "status_change",
        payload: {
          new_status: status ?? updated.status,
          note,
        },
      });
    } catch (eventErr) {
      console.error(
        "ATS applications/update – failed to insert status_change event:",
        eventErr
      );
      // Don’t fail the whole request because of logging
    }

    // 3) Email hooks (stubbed, but logged as events)
    if (status === "interview" || status === "offer" || status === "rejected") {
      const templateKey =
        status === "interview"
          ? "interview_invite"
          : status === "offer"
          ? "offer"
          : "rejection";

      try {
        // This is where you’d actually send the email via Postmark / Resend / SES etc.
        // For now we just log an `email_queued` event.
        await supabaseAdmin.from("application_events").insert({
          application_id: updated.id,
          type: "email_queued",
          payload: {
            template: templateKey,
            to: updated.email,
            candidate_name: updated.full_name,
          },
        });
      } catch (emailErr) {
        console.error(
          "ATS applications/update – failed to log email_queued event:",
          emailErr
        );
      }
    }

    return NextResponse.json(
      {
        id: updated.id,
        status: updated.status,
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("ATS applications/update – unexpected error:", err);
    return NextResponse.json(
      { error: "Unexpected error" },
      { status: 500 }
    );
  }
}
