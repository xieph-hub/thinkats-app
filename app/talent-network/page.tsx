// app/talent-network/page.tsx

import TalentNetworkForm from "./TalentNetworkForm"; // adjust path/name if different

function humanizeSlug(slug: string) {
  if (!slug) return "";

  // "senior-product-manager-fintech" -> "Senior Product Manager Fintech"
  const withSpaces = slug.replace(/[-_]+/g, " ").trim();

  return withSpaces.replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function TalentNetworkPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const campaignRaw = searchParams.utm_campaign;
  const campaign =
    typeof campaignRaw === "string" ? campaignRaw : campaignRaw?.[0];

  const prefillRole = campaign ? humanizeSlug(campaign) : "";

  return (
    <div className="min-h-screen bg-slate-50">
      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
        {/* Your existing heading + copy */}
        <section className="mb-6 space-y-3">
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
            Share your profile once. We’ll plug you into the right searches.
          </h1>
          <p className="text-sm text-slate-700 sm:text-base">
            This isn&apos;t a job board. It&apos;s a short, structured way for us
            to understand your
