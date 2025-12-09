// app/ats/tenants/CopyCareersUrlButton.tsx
"use client";

import { useState } from "react";

export default function CopyCareersUrlButton({
  careersUrl,
}: {
  careersUrl: string;
}) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(careersUrl);
      setCopied(true);
      // Reset after a short delay
      setTimeout(() => setCopied(false), 1500);
    } catch (err) {
      console.error("Failed to copy careers URL", err);
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="inline-flex items-center rounded-full bg-[#172965] px-3 py-1 text-[10px] font-semibold text-white shadow-sm hover:bg-[#121f4f] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#172965] focus-visible:ring-offset-1"
    >
      {copied ? "Copied!" : "Copy URL"}
    </button>
  );
}
