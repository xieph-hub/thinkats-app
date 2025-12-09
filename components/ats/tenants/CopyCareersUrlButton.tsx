"use client";

import { useState } from "react";

type Props = {
  url: string;
  /**
   * Optional extra classes so you can style the button
   * from callers (like the tenants page).
   */
  className?: string;
};

export default function CopyCareersUrlButton({ url, className }: Props) {
  const [copied, setCopied] = useState(false);

  async function handleClick() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      // small timeout to reset the label
      setTimeout(() => setCopied(false), 1800);
    } catch (err) {
      console.error("Failed to copy careers URL", err);
    }
  }

  const baseClasses =
    "inline-flex items-center gap-1 rounded-full px-3 py-1 text-[10px] font-medium transition";
  const defaultClasses = "bg-slate-50 text-slate-700 hover:bg-slate-100";

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`${baseClasses} ${
        className ? className : defaultClasses
      }`}
    >
      {copied ? (
        <>
          <span aria-hidden>✓</span>
          <span>Copied</span>
        </>
      ) : (
        <>
          <span aria-hidden>🔗</span>
          <span>Copy careers URL</span>
        </>
      )}
    </button>
  );
}
