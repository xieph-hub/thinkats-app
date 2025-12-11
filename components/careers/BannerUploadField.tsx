// components/careers/BannerUploadField.tsx
"use client";

import { useState } from "react";
import { supabaseBrowser } from "@/lib/supabaseBrowser";

type BannerUploadFieldProps = {
  tenantId: string;
  initialUrl: string | null;
};

export default function BannerUploadField({
  tenantId,
  initialUrl,
}: BannerUploadFieldProps) {
  const [previewUrl, setPreviewUrl] = useState(initialUrl ?? "");
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setSuccess(null);
    setIsUploading(true);

    try {
      // Use your public bucket (fallback to "careers-assets" if the env isn't set)
      const bucket =
        process.env.NEXT_PUBLIC_CAREER_BANNERS_BUCKET || "careers-assets";

      const objectPath = `tenants/${tenantId}/banner-${Date.now()}-${
        file.name
      }`;

      // 1) Upload to Supabase Storage (browser side)
      const { data, error } = await supabaseBrowser.storage
        .from(bucket)
        .upload(objectPath, file, {
          upsert: true,
        });

      if (error) throw error;

      const { data: publicData } = supabaseBrowser.storage
        .from(bucket)
        .getPublicUrl(data.path);

      const publicUrl = publicData.publicUrl;
      if (!publicUrl) {
        throw new Error("Could not derive public URL for banner");
      }

      // 2) Persist URL to DB via API
      const res = await fetch("/api/ats/settings/careers-banner", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tenantId,
          bannerImageUrl: publicUrl,
          bannerImagePath: objectPath,
        }),
      });

      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.ok) {
        throw new Error(json?.error || "Failed to save banner settings");
      }

      // 3) Update local preview
      setPreviewUrl(publicUrl);
      setSuccess("Banner updated");
    } catch (err: any) {
      console.error(err);
      setError(err?.message ?? "Failed to upload banner");
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <div className="space-y-2">
      <label className="block text-[11px] font-medium text-slate-700">
        Banner image
      </label>
      <input
        type="file"
        accept="image/*"
        onChange={handleChange}
        className="block w-full text-[11px]"
      />
      <p className="text-[10px] text-slate-500">
        Recommended: at least 1600×400px, JPG or PNG. Uploading saves
        immediately for this tenant.
      </p>

      {previewUrl && (
        <div className="mt-2 overflow-hidden rounded-md border border-slate-200">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={previewUrl}
            alt="Current jobs hub banner"
            className="h-32 w-full object-cover"
          />
        </div>
      )}

      {isUploading && (
        <p className="text-[10px] text-slate-500">Uploading…</p>
      )}
      {error && <p className="text-[10px] text-red-600">{error}</p>}
      {success && (
        <p className="text-[10px] text-emerald-600">{success}</p>
      )}
    </div>
  );
}
