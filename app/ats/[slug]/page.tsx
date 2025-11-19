// app/ats/[slug]/page.tsx
import { getJobForCurrentTenantBySlug } from "@/lib/jobs"
import Link from "next/link"

interface JobPageProps {
  params: { slug: string }
}

export default async function JobPage({ params }: JobPageProps) {
  const job = await getJobForCurrentTenantBySlug(params.slug)

  if (!job) {
    return (
      <div className="p-6 max-w-xl">
        <h1 className="text-xl font-semibold mb-2">Job not found</h1>
        <p className="mb-4 text-sm text-gray-600">
          This job either doesn&apos;t exist, doesn&apos;t belong to your tenant, or has been removed.
        </p>
        <Link href="/ats" className="text-blue-600 underline">
          Back to ATS dashboard
        </Link>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-2xl space-y-4">
      <div>
        <h1 className="text-2xl font-bold">{job.title}</h1>
        <p className="text-sm text-gray-500">
          {job.location} • {job.function ?? "General"}
        </p>
      </div>

      {job.summary && <p className="text-sm text-gray-700">{job.summary}</p>}

      {job.description && (
        <div className="mt-4 text-sm leading-relaxed whitespace-pre-line">
          {job.description}
        </div>
      )}

      <Link href="/ats" className="inline-block mt-6 text-sm text-blue-600 underline">
        Back to ATS dashboard
      </Link>
    </div>
  )
}
