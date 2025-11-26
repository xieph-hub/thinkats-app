// lib/storage.ts
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const CV_BUCKET = "resourcin-uploads"; // your bucket name

if (!supabaseUrl) {
  throw new Error("NEXT_PUBLIC_SUPABASE_URL is not set");
}

if (!supabaseServiceRoleKey) {
  throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set");
}

// Server-side Supabase client (service role – do NOT import this in client components)
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: { persistSession: false },
});

export type UploadCvArgs = {
  tenantId: string;
  jobId: string;
  candidateId: string;
  applicationId?: string; // Not used in path yet, but kept for future flexibility
  file: File;
};

function sanitizeFilename(name: string) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9.\-]+/g, "-")
    .replace(/-+/g, "-");
}

/**
 * Uploads a CV to Supabase storage and returns the public URL + path.
 *
 * Path pattern:
 *   resourcin-uploads/<tenantId>/<jobId>/<candidateId>/<timestamp>-<filename>
 */
export async function uploadCvToSupabase({
  tenantId,
  jobId,
  candidateId,
  applicationId, // unused for now
  file,
}: UploadCvArgs): Promise<{ publicUrl: string | null; path: string }> {
  const originalName =
    (file as any).name && typeof (file as any).name === "string"
      ? (file as any).name
      : "cv-attachment";

  const safeName = sanitizeFilename(originalName);
  const timestamp = Date.now();

  const path = `${tenantId}/${jobId}/${candidateId}/${timestamp}-${safeName}`;

  const { error: uploadError } = await supabase.storage
    .from(CV_BUCKET)
    .upload(path, file, {
      contentType: (file as any).type || "application/octet-stream",
      upsert: false,
    });

  if (uploadError) {
    console.error("Supabase CV upload error:", uploadError);
    return { publicUrl: null, path };
  }

  const { data } = supabase.storage.from(CV_BUCKET).getPublicUrl(path);
  const publicUrl = data?.publicUrl || null;

  return { publicUrl, path };
}
