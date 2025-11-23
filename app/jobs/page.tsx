// app/jobs/page.tsx
import type { Metadata } from "next";
import Link from "next/link";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Jobs | Resourcin",
  description:
    "Open roles managed by Resourcin across Africa and beyond. Browse and apply without creating an account.",
};

type ClientCompanyRow = {
  name: string | null;
  logo_url: string | null;
  slug: string | null;
};

type PublicJob = {
  id: string;
  slug: string | null;
  title: string;
  location: string | null;
  employment_type: string | null;
  seniority: string | null;
  status: string | null;
  visibility: string | null;
  created_at: string;
  tags: string[] | null;
  work_mode: string | null; // remote / hybrid / onsite / flexible
  client_company: ClientCompanyRow[] | null; // Supabase nested select returns an array
};

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
  });
}

function formatWorkMode(workMode: string | null) {
  if (!workMode) return null;
  const v = workMode.toLowerCase();
  if (v === "remote") return "Remote";
  if (v === "hybrid") return "Hybrid";
  if (v === "onsite" || v === "on-site") return "On-site";
  if (v === "flexible") return "Flexible";
  return workMode;
}

function formatEmploymentType(value: string | null) {
  if (!value) return null;
  const lower = value.toLowerCase();
  if (lower === "full-time" || lower === "full_time") return "Full-time";
  if (lower === "part-time" || lower === "part_time") return "Part-time";
  if (lower === "contract") return "Contract";
  if (lower === "internship") return "Internship";
  return value;
}

export default async function JobsPage() {
  // 1) Load jobs WITHOUT strict SQL filters so we don't miss rows due to case
  const { data, error } = await supabaseAdmin
    .from("jobs")
    .select(
      `
      id,
      slug,
      title,
      location,
      employment_type,
      seniority,
      status,
      visibility,
      created_at,
      tags,
      work_mode,
      client_company (
        name,
        logo_url,
        slug
      )
    `
    )
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error loading public jobs:", error);
  }

  const rawJobs = (data ?? []) as any[];

  // 2) Case-insensitive filter: treat null/empty as "include"
  const jobs = rawJobs
    .filter((job) => {
      const status =
        typeof job.status === "string" ? job.status.toLowerCase() : "";
      const visibility =
        typeof job.visibility === "string" ? job.visibility.toLowerCase() : "";

      const isOpen = !status || status === "open";
      const isPublic = !visibility || visibility === "public";

      return isOpen && isPublic;
    })
    .map((job) => job as PublicJob);

  const count = jobs.length;

  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <header className="mb-6">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
          For candidates
        </p>
        <h1 className="mt-1 text-2xl font-semibold text-slate-900">
          Open roles
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-600">
          Browse live mandates from Resourci
