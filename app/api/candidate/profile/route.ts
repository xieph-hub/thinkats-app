// app/api/candidate/profile/route.ts

import { NextRequest, NextResponse } from "next/server";

/**
 * Legacy candidate profile endpoint (Prisma-based) – now disabled.
 *
 * Why?
 * - We have moved the ATS data model to Supabase tables
 *   (candidates, jobs, job_applications, etc.).
 * - The old implementation used Prisma models that no longer match the DB.
 *
 * This stub keeps the build green.
 * Later we will re-implement candidate self-service profile
 * using Supabase (supabaseAdmin + candidates table).
 */

// GET – someone trying to read candidate profile
export async function GET(req: NextRequest) {
  return NextResponse.json(
    {
      error:
        "Candidate self-service profile is currently unavailable. Please contact Resourcin support if you need to update your details.",
    },
    { status: 410 } // 410 Gone – intentionally disabled
  );
}

// PATCH – someone trying to update profile
export async function PATCH(req: NextRequest) {
  const body = await req.json().catch(() => null);

  return NextResponse.json(
    {
      error:
        "Candidate self-service profile is currently unavailable. Please contact Resourcin support if you need to update your details.",
      receivedPayload: body ?? null,
    },
    { status: 410 }
  );
}

// POST – if anyone posts here by mistake
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);

  return NextResponse.json(
    {
      error:
        "Candidate self-service profile is currently unavailable. Please apply via an open job instead.",
      receivedPayload: body ?? null,
    },
    { status: 410 }
  );
}
