import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // For now we just log. Later we can:
    // - Save to Supabase
    // - Send an email
    // - Push into your ATS
    console.log("New employer lead from resourcin.com:", body);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Error in /api/employer-leads", error);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
