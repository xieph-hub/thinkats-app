// app/api/apply/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  sendCandidateApplicationReceivedEmail,
  sendAdminNewApplicationEmail,
} from "@/lib/email";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);

    const jobSlug = body?.jobSlug as string | undefined;
    const jobTitleFromClient = body?.jobTitle as string | undefined;
    const rawName = body?.name as string | undefined;
    const rawEmail = body?.email as string | undefined;
    const phone = (body?.phone as string | undefined) || null;
    const location = (body?.location as string | undefined) || null;
    const resumeUrl = (body?.resumeUrl as string | undefined) || null;
    const source = (body?.source as string | undefined) || "website";

    const name = rawName?.trim() || "";
    const email = rawEmail?.trim().toLowerCase() || "";

    // ✅ Now we allow jobSlug OR jobTitle, but still require name + email
    if (!name || !email || (!jobSlug && !jobTitleFromClient)) {
      return NextResponse.json(
        {
          ok: false,
          message: "Missing required fields (job, name, email).",
        },
        { status: 400 }
      );
    }

    // 🔎 Find job by slug first, fall back to title if slug is missing
    let job = null;

    if (jobSlug) {
      job = await prisma.job.findUnique({
        where: { slug: jobSlug },
      });
    }

    if (!job && jobTitleFromClient) {
      job = await prisma.job.findFirst({
        where: { title: jobTitleFromClient },
      });
    }

    if (!job) {
      return NextResponse.json(
        {
          ok: false,
          message: "Job not found.",
        },
        { status: 404 }
      );
    }

    // 🔁 Find or create candidate by email
    let candidate = await prisma.candidate.findFirst({
      where: { email },
    });

    if (!candidate) {
      candidate = await prisma.candidate.create({
        data: {
          fullname: name,
          email,
          phone,
          location,
          resumeUrl,
          source,
          ...(job && {
            job: { connect: { id: job.id } },
          }),
        },
      });
    } else {
      candidate = await prisma.candidate.update({
        where: { id: candidate.id },
        data: {
          fullname: candidate.fullname || name,
          phone: phone || candidate.phone,
          location: location || candidate.location,
          resumeUrl: resumeUrl || candidate.resumeUrl,
          source: source || candidate.source,
          ...(job && {
            job: { connect: { id: job.id } },
          }),
        },
      });
    }

    // 🧾 Create the application record
    const application = await prisma.application.create({
      data: {
        job: { connect: { id: job.id } },
        candidate: { connect: { id: candidate.id } },
        stage: "APPLIED",
        source,
      },
      include: {
        job: true,
        candidate: true,
      },
    });

    // 📧 Fire off emails (candidate + admin) — errors here won't break the response
    try {
      await Promise.all([
        sendCandidateApplicationReceivedEmail({
          to: application.candidate.email,
          candidateName: application.candidate.fullname,
          jobTitle:
            application.job.title || jobTitleFromClient || "your application",
        }),
        sendAdminNewApplicationEmail({
          candidateName: application.candidate.fullname,
          candidateEmail: application.candidate.email,
          candidatePhone: application.candidate.phone || null,
          candidateLocation: application.candidate.location || null,
          jobTitle:
            application.job.title || jobTitleFromClient || "Unknown role",
          jobSlug: job.slug,
          source,
        }),
      ]);
    } catch (err) {
      console.error("Error sending application emails:", err);
    }

    return NextResponse.json(
      {
        ok: true,
        message: "Application received.",
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Apply API error:", error);
    const msg =
      error?.message ||
      "Something went wrong while submitting your application.";

    return NextResponse.json(
      {
        ok: false,
        message: msg,
      },
      { status: 500 }
    );
  }
}
