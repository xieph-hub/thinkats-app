// lib/uploadCv.ts
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Fail fast in dev if env is misconfigured
if (!supabaseUrl) {
  throw new Error("NEXT_PUBLIC_SUPABASE_URL is not set");
}
if (!supabaseServiceKey) {
  throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set");
}

// Server-side Supabase client using the service role key
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export type UploadCvParams = {
  file: File | Blob;          // CV file from formData
  jobId?: string;             // optional – for folder structure
  candidateEmail?: string;    // optional – used to name the file
  folderPrefix?: string;      // optional – for extra nesting if you ever want it
};

/**
 * Uploads a CV file to Supabase Storage and returns a public URL.
 * This must only be used in server-side code (API routes / server actions).
 */
export async function uploadCv({
  file,
  jobId,
  candidateEmail,
  folderPrefix,
}: UploadCvParams): Promise<string> {
  if (!file) {
    throw new Error("No CV file provided");
  }

  // Convert the File/Blob to a Node Buffer
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const emailPart = candidateEmail
    ? candidateEmail.replace(/[^a-zA-Z0-9@._-]/g, "")
    : "anonymous";

  const originalName =
    "name" in file && (file as File).name
      ? (file as File).name
      : "cv.pdf";

  const safeFileName = originalName.replace(/[^a-zA-Z0-9._-]/g, "-");

  const pathParts: string[] = [];

  if (folderPrefix) {
    pathParts.push(folderPrefix.replace(/\/+$/g, ""));
  }
  if (jobId) {
    pathParts.push(jobId);
  }

  const basePath = pathParts.join("/");
  const filename = `${
    basePath ? basePath + "/" : ""
  }${Date.now()}-${emailPart}-${safeFileName}`;

  const bucket = "cvs"; // 🔹 create this bucket in Supabase Storage

  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(filename, buffer, {
      upsert: false,
      contentType:
        "type" in file && (file as File).type
          ? (file as File).type
          : "application/pdf",
    });

  if (error || !data) {
    console.error("uploadCv error", error);
    throw new Error("Failed to upload CV");
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from(bucket).getPublicUrl(data.path);

  return publicUrl;
}

// To be extra safe if anything previously did `default import uploadCv`
export default uploadCv;
