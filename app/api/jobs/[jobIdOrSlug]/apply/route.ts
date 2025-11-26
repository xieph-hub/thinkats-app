// ⬇️ INSIDE the `if (uploadCvFile instanceof File && !body.cvUrl && !body.cv_url) { ... }` block

const { data: uploadResult, error: uploadError } =
  await supabaseAdmin.storage
    .from("resourcin-uploads") // ⬅️ use your existing bucket name
    .upload(filePath, uploadCvFile, {
      contentType: uploadCvFile.type || "application/octet-stream",
      upsert: false,
    });

if (uploadError || !uploadResult) {
  console.error("Error uploading CV to storage", uploadError);
  return NextResponse.json(
    {
      error:
        "We couldn’t upload your CV. Please try again in a moment.",
    },
    { status: 500 }
  );
}

// Also use the same bucket name here:
const { data: publicUrlData } = supabaseAdmin.storage
  .from("resourcin-uploads")
  .getPublicUrl(uploadResult.path);

cvUrlFromUpload = publicUrlData?.publicUrl ?? null;
