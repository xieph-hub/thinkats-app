// app/api/candidate-applications/route.ts

import { NextRequest, NextResponse } from "next/server";

/**
 * Legacy candidate applications endpoint (Prisma-based) – now disabled.
 *
 * We have moved ATS data to Supabase tables (jobs, job_applications, etc.)
 * and no longer use Prisma models like `JobApplication` here.
 *
 * This stub exists so the app compiles cleanly.
 * Later, if you want "check my applications by email", we will:
 *   - Read from Supabase (job_applications + candidates),
 *   - Use supabaseAdmin from "@/lib/supabaseAdmin".
 */

// Optional: GET handler stub (if something calls GET on this route)
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const email = url.searchParams.get("email");

  return NextResponse.json(
    {
      error:
        "The /api/candidate-applications endpoint is currently disabled. Please apply via a specific job page.",
      email: email ?? null,
    },
    { status: 410 } // 410 Gone – intentionally deprecated
  );
}

// POST handler stub (if a form posts email here)
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const email =
    (body && typeof body.email === "string"
      ? body.email.trim().toLowerCase()
      : null) || null;

  return NextResponse.json(
    {
      error:
        "The /api/candidate-applications endpoint is currently disabled. Please apply via a specific job page.",
      email,
      receivedPayload: body ?? null,
    },
    { status: 410 }
  );
}
