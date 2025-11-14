// app/api/admin/jobs/update/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(req: Request) {
  const form = await req.formData();
  const id = String(form.get("id") || "");
  if (!id) return NextResponse.json({ ok: false, message: "Missing id" }, { status: 400 });

  const title = String(form.get("title") || "");
  const slug = String(form.get("slug") || "").toLowerCase();
  const department = String(form.get("department") || "");
  const location = String(form.get("location") || "");
  const type = String(form.get("type") || "");
  const excerpt = String(form.get("excerpt") || "");
  const description = String(form.get("description") || "");

  await prisma.job.update({
    where: { id },
    data: {
      title,
      slug,
      department: department || null,
      location: location || null,
      type: type || null,
      excerpt: excerpt || null,
      description,
    },
  });

  return NextResponse.redirect(new URL("/admin/jobs", req.url), 302);
}
