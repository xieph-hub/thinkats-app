// app/api/apply/route.ts

import { NextRequest, NextResponse } from "next/server";

/**
 * Legacy generic apply endpoint (Prisma-based) – now disabled.
 *
 * We have moved the ATS data model to Supabase tables (jobs, job_applications, etc.)
 * so this Prisma-based handler is no longer valid.
 *
 * If you want a generic "apply without specific job" endpoint later,
 * we will re-implement this route using supabaseAdmin and Supabase tables.
 */

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);

  return NextResponse.json(
    {
      error:
        "The /api/apply endpoint is currently disabled. Please apply via a specific job page.",
      receivedPayload: body ?? null,
    },
    { status: 410 } // 410 Gone – intentional deprecation
  );
}
