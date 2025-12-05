// app/api/ats/settings/scoring/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createSupabaseRouteClient } from "@/lib/supabaseRouteClient";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { isOfficialUser, isSuperAdminUser } from "@/lib/officialEmail";

export const runtime = "nodejs";

type Plan = "free" | "pro" | "enterprise";

const WORKSPACE_SLUG =
  process.env.THINKATS_WORKSPACE_SLUG || "resourcin";

export async function GET(_req: NextRequest) {
  try {
    const supabase = createSupabaseRouteClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const isSuperAdmin = isSuperAdminUser(user || null);

    // Load row from Supabase
    const { data, error } = await supabaseAdmin
      .from("ats_scoring_settings")
      .select("plan, hiring_mode, config")
      .eq("workspace_slug", WORKSPACE_SLUG)
      .maybeSingle();

    if (error) {
      console.error("GET scoring settings – Supabase error:", error);
    }

    const planFromDb = (data?.plan as Plan | null) ?? null;
    const plan: Plan =
      planFromDb || (isSuperAdmin ? "enterprise" : "free");

    const hiringMode = data?.hiring_mode || "balanced";
    const rawConfig = (data?.config as any) || {};

    return NextResponse.json({
      ok: true,
      plan,
      hiringMode,
      config: rawConfig,
      isSuperAdmin,
    });
  } catch (err) {
    console.error("GET scoring settings – unexpected error:", err);
    return NextResponse.json(
      { ok: false, error: "Failed to load scoring settings" },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const requestedHiringMode =
      (body.hiringMode as string | undefined) || "balanced";
    const incomingConfig = (body.config as any) || {};
    const requestedPlan = body.plan as Plan | undefined; // optional – only super-admin can set

    const supabase = createSupabaseRouteClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user || !isOfficialUser(user)) {
      return NextResponse.json(
        { ok: false, error: "Not authorised" },
        { status: 403 },
      );
    }

    const isSuperAdmin = isSuperAdminUser(user);

    // Only super-admin can actually change the plan
    let planToPersist: Plan | undefined;
    if (
      isSuperAdmin &&
      requestedPlan &&
      ["free", "pro", "enterprise"].includes(requestedPlan)
    ) {
      planToPersist = requestedPlan;
    }

    // Upsert row
    const upsertPayload: any = {
      workspace_slug: WORKSPACE_SLUG,
      hiring_mode: requestedHiringMode,
      config: incomingConfig,
      updated_at: new Date().toISOString(),
    };

    if (planToPersist) {
      upsertPayload.plan = planToPersist;
    }

    const { data, error } = await supabaseAdmin
      .from("ats_scoring_settings")
      .upsert(upsertPayload, {
        onConflict: "workspace_slug",
      })
      .select("plan, hiring_mode, config")
      .maybeSingle();

    if (error || !data) {
      console.error("POST scoring settings – Supabase error:", error);
      return NextResponse.json(
        { ok: false, error: "Failed to save scoring settings" },
        { status: 500 },
      );
    }

    const plan: Plan =
      (data.plan as Plan | null) ||
      (isSuperAdmin ? "enterprise" : "free");

    return NextResponse.json({
      ok: true,
      plan,
      hiringMode: data.hiring_mode || "balanced",
      config: data.config || {},
      isSuperAdmin,
    });
  } catch (err) {
    console.error("POST scoring settings – unexpected error:", err);
    return NextResponse.json(
      { ok: false, error: "Failed to save scoring settings" },
      { status: 500 },
    );
  }
}
