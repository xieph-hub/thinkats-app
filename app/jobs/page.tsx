// app/jobs/page.tsx
import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabaseServerClient";

type PublicJob = {
  id: string;
  slug: string | null;
  title: string;
  clientName: string | null;
  location: string | null;
  employmentType: string | null;
  remoteOption: string | null;
  summary: string | null;
  postedAt: string | null;
  status: string;
};

async function loadPublicJobs(): Promise<PublicJob[]> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("jobs") // ✅ canonical table
    .select(
      `
        id,
        slug,
        title,
        clientName,
        location,
        employmentType,
        remoteOption,
        summary,
        postedAt,
        status,
        isPublished
      `
    )
    .eq("isPublished", true)
    .eq("status", "open") // only open roles on public board
    .order("postedAt", { ascending: false });

  if (error || !data) {
    console.error("Error loading public jobs from jobs table:", error);
    return [];
  }

  return data.map((row: any) => ({
    id: row.id,
    slug: row.slug ?? null,
    title: row.title,
    clientName: row.clientName ?? null,
    location: row.location ?? null,
    employmentType: row.employmentType ?? null,
    remoteOption: row.remoteOption ?? null,
    summary: row.summary ?? null,
    postedAt: row.postedAt ?? null,
    status: row.status || (row.isPublished ? "open" : "draft"),
  }));
}

export const revalidate = 6
