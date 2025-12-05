// app/api/ats/views/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getResourcinTenant } from "@/lib/tenant";
import { createSupabaseRouteClient } from "@/lib/supabaseRouteClient";

export const runtime = "nodejs";

// Helper: resolve current app user (optional)
async function getCurrentAppUserEmail() {
  try {
    const supabase = createSupabaseRouteClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user || !user.email) return null;
    return user.email.toLowerCase();
  } catch {
    return null;
  }
}

// GET /api/ats/views?scope=job_applications&includeShared=1
export async function GET(req: NextRequest) {
  try {
    const tenant = await getResourcinTenant();
    if (!tenant) {
      return NextResponse.json(
        { ok: false, error: "No tenant configured" },
        { status: 400 },
      );
    }

    const url = new URL(req.url);
    const scope = url.searchParams.get("scope") || undefined;
    const includeShared = url.searchParams.get("includeShared") === "1";

    const email = await getCurrentAppUserEmail();
    let appUser = null as Awaited<
      ReturnType<typeof prisma.user.findUnique>
    > | null;

    if (email) {
      appUser = await prisma.user.findUnique({
        where: { email },
      });
    }

    const where: any = {
      tenantId: tenant.id,
    };

    if (scope) {
      where.scope = scope;
    }

    if (appUser) {
      if (includeShared) {
        // User’s own views OR shared views within this tenant
        where.OR = [
          { ownerId: appUser.id },
          { isShared: true },
        ];
      } else {
        // Only user’s own views
        where.ownerId = appUser.id;
      }
    } else {
      // No identified user – only show shared views
      where.isShared = true;
    }

    const views = await prisma.savedView.findMany({
      where,
      orderBy: {
        createdAt: "asc",
      },
    });

    return NextResponse.json({ ok: true, views });
  } catch (err) {
    console.error("GET /api/ats/views error:", err);
    return NextResponse.json(
      { ok: false, error: "Unexpected error listing views" },
      { status: 500 },
    );
  }
}

// POST /api/ats/views
// Body supports both { params } and { filters } for compatibility.
// If body.id is present, we treat as update; otherwise create.
export async function POST(req: NextRequest) {
  try {
    const tenant = await getResourcinTenant();
    if (!tenant) {
      return NextResponse.json(
        { ok: false, error: "No tenant configured" },
        { status: 400 },
      );
    }

    const body = await req.json().catch(() => ({}));

    const {
      id,
      scope,
      name,
      // old naming
      params,
      // new naming
      filters,
      sort,
      isDefault,
      isShared,
    } = body ?? {};

    if (!scope || !name) {
      return NextResponse.json(
        { ok: false, error: "Missing required fields: scope, name" },
        { status: 400 },
      );
    }

    const filtersPayload = filters ?? params ?? null;

    const email = await getCurrentAppUserEmail();
    let appUser = null as Awaited<
      ReturnType<typeof prisma.user.findUnique>
    > | null;

    if (email) {
      appUser = await prisma.user.findUnique({
        where: { email },
      });

      // create minimal app user if needed (same pattern as notes API)
      if (!appUser) {
        appUser = await prisma.user.create({
          data: {
            email,
            fullName: null,
            globalRole: "USER",
            isActive: true,
          },
        });
      }
    }

    const ownerId = appUser?.id ?? null;
    const markDefault = Boolean(isDefault);
    const sharedFlag = Boolean(isShared);

    let savedView;

    if (id) {
      // Update existing view
      savedView = await prisma.savedView.update({
        where: { id },
        data: {
          name,
          filters: filtersPayload,
          sort: sort ?? null,
          isDefault: markDefault,
          isShared: sharedFlag,
        },
      });

      // If this view is now default, clear default on other views for same owner+scope
      if (markDefault) {
        await prisma.savedView.updateMany({
          where: {
            tenantId: tenant.id,
            scope,
            ownerId: ownerId,
            NOT: { id: savedView.id },
          },
          data: {
            isDefault: false,
          },
        });
      }
    } else {
      // Create new view
      savedView = await prisma.savedView.create({
        data: {
          tenantId: tenant.id,
          ownerId,
          scope,
          name,
          filters: filtersPayload,
          sort: sort ?? null,
          isDefault: markDefault,
          isShared: sharedFlag,
        },
      });

      if (markDefault) {
        await prisma.savedView.updateMany({
          where: {
            tenantId: tenant.id,
            scope,
            ownerId: ownerId,
            NOT: { id: savedView.id },
          },
          data: {
            isDefault: false,
          },
        });
      }
    }

    return NextResponse.json({
      ok: true,
      view: savedView,
    });
  } catch (err) {
    console.error("POST /api/ats/views error:", err);
    return NextResponse.json(
      { ok: false, error: "Unexpected error saving view" },
      { status: 500 },
    );
  }
}
