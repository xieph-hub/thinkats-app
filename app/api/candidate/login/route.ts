// app/api/candidate/login/route.ts

import { NextRequest, NextResponse } from "next/server";

// Candidate login / magic link portal is temporarily disabled
// while we move fully to the new ThinkATS multi-tenant schema.
//
// This endpoint exists only to fail gracefully instead of crashing
// with Prisma / legacy table errors.

export async function POST(req: NextRequest) {
  try {
    // We still read the body so the frontend can send whatever it wants
    // without causing a 500.
    const _body = await req.json().catch(() => null);

    return NextResponse.json(
      {
        ok: false,
        message:
          "Candidate portal login is temporarily unavailable while we upgrade ThinkATS. Please check back soon or contact Resourcin directly.",
      },
      { status: 503 }
    );
  } catch (err) {
    console.error("Error in candidate login endpoint:", err);
    return NextResponse.json(
      {
        ok: false,
        message: "Unexpected error in candidate login endpoint.",
      },
      { status: 500 }
    );
  }
}
