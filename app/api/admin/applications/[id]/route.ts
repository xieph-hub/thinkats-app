// app/api/admin/applications/[id]/route.ts

import { NextRequest, NextResponse } from "next/server";

/**
 * Legacy admin applications endpoint (Prisma-based) – now disabled.
 *
 * We have moved the ATS data model to Supabase (jobs, job_applications, etc.)
 * and no longer rely on Prisma enums like ApplicationStage / ApplicationStatus.
 *
 * This stub exists so the app compiles cleanly.
 * If/when we need an admin API to update applications, we will:
 *   - Implement it against the Supabase tables (job_applications),
 *   - Use supabaseAdmin from "@/lib/supabaseAdmin".
 */
export async function PATCH(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  return NextResponse.json(
    {
      error:
        "Legacy admin applications endpoint is disabled. This route is a placeholder and no longer uses Prisma.",
      applicationId: params.id,
    },
    { status: 410 } // 410 Gone – intentional deprecation
  );
}
