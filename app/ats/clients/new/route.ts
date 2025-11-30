// app/ats/clients/new/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

async function uploadLogoToStorage(file: any, folder: "client-logos") {
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
      console.error("Supabase client logo upload failed:", error);
      return null;
    }

    const uploadedPath = data?.path || path;
    const { data: publicData } = supabaseAdmin.storage
      .from("logos")
      .getPublicUrl(uploadedPath);

    return publicData.publicUrl || null;
  } catch (err) {
    console.error("Unexpected error uploading client logo:", err);
    return null;
  }
}

export async function POST(req: Request) {
  const formData = await req.formData();
  const nameRaw = formData.get("name");
  const tenantIdRaw = formData.get("tenantId");
  const logoFile = formData.get("logo") as any;

  const name = typeof nameRaw === "string" ? nameRaw.trim() : "";
  const tenantId = typeof tenantIdRaw === "string" ? tenantIdRaw.trim() : "";

  if (!name) {
    const url = new URL("/ats/clients", req.url);
    if (tenantId) url.searchParams.set("tenantId", tenantId);
    url.searchParams.set("error", "missing_name");
    return NextResponse.redirect(url, 303);
  }

  if (!tenantId) {
    const url = new URL("/ats/clients", req.url);
    url.searchParams.set("error", "missing_tenant");
    return NextResponse.redirect(url, 303);
  }

  let logoUrl: string | null = null;
  if (logoFile && typeof (logoFile as any).arrayBuffer === "function") {
    logoUrl = await uploadLogoToStorage(logoFile, "client-logos");
  }

  try {
    await prisma.clientCompany.create({
      data: {
        name,
        tenantId,
        ...(logoUrl ? { logoUrl } : {}),
      },
    });

    const url = new URL("/ats/clients", req.url);
    url.searchParams.set("tenantId", tenantId);
    url.searchParams.set("created", "1");
    return NextResponse.redirect(url, 303);
  } catch (err) {
    console.error("Failed to create client company", err);
    const url = new URL("/ats/clients", req.url);
    url.searchParams.set("tenantId", tenantId);
    url.searchParams.set("error", "create_failed");
    return NextResponse.redirect(url, 303);
  }
}
