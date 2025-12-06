// components/ats/tenants/TenantLogo.tsx
"use client";

import { useState } from "react";

type TenantLogoProps = {
  src: string | null;
  label: string;
};

function getInitials(label: string): string {
  const parts = label.trim().split(/\s+/);
  if (parts.length === 0) return "";
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  return (
    (parts[0][0] || "").toUpperCase() +
    (parts[1][0] || "").toUpperCase()
  );
}

export default function TenantLogo({ src, label }: TenantLogoProps) {
  const [failed, setFailed] = useState(false);
  const initials = getInitials(label || "T");

  const showFallback = !src || failed;

  if (showFallback) {
    return (
      <div className="flex h-9 w-9 items-center justify-center rounded-md bg-slate-900 text-[11px] font-semibold text-white">
        {initials}
      </div>
    );
  }

  return (
    <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-md bg-white ring-1 ring-slate-200">
      <img
        src={src}
        alt={`${label} logo`}
        className="h-8 w-8 object-contain"
        onError={() => setFailed(true)}
      />
    </div>
  );
}
