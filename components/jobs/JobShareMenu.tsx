// components/jobs/JobShareMenu.tsx
"use client";

import { useState } from "react";

type JobShareMenuProps = {
  jobTitle: string;
  jobUrl: string; // absolute URL is best, but relative also works
};

export default function JobShareMenu({ jobTitle, jobUrl }: JobShareMenuProps) {
  const [copied, setCopied] = useState(false);

  const encodedUrl = encodeURIComponent(jobUrl);
  const baseText = jobTitle || "Check out this role";
  const encodedText = encodeURIComponent(baseText);

  const linkedinUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`;
  const xUrl = `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`;
  const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(
    `${baseText} - ${jobUrl}`,
  )}`;

  async function handleCopy() {
    try {
      if (navigator && navigator.clipboard) {
        await navigator.clipboard.writeText(jobUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch (err) {
      console.error("Failed to copy link", err);
    }
  }

  return (
    <div className="inline-flex flex-wrap items-center gap-2 text-[11px]">
      <span className="text-slate-500">Share:</span>

      <a
        href={linkedinUrl}
        target="_blank"
        rel="noreferrer"
        className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1 font-medium text-slate-700 hover:bg-slate-100"
      >
        LinkedIn
      </a>

      <a
        href={xUrl}
        target="_blank"
        rel="noreferrer"
        className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1 font-medium text-slate-700 hover:bg-slate-100"
      >
        X
      </a>

      <a
        href={whatsappUrl}
        target="_blank"
        rel="noreferrer"
        className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1 font-medium text-slate-700 hover:bg-slate-100"
      >
        WhatsApp
      </a>

      <button
        type="button"
        onClick={handleCopy}
        className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1 font-medium text-slate-700 hover:bg-slate-100"
      >
        {copied ? "Link copied" : "Copy link"}
      </button>
    </div>
  );
}
