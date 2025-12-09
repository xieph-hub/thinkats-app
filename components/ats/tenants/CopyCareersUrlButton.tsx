// components/ats/tenants/CopyCareersUrlButton.tsx
"use client";

import { useState } from "react";

type Props = {
  url: string;
};

export default function CopyCareersUrlButton({ url }: Props) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy careers URL", err);
      alert("Could not copy link. Please copy it manually.");
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="inline-flex items-center rounded-full bg-slate-50 px-3 py-1 text-[10px] font-medium text-slate-700 hover:bg-slate-100"
    >
      {copied ? "Copied ✓" : "Copy careers URL"}
    </button>
  );
}
