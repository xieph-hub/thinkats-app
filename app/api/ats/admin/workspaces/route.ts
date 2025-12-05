// app/api/ats/admin/workspaces/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createSupabaseRouteClient } from "@/lib/supabaseRouteClient";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { isSuperAdminUser } from "@/lib/officialEmail";

type Plan = "free" | "pro" | "enterprise";

export const runtime = "nodejs";

export async function GET(_req: NextRequest) {
  try {
    const supabase = createSupabaseRouteClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user || !isSuperAdminUser(user)) {
      return NextResponse.json(
        { ok: false, error: "Forbidden" },
        { status: 403 },
      );
    }

    const { data, error: dbError } = await supabaseAdmin
      .from("ats_scoring_settings")
      .select("workspace_slug, plan, hiring_mode, created_at, updated_at")
      .order("workspace_slug");

    if (dbError) {
      console.error("GET admin/workspaces – error:", dbError);
      return NextResponse.json(
        { ok: false, error: "Failed to load workspaces" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      ok: true,
      workspaces: data ?? [],
    });
  } catch (err) {
    console.error("GET admin/workspaces – unexpected:", err);
    return NextResponse.json(
      { ok: false, error: "Unexpected error" },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const workspaceSlug = (body.workspaceSlug as string | undefined)?.trim();
    const plan = body.plan as Plan | undefined;

    if (!workspaceSlug || !plan) {
      return NextResponse.json(
        { ok: false, error: "workspaceSlug and plan are required" },
        { status: 400 },
      );
    }

    if (!["free", "pro", "enterprise"].includes(plan)) {
      return NextResponse.json(
        { ok: false, error: "Invalid plan" },
        { status: 400 },
      );
    }

    const supabase = createSupabaseRouteClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user || !isSuperAdminUser(user)) {
      return NextResponse.json(
        { ok: false, error: "Forbidden" },
        { status: 403 },
      );
    }

    const { data, error: dbError } = await supabaseAdmin
      .from("ats_scoring_settings")
      .upsert(
        {
          workspace_slug: workspaceSlug,
          plan,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "workspace_slug" },
      )
      .select("workspace_slug, plan, hiring_mode")
      .maybeSingle();

    if (dbError || !data) {
      console.error("POST admin/workspaces – error:", dbError);
      return NextResponse.json(
        { ok: false, error: "Failed to update plan" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      ok: true,
      workspace: data,
    });
  } catch (err) {
    console.error("POST admin/workspaces – unexpected:", err);
    return NextResponse.json(
      { ok: false, error: "Unexpected error" },
      { status: 500 },
    );
  }
}
