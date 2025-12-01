// app/api/trial-requests/route.ts
import { NextResponse } from "next/server";
// import { prisma } from "@/lib/prisma"; // optional for DB storage
// import { resend } from "@/lib/resend"; // optional for email

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const company = String(body.company || "").trim();
    const name = String(body.name || "").trim();
    const email = String(body.email || "").trim();
    const role = String(body.role || "").trim();
    const teamSize = String(body.teamSize || "").trim();
    const notes = String(body.notes || "").trim();

    if (!company || !name || !email) {
      return NextResponse.json(
        { error: "Company, name and email are required." },
        { status: 400 }
      );
    }

    // TODO: later – save to DB
    // await prisma.trialRequest.create({ data: { company, name, email, role, teamSize, notes } });

    console.log("New ThinkATS trial request:", {
      company,
      name,
      email,
      role,
      teamSize,
      notes,
    });

    // TODO: later – send yourself an email notification

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (err) {
    console.error("trial-requests error:", err);
    return NextResponse.json(
      { error: "Unable to submit trial request right now." },
      { status: 500 }
    );
  }
}
