// app/api/ats/admin/workspaces/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerUser } from "@/lib/auth/getServerUser";

export const dynamic = "force-dynamic";

type CreateWorkspacePayload = {
  slug?: string;
  name: string;
  primaryContactEmail?: string;
  notificationEmail?: string;
  planTier?: "STARTER" | "GROWTH" | "AGENCY" | "ENTERPRISE";
  seats?: number;
  maxOpenJobs?: number;
  defaultTimezone?: string;
  defaultCurrency?: string;
};

function normaliseSlug(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export async function POST(req: NextRequest) {
  try {
    const ctx = await getServerUser();

    // 🔐 Only SUPER_ADMIN can create workspaces
    if (!ctx || !ctx.isSuperAdmin) {
      return NextResponse.json(
        { ok: false, error: "Forbidden: super admin only." },
        { status: 403 },
      );
    }

    const { user } = ctx;
    const body = (await req.json()) as CreateWorkspacePayload;

    const name = body.name?.trim();
    const slug = normaliseSlug(body.slug || name || "");

    if (!name || !slug) {
      return NextResponse.json(
        { ok: false, error: "Name and slug are required." },
        { status: 400 },
      );
    }

    // Uniqueness check for slug
    const existing = await prisma.tenant.findUnique({ where: { slug } });
    if (existing) {
      return NextResponse.json(
        { ok: false, error: "Slug is already in use." },
        { status: 409 },
      );
    }

    const primaryContactEmail = body.primaryContactEmail
      ? body.primaryContactEmail.toLowerCase().trim()
      : null;

    const notificationEmail = body.notificationEmail
      ? body.notificationEmail.toLowerCase().trim()
      : primaryContactEmail;

    const tenant = await prisma.tenant.create({
      data: {
        slug,
        name,
        primaryContactEmail,
        notificationEmail,
        // Billing / limits from your updated Prisma schema
        planTier: body.planTier ?? "STARTER",
        plan: body.planTier ?? "STARTER",
        seats: body.seats ?? 3,
        maxSeats: body.seats ?? 3,
        maxOpenJobs: body.maxOpenJobs ?? 10,
        defaultTimezone: body.defaultTimezone ?? "Africa/Lagos",
        defaultCurrency: body.defaultCurrency ?? "USD",
        billingStatus: "trialing",
      },
    });

    // Optionally attach the current SUPER_ADMIN as owner of this workspace
    if (user?.id) {
      await prisma.userTenantRole.create({
        data: {
          userId: user.id,
          tenantId: tenant.id,
          role: "owner",
          isPrimary: true,
        },
      });
    }

    return NextResponse.json(
      {
        ok: true,
        tenant,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("POST /api/ats/admin/workspaces error", error);
    return NextResponse.json(
      { ok: false, error: "Failed to create workspace." },
      { status: 500 },
    );
  }
}
