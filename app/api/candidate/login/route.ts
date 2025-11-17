// app/api/candidate/login/route.ts
import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { getDefaultTenant } from "@/lib/tenant";
import { SITE_URL } from "@/lib/site";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const emailRaw = (body.email || "") as string;

    const email = emailRaw.trim().toLowerCase();
    if (!email || !email.includes("@")) {
      return NextResponse.json(
        { error: "Please enter a valid email." },
        { status: 400 }
      );
    }

    const tenant = await getDefaultTenant();
    const fallbackName = email.split("@")[0];

    // Make sure candidate exists
    let candidate = await prisma.candidate.findUnique({
      where: { email },
    });

    if (!candidate) {
      candidate = await prisma.candidate.create({
        data: {
          email,
          fullName: fallbackName,
          tenantId: tenant.id,
        },
      });
    }

    // Generate a login token valid for 3 days
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000); // 3 days

    await prisma.candidate.update({
      where: { id: candidate.id },
      data: {
        loginToken: token,
        loginTokenExpiresAt: expiresAt,
      },
    });

    const loginUrl = `${SITE_URL}/candidate/verify?token=${token}`;

    // For now: just log it so you can test it.
    // Later you can plug in Resend / Mailgun / etc. to actually email this.
    console.log("Candidate login URL:", loginUrl);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Error in /api/candidate/login", error);
    return NextResponse.json(
      { error: "Something went wrong while sending the login link." },
      { status: 500 }
    );
  }
}
