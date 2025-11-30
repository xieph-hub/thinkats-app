// app/ats/tenants/new/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function uploadLogoToStorage(file: any, folder: "tenant-logos") {
  if (!file) return null;

  try {
    const originalName =
      typeof file.name === "string" && file.name.length > 0
        ? file.name
        : "logo.png";
    const ext = originalName.split(".").pop() || "png";
    const path = `${folder}/${Date.now()}-${Math.random()
      .toString(36)
      .slice(2)}.${ext.toLowerCase()}`;

    const { data, error } = await supabaseAdmin.storage
      .from("logos")
      .upload(path, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (error) {
      console.error("Supabase logo upload failed:", error);
      return null;
    }

    const uploadedPath = data?.path || path;
    const { data: publicData } = supabaseAdmin.storage
      .from("logos")
      .getPublicUrl(uploadedPath);

    return publicData.publicUrl || null;
  } catch (err) {
    console.error("Unexpected error uploading logo:", err);
    return null;
  }
}

export async function POST(req: Request) {
  const formData = await req.formData();
  const nameRaw = formData.get("name");
  const slugRaw = formData.get("slug");
  const logoFile = formData.get("logo") as any;

  const name = typeof nameRaw === "string" ? nameRaw.trim() : "";
  let slug = typeof slugRaw === "string" ? slugRaw.trim() : "";

  if (!name) {
    const url = new URL("/ats/tenants", req.url);
    url.searchParams.set("error", "missing_name");
    return NextResponse.redirect(url, 303);
  }

  if (!slug) {
    slug = slugify(name);
  }

  let logoUrl: string | null = null;
  if (logoFile && typeof (logoFile as any).arrayBuffer === "function") {
    logoUrl = await uploadLogoToStorage(logoFile, "tenant-logos");
  }

  try {
    await prisma.tenant.create({
      data: {
        name,
        slug,
        ...(logoUrl ? { logoUrl } : {}),
      },
    });

    const url = new URL("/ats/tenants", req.url);
    url.searchParams.set("created", "1");
    return NextResponse.redirect(url, 303);
  } catch (err) {
    console.error("Failed to create tenant", err);
    const url = new URL("/ats/tenants", req.url);
    url.searchParams.set("error", "create_failed");
    return NextResponse.redirect(url, 303);
  }
}
