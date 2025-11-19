// lib/uploadCv.ts
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.warn(
    "Supabase env vars missing – CV uploads will be skipped and only links will be stored."
  );
}

const supabase =
  supabaseUrl && supabaseServiceRoleKey
    ? createClient(supabaseUrl, supabaseServiceRoleKey, {
        auth: { persistSession: false },
      })
    : null;

export async function uploadCvFile(
  file: File,
  jobId: string
): Promise<string | null> {
  if (!supabase) {
    return null;
  }

  const arrayBuffer = await file.arrayBuffer();
  const ext = file.name.split(".").pop() || "bin";
  const path = `cvs/${jobId}/${crypto.randomUUID()}.${ext}`;

  const { data, error } = await supabase.storage
    .from("cvs")
    .upload(path, arrayBuffer, {
      contentType: file.type || "application/octet-stream",
      upsert: false,
    });

  if (error) {
    console.error("Supabase CV upload error:", error);
    return null;
  }

  const { data: publicData } = supabase.storage
    .from("cvs")
    .getPublicUrl(data.path);

  return publicData?.publicUrl ?? null;
}
