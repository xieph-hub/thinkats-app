// components/careers/BannerUploadField.tsx
"use client";

import { useEffect, useState } from "react";

type BannerUploadFieldProps = {
  tenantId: string;
  initialUrl: string | null;
};

export default function BannerUploadField({
  tenantId, // eslint-disable-line @typescript-eslint/no-unused-vars
  initialUrl,
}: BannerUploadFieldProps) {
  const [previewUrl, setPreviewUrl] = useState(initialUrl ?? "");
  const [objectUrl, setObjectUrl] = useState<string | null>(null);

  // If server sends a new initialUrl after a save, sync it
  useEffect(() => {
    if (initialUrl && initialUrl !== previewUrl) {
      setPreviewUrl(initialUrl);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialUrl]);

  useEffect(() => {
    return () => {
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [objectUrl]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (objectUrl) {
      URL.revokeObjectURL(objectUrl);
    }

    const url = URL.createObjectURL(file);
    setObjectUrl(url);
    setPreviewUrl(url);
  }

  return (
    <div className="space-y-2">
      <label
        htmlFor="bannerImageFile"
        className="block text-[11px] font-medium text-slate-700"
      >
        Banner image
      </label>
      <input
        id="bannerImageFile"
        name="bannerImageFile"
        type="file"
        accept="image/*"
        onChange={handleChange}
        className="block w-full text-[11px]"
      />
      <p className="text-[10px] text-slate-500">
        Recommended: at least 1600×400px, JPG or PNG. The image is uploaded and
        saved when you click &quot;Save jobs hub settings&quot;.
      </p>

      {previewUrl && (
        <div className="mt-2 overflow-hidden rounded-md border border-slate-200">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={previewUrl}
            alt="Jobs hub banner"
            className="h-32 w-full object-cover"
          />
        </div>
      )}
    </div>
  );
}
