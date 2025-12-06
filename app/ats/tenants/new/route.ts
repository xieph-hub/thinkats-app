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

function toNullableString(value: FormDataEntryValue | null): string | null {
  if (!value) return null;
  const s = value.toString().trim();
  return s.length ? s : null;
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

  const registrationNumberRaw = formData.get("registrationNumber");
  const taxIdRaw = formData.get("taxId");
  const countryRaw = formData.get("country");
  const stateRaw = formData.get("state");
  const cityRaw = formData.get("city");
  const addressLine1Raw = formData.get("addressLine1");
  const addressLine2Raw = formData.get("addressLine2");
  const industryRaw = formData.get("industry");
  const websiteUrlRaw = formData.get("websiteUrl");

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

  const primaryContactEmail = toNullableString(primaryContactEmailRaw);
  const registrationNumber = toNullableString(registrationNumberRaw);
  const taxId = toNullableString(taxIdRaw);
  const country = toNullableString(countryRaw);
  const state = toNullableString(stateRaw);
  const city = toNullableString(cityRaw);
  const addressLine1 = toNullableString(addressLine1Raw);
  const addressLine2 = toNullableString(addressLine2Raw);
  const industry = toNullableString(industryRaw);
  const websiteUrl = toNullableString(websiteUrlRaw);

  let logoUrl: string | null = null;
  if (logoFile && typeof (logoFile as any).arrayBuffer === "function") {
    logoUrl = await uploadLogoToStorage(logoFile, "tenant-logos");
  }

  try {
    const data: any = {
      name,
      slug,
      // status has default("active") but we allow override here.
    };

    if (status) data.status = status;
    if (primaryContactEmail) data.primaryContactEmail = primaryContactEmail;
    if (registrationNumber) data.registrationNumber = registrationNumber;
    if (taxId) data.taxId = taxId;
    if (country) data.country = country;
    if (state) data.state = state;
    if (city) data.city = city;
    if (addressLine1) data.addressLine1 = addressLine1;
    if (addressLine2) data.addressLine2 = addressLine2;
    if (industry) data.industry = industry;
    if (websiteUrl) data.websiteUrl = websiteUrl;
    if (logoUrl) data.logoUrl = logoUrl;

    if (tenantId) {
      await prisma.tenant.update({
        where: { id: tenantId },
        data,
      });

      const url = new URL("/ats/tenants", req.url);
      url.searchParams.set("updated", "1");
      url.searchParams.set("editTenantId", tenantId);
      return NextResponse.redirect(url, 303);
    }

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
