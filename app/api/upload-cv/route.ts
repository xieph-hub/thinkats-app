// app/api/upload-cv/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      console.error("Supabase env vars are missing");
      return NextResponse.json(
        { error: "Supabase is not configured on the server" },
        { status: 500 }
      );
    }

    const formData = await req.formData();
    const file = formData.get("cv") as File | null;
    const emailRaw = formData.get("email");
    const email =
      typeof emailRaw === "string" && emailRaw.trim().length > 0
        ? emailRaw.trim()
        : "anonymous";

    if (!file || file.size === 0) {
      return NextResponse.json(
        { error: "No file received" },
        { status: 400 }
      );
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false },
    });

    const ext = file.name.split(".").pop() || "pdf";
    const safeEmail = email.replace(/[^a-zA-Z0-9]/g, "_");
    const path = `cvs/${safeEmail}/${Date.now()}.${ext}`;

    const { data, error } = await supabase.storage
      .from("resourcin-uploads")
      .upload(path, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (error || !data) {
      console.error("Supabase upload error:", error);
      return NextResponse.json(
        { error: "Upload to storage failed" },
        { status: 500 }
      );
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from("resourcin-uploads").getPublicUrl(data.path);

    return NextResponse.json({ url: publicUrl });
  } catch (err) {
    console.error("Upload CV route error:", err);
    return NextResponse.json(
      { error: "Unexpected error during upload" },
      { status: 500 }
    );
  }
}
