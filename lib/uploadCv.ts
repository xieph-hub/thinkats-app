// lib/uploadCv.ts
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "";

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

  // Try to get extension from file.name; default to pdf
  const name = (file as any).name as string | undefined;
  const ext =
    name && name.includes(".") ? name.split(".").pop() || "pdf" : "pdf";

  const safeEmail = (email || "anonymous").replace(/[^a-zA-Z0-9]/g, "_");
  const path = `cvs/${safeEmail}/${Date.now()}.${ext}`;

  const { data, error } = await supabase.storage
    .from("resourcin-uploads")
    .upload(path, file, {
      cacheControl: "3600",
      upsert: false,
    });

  if (error || !data) {
    console.error("Supabase upload error:", error);
    throw new Error("Upload to storage failed");
  }

  const { data: publicData } = supabase.storage
    .from("resourcin-uploads")
    .getPublicUrl(data.path);

  return publicData.publicUrl;
}
