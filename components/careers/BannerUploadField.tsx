// components/careers/BannerUploadField.tsx
"use client";

import { useState, useRef } from "react";
import { supabaseBrowser } from "@/lib/supabaseBrowser";

type Props = {
  tenantId: string;
  initialUrl?: string | null;
};

export default function BannerUploadField({ tenantId, initialUrl }: Props) {
  const [bannerUrl, setBannerUrl] = useState(initialUrl ?? "");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);

    // Guard against crazy-large uploads
    const maxSizeMB = 8;
    if (file.size > maxSizeMB * 1024 * 1024) {
      setError(`Please upload an image under ${maxSizeMB}MB.`);
      return;
    }

    setUploading(true);
    try {
      const ext = file.name.split(".").pop() || "jpg";
      const safeName = file.name
        .toLowerCase()
        .replace(/[^a-z0-9\.]+/g, "-")
        .replace(/\.+/g, ".");

      const path = `banners/${tenantId}/${Date.now()}-${safeName}`;

      const { error: uploadError } = await supabaseBrowser.storage
        .from("career-banners")
        .upload(path, file, {
          cacheControl: "3600",
          upsert: false,
          contentType: file.type || `image/${ext}`,
        });

      if (uploadError) {
        console.error("Banner upload error:", uploadError);
        setError("Upload failed, please try another image.");
        return;
      }

      const { data } = supabaseBrowser.storage
        .from("career-banners")
        .getPublicUrl(path);

      const publicUrl = data.publicUrl;
      setBannerUrl(publicUrl);
    } catch (err) {
      console.error("Banner upload error:", err);
      setError("Upload failed, please try again.");
    } finally {
      setUploading(false);
    }
  }

  function handleClear() {
    setBannerUrl("");
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label className="block text-[11px] font-medium text-slate-700">
          Hero banner image
        </label>
        {bannerUrl && (
          <button
            type="button"
            onClick={handleClear}
            className="text-[10px] font-medium text-slate-500 hover:text-red-500"
          >
            Remove banner
          </button>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="block w-full text-[11px] text-slate-700 file:mr-3 file:rounded-full file:border-none file:bg-slate-100 file:px-3 file:py-1.5 file:text-[11px] file:font-medium file:text-slate-700 hover:file:bg-slate-200"
      />

      {/* This is what the API receives and saves */}
      <input type="hidden" name="bannerImageUrl" value={bannerUrl} />

      {uploading && (
        <p className="text-[10px] text-slate-500">Uploading banner…</p>
      )}

      {error && (
        <p className="text-[10px] text-red-500">
          {error}
        </p>
      )}

      {bannerUrl && (
        <div className="mt-2 overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={bannerUrl}
            alt="Current banner"
            className="h-32 w-full object-cover md:h-40"
          />
        </div>
      )}

      <p className="text-[10px] text-slate-500">
        Uploads directly to Supabase Storage. When you click{" "}
        <span className="font-semibold">Save jobs hub settings</span>, only the
        public URL is stored in this tenant&apos;s settings.
      </p>
    </div>
  );
}
