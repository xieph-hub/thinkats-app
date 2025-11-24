// lib/share.ts
export interface SharePayload {
  url: string;
  title: string;
  company: string;
}

const enc = encodeURIComponent;

export function buildLinkedInShareUrl({ url }: SharePayload): string {
  // LinkedIn primarily cares about the URL – it will scrape the OG tags
  return `https://www.linkedin.com/sharing/share-offsite/?url=${enc(url)}`;
}

export function buildTwitterShareUrl({
  url,
  title,
  company,
}: SharePayload): string {
  const text = `${title} at ${company}`;
  return `https://twitter.com/intent/tweet?text=${enc(text)}&url=${enc(url)}`;
}

export function buildFacebookShareUrl({ url }: SharePayload): string {
  return `https://www.facebook.com/sharer/sharer.php?u=${enc(url)}`;
}

export function buildEmailShareUrl({
  url,
  title,
  company,
}: SharePayload): string {
  const subject = `Job opportunity: ${title} at ${company}`;
  const body = `Hi,\n\nI found this role and thought it might be interesting:\n\n${title} at ${company}\n${url}\n\nBest,\n`;
  return `mailto:?subject=${enc(subject)}&body=${enc(body)}`;
}
