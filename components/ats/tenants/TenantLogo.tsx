// components/ats/tenants/TenantLogo.tsx
"use client";

import Image from "next/image";
import { useState } from "react";

type TenantLogoProps = {
  src: string | null;
  label: string;
};

export default function TenantLogo({ src, label }: TenantLogoProps) {
  const [hasError, setHasError] = useState(false);
  const initial =
    (label?.charAt?.(0)?.toUpperCase?.() as string | undefined) || "T";

  // Fallback: no src or load error → show initial chip
  if (!src || hasError) {
    return (
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-xs font-semibold text-slate-600 ring-1 ring-slate-200">
        {initial}
      </div>
    );
  }

  return (
    <div className="relative h-9 w-9 overflow-hidden rounded-lg bg-white ring-1 ring-slate-200">
      <Image
        src={src}
        alt={`${label} logo`}
        fill
        sizes="36px"
        className="object-contain"
        onError={() => setHasError(true)}
        priority={false}
      />
    </div>
  );
}
