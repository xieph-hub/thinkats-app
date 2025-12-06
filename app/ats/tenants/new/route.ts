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

async function uploadLogoToStorage(file: File, folder: "tenant-logos") {
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

    // Convert File -> Uint8Array for Supabase storage
    const arrayBuffer = await file.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);
    const contentType =
      (file as any).type && typeof (file as any).type === "string"
        ? (file as any).type
        : "image/png";

    const { data, error } = await supabaseAdmin.storage
      .from("logos")
      .upload(path, bytes, {
        cacheControl: "3600",
        upsert: false,
        contentType,
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

  const tenantIdRaw = formData.get("tenantId");
  const tenantId =
    typeof tenantIdRaw === "string" && tenantIdRaw.trim().length > 0
      ? tenantIdRaw.trim()
      : null;

  const nameRaw = formData.get("name");
  const slugRaw = formData.get("slug");
  const logoFile = formData.get("logo") as File | null;
  const statusRaw = formData.get("status");
  const primaryContactEmailRaw = formData.get("primaryContactEmail");

  const name = typeof nameRaw === "string" ? nameRaw.trim() : "";
  let slug = typeof slugRaw === "string" ? slugRaw.trim() : "";

  if (!name) {
    const url = new URL("/ats/tenants", req.url);
    url.searchParams.set("error", "missing_name");
    if (tenantId) url.searchParams.set("editTenantId", tenantId);
    return NextResponse.redirect(url, 303);
  }

  if (!slug) {
    slug = slugify(name);
  } else {
    slug = slugify(slug);
  }

  const status =
    typeof statusRaw === "string" && statusRaw.trim().length > 0
      ? statusRaw.trim().toLowerCase()
      : null;

  const primaryContactEmail =
    typeof primaryContactEmailRaw === "string" &&
    primaryContactEmailRaw.trim().length > 0
      ? primaryContactEmailRaw.trim()
      : null;

  let logoUrl: string | null = null;
  if (logoFile && typeof (logoFile as any).arrayBuffer === "function") {
    logoUrl = await uploadLogoToStorage(logoFile, "tenant-logos");
  }

  try {
    const data: any = {
      name,
      slug,
    };

    if (logoUrl) {
      data.logoUrl = logoUrl;
    }
    if (primaryContactEmail) {
      data.primaryContactEmail = primaryContactEmail;
    }
    if (status) {
      data.status = status;
    }

    if (tenantId) {
      // Update existing workspace
      await prisma.tenant.update({
        where: { id: tenantId },
        data,
      });

      const url = new URL("/ats/tenants", req.url);
      url.searchParams.set("updated", "1");
      url.searchParams.set("editTenantId", tenantId);
      return NextResponse.redirect(url, 303);
    }

    // Create new workspace
    await prisma.tenant.create({
      data,
    });

    const url = new URL("/ats/tenants", req.url);
    url.searchParams.set("created", "1");
    return NextResponse.redirect(url, 303);
  } catch (err) {
    console.error("Failed to create/update tenant", err);
    const url = new URL("/ats/tenants", req.url);
    url.searchParams.set("error", "create_failed");
    if (tenantId) url.searchParams.set("editTenantId", tenantId);
    return NextResponse.redirect(url, 303);
  }
}
