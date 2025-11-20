// app/api/sourcing/create/route.ts

import { NextRequest, NextResponse } from "next/server";

/**
 * Legacy sourcing endpoint (Prisma-based) – now disabled.
 *
 * Why is this here?
 * - The old implementation used Prisma models (candidate, job, etc.)
 *   that no longer match your current database setup.
 * - This caused build-time TypeScript errors like:
 *     Property 'candidate' does not exist on type 'PrismaClient'
 *
 * For now, we return a clear 410/501-style response so the app can
 * build and deploy cleanly while we stabilise the core ATS flows
 * (jobs + applications + ThinkATS dashboard).
 *
 * Later, we can re-implement this endpoint using Supabase tables:
 *   - candidates
 *   - jobs
 *   - job_applications
 */

// If someone POSTs a new "sourced" candidate here:
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);

  return NextResponse.json(
    {
      ok: false,
      message:
        "Sourcing API is currently disabled while we upgrade the ATS data model. Please contact Resourcin if you need to add a candidate manually.",
      receivedPayload: body ?? null,
    },
    { status: 410 } // Gone / temporarily disabled
  );
}

// Optional: handle GET just in case something calls it
export async function GET(req: NextRequest) {
  return NextResponse.json(
    {
      ok: false,
      message:
        "Sourcing API is currently disabled. No data is returned from this endpoint.",
    },
    { status: 410 }
  );
}
