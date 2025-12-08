// app/api/ats/admin/workspaces/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerUser } from "@/lib/auth/getServerUser";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const user = await getServerUser();

  // 🔐 Only SUPER_ADMIN can create workspaces
  if (!user || user.globalRole !== "SUPER_ADMIN") {
    return NextResponse.json(
      { ok: false, error: "Forbidden: super admin only." },
      { status: 403 },
    );
  }

  const formData = await req.formData();

  const name = String(formData.get("name") ?? "").trim();
  const slug = String(formData.get("slug") ?? "")
    .trim()
    .toLowerCase();

  const primaryContactEmailRaw = formData.get("primaryContactEmail");
  const primaryContactEmail =
    typeof primaryContactEmailRaw === "string" &&
    primaryContactEmailRaw.trim().length > 0
      ? primaryContactEmailRaw.trim().toLowerCase()
      : null;

  const planTierRaw = String(formData.get("planTier") ?? "STARTER").toUpperCase();
  const planTier =
    planTierRaw === "GROWTH" ||
    planTierRaw === "AGENCY" ||
    planTierRaw === "ENTERPRISE"
      ? planTierRaw
      : "STARTER";

  const seatsRaw = String(formData.get("seats") ?? "3");
  const seatsParsed = parseInt(seatsRaw, 10);
  const seats = Number.isNaN(seatsParsed) ? 3 : Math.max(seatsParsed, 1);

  const maxOpenJobsRaw = formData.get("maxOpenJobs");
  const maxOpenJobs =
    typeof maxOpenJobsRaw === "string" && maxOpenJobsRaw.trim().length > 0
      ? parseInt(maxOpenJobsRaw, 10)
      : null;

  const defaultTimezone =
    String(formData.get("defaultTimezone") ?? "").trim() || "Africa/Lagos";
  const defaultCurrency =
    String(formData.get("defaultCurrency") ?? "").trim() || "USD";

  if (!name || !slug) {
    return NextResponse.redirect(
      new URL(
        `/ats/admin/tenants?error=${encodeURIComponent(
          "Workspace name and slug are required.",
        )}`,
        req.url,
      ),
    );
  }

  try {
    // Small helper: 14-day trial window
    const now = new Date();
    const trialEndsAt = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);

    await prisma.tenant.create({
      data: {
        name,
        slug,
        status: "active",
        primaryContactEmail,
        notificationEmail: primaryContactEmail,
        // legacy "plan" field – keep in sync with tier if you still have it
        plan: planTier.toLowerCase(),

        // new billing/plan fields (added in your updated Prisma schema)
        planTier, // mapped to tenants.plan_tier
        seats, // tenants.seats
        maxOpenJobs: maxOpenJobs ?? undefined, // tenants.max_open_jobs
        defaultTimezone, // tenants.default_timezone
        defaultCurrency, // tenants.default_currency
        billingStatus: "trial", // tenants.billing_status
        trialEndsAt,
      },
    });

    return NextResponse.redirect(
      new URL("/ats/admin/tenants?created=1", req.url),
    );
  } catch (error: any) {
    console.error("[admin/workspaces] create workspace error", error);

    let message = "Failed to create workspace.";

    // Prisma unique constraint on slug
    if (error?.code === "P2002") {
      message =
        "That workspace slug is already in use. Choose a different slug.";
    }

    return NextResponse.redirect(
      new URL(
        `/ats/admin/tenants?error=${encodeURIComponent(message)}`,
        req.url,
      ),
    );
  }
}
