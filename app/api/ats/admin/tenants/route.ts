// app/api/ats/admin/tenants/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { name, slug, primaryContactEmail, planTier, seats, maxOpenJobs } = body;

  // TODO: check current user is SUPER_ADMIN

  const tenant = await prisma.tenant.create({
    data: {
      name,
      slug,
      primaryContactEmail,
      notificationEmail: primaryContactEmail,
      plan: "paid",
      planTier: planTier ?? "STARTER",
      seats: seats ?? 3,
      maxSeats: seats ?? 3,
      maxOpenJobs: maxOpenJobs ?? 10,
      defaultTimezone: "Africa/Lagos",
      defaultCurrency: "USD",
    },
  });

  return NextResponse.json({ ok: true, tenant });
}
