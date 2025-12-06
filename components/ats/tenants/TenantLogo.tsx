// components/ats/tenants/TenantLogo.tsx
"use client";

import { useState } from "react";

type TenantLogoProps = {
  src: string | null;
  label: string;
  size?: "sm" | "md";
};

export default function TenantLogo({
  src,
  label,
  size = "md",
}: TenantLogoProps) {
  const [hasError, setHasError] = useState(false);

  const initials =
    label
      ?.trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("") || "?";

  const boxClasses =
    size === "sm"
      ? "h-7 w-7 text-[10px]"
      : "h-9 w-9 text-xs";

  // Fallback: initials badge
  if (!src || hasError) {
    return (
      <div
        className={`flex items-center justify-center rounded-lg border border-slate-200 bg-slate-100 font-semibold text-slate-600 ${boxClasses}`}
      >
        {initials}
      </div>
    );
  }

  // Normal path: show logo image (any domain, no Next image config issues)
  return (
    <div
      className={`flex items-center justify-center rounded-lg border border-slate-200 bg-white ${boxClasses}`}
    >
      <img
        src={src}
        alt={`${label} logo`}
        className="max-h-full max-w-full object-contain"
        loading="lazy"
        onError={() => setHasError(true)}
      />
    </div>
  );
}
