// lib/uploadCv.ts
import { createClient } from "@supabase/supabase-js";
import { Buffer } from "buffer";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "";

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.warn(
    "[uploadCv] Supabase env vars missing – uploads will fail until configured."
  );
}

const supabase =
  SUPABASE_URL && SUPABASE_KEY
    ? createClient(SUPABASE_URL, SUPABASE_KEY)
    : null;

export async function uploadCv(
  file: File | Blob,
  email?: string
): Promise<string> {
  if (!supabase || !SUPABASE_URL || !SUPABASE_KEY) {
    throw new Error("Supabase is not configured on the server");
  }

  if (!file) {
    throw new Error("No file provided");
  }

  // Try to get a human name + extension from the File if present
  const anyFile = file as any;
  const name: string | undefined = anyFile.name;
  const ext =
    name && name.includes(".") ? name.split(".").pop() || "pdf" : "pdf";

  const safeEmail = (email || "anonymous").replace(/[^a-zA-Z0-9]/g, "_");
  const path = `cvs/${safeEmail}/${Date.now()}.${ext}`;

  // IMPORTANT: convert File/Blob → Buffer for Node
  const arrayBuffer = await anyFile.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const contentType: string =
    (anyFile.type as string | undefined) || "application/octet-stream";

  const { data, error } = await supabase.storage
    .from("resourcin-uploads")
    .upload(path, buffer, {
      cacheControl: "3600",
      upsert: false,
      contentType,
    });

  if (error || !data) {
    console.error("[uploadCv] Supabase upload error:", error);
    throw new Error("Upload to storage failed");
  }

  const { data: publicData } = supabase.storage
    .from("resourcin-uploads")
    .getPublicUrl(data.path);

  if (!publicData || !publicData.publicUrl) {
    throw new Error("Could not obtain public URL for uploaded CV");
  }

  return publicData.publicUrl;
}
