// app/api/upload-cv/route.ts
import { NextRequest, NextResponse } from "next/server";
import { uploadCv } from "@/lib/uploadCv";

// Make sure this route always runs on the server
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("cv") as File | null;
    const email = (formData.get("email") as string | null) ?? "anonymous";

    if (!file || file.size === 0) {
      return NextResponse.json(
        { error: "No file received" },
        { status: 400 }
      );
    }

    const url = await uploadCv(file, email);

    return NextResponse.json({ url });
  } catch (err) {
    console.error("Upload CV route error:", err);
    return NextResponse.json(
      { error: "Unexpected error during upload" },
      { status: 500 }
    );
  }
}
