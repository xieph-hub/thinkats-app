// app/api/candidate/logout/route.ts
import { NextRequest, NextResponse } from "next/server";

export async function POST(_req: NextRequest) {
  const res = NextResponse.json({ ok: true });
  res.cookies.set("candidate_token", "", {
    httpOnly: true,
    secure: true,
    path: "/",
    maxAge: 0,
  });
  return res;
}
