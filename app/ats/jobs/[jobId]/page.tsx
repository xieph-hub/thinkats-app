// app/ats/jobs/[jobId]/page.tsx
import { notFound } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { ApplicationsSplitView } from "@/components/ats/ApplicationsSplitView";

type JobRow = {
  id: string;
  title: string;
  location: string | null;
  status: string | null;
};

type ApplicationRow = {
  id: string;
  job_id: string;
  full_name: string;
  email: string;
  phone: string | null;
  location: string | null;
  status: string | null;
  cv_url: string | null;
  created_at: string;
  status_changed_at: string | null;
  status_note: string | null;
};

type InterviewRow = {
  id: string;
  application_id: string;
  scheduled_at: string;
  type: string | null;
  location: string | null;
  notes: string | null;
};

type ApplicationStatus =
  | "applied"
  | "screening"
  | "interview"
  | "offer"
  | "rejected";

type TimelineEvent = {
  label: string;
  at: string;
  note?: string;
};

type ApplicationsSplitViewApplication = {
  id: string;
  fullName: string;
  email: string;
  status: ApplicationStatus;
  appliedAt: string;
  location?: string;
  cvUrl?: string;
  phone?: string;
  timeline?: TimelineEvent[];
  latestNote?: string;
};

type PageProps = {
  params: { jobId: string };
};

export const dynamic = "force-dynamic";

export default async function AtsJobPage({ params }: PageProps) {
  const jobId = params.jobId;

  if (!jobId) {
    notFound();
  }

  // 1) Load job
  const { data: jobData, error: jobError } = await supabaseAdmin
    .from("jobs")
    .select("id, title, location, status")
    .eq("id", jobId)
    .maybeSingle<JobRow>();

  if (jobError) {
    console.error("ATS job page – error loading job:", jobError);
  }

  if (!jobData) {
    notFound();
  }

  // 2) Load applications
  const { data: appsData, error: appsError } = await supabaseAdmin
    .from("job_applications")
    .select(
      `
      id,
      job_id,
      full_name,
      email,
      phone,
      location,
      status,
      cv_url,
      created_at,
      status_changed_at,
      status_note
    `
    )
    .eq("job_id", jobId)
    .order("created_at", { ascending: true });

  if (appsError) {
    console.error("ATS job page – error loading applications:", appsError);
  }

  const appRows: ApplicationRow[] = (appsData ?? []) as ApplicationRow[];

  // 3) Load interviews for those applications
  let interviewRows: InterviewRow[] = [];

  if (appRows.length > 0) {
    const appIds = appRows.map((a) => a.id);

    const { data: interviewsData, error: interviewsError } =
      await supabaseAdmin
        .from("application_interviews")
        .select(
          `
          id,
          application_id,
          scheduled_at,
          type,
          location,
          notes
        `
        )
        .in("application_id", appIds);

    if (interviewsError) {
      console.error(
        "ATS job page – error loading interviews:",
        interviewsError
      );
    }

    interviewRows = (interviewsData ?? []) as InterviewRow[];
  }

  // 4) Shape for ApplicationsSplitView
  const allowedStatuses: ApplicationStatus[] = [
    "applied",
    "screening",
    "interview",
    "offer",
    "rejected",
  ];

  const applications: ApplicationsSplitViewApplication[] = appRows.map(
    (row) => {
      const rawStatus = (row.status || "applied").toLowerCase();
      const safeStatus: ApplicationStatus = allowedStatuses.includes(
        rawStatus as ApplicationStatus
      )
        ? (rawStatus as ApplicationStatus)
        : "applied";

      const timeline: TimelineEvent[] = [];

      // Applied
      if (row.created_at) {
        timeline.push({
          label: "Applied",
          at: row.created_at,
        });
      }

      // Status change
      if (row.status_changed_at) {
        const niceStatus =
          safeStatus.charAt(0).toUpperCase() + safeStatus.slice(1);
        timeline.push({
          label: `Moved to ${niceStatus}`,
          at: row.status_changed_at,
          note: row.status_note || undefined,
        });
      }

      // Interviews
      const myInterviews = interviewRows.filter(
        (iv) => iv.application_id === row.id
      );
      for (const iv of myInterviews) {
        const typeLabel = iv.type
          ? iv.type.charAt(0).toUpperCase() + iv.type.slice(1)
          : "Interview";
        timeline.push({
          label: `Interview scheduled (${typeLabel})`,
          at: iv.scheduled_at,
          note: iv.notes || undefined,
        });
      }

      // Sort by time ascending
      timeline.sort(
        (a, b) => new Date(a.at).getTime() - new Date(b.at).getTime()
      );

      // Derive latestNote (prefer the most recent event that has a note)
      const latestNoteFromTimeline =
        [...timeline].reverse().find((ev) => !!ev.note)?.note;

      const latestNote =
        latestNoteFromTimeline || row.status_note || undefined;

      return {
        id: row.id,
        fullName: row.full_name,
        email: row.email,
        status: safeStatus,
        appliedAt: row.created_at,
        location: row.location ?? undefined,
        cvUrl: row.cv_url ?? undefined,
        phone: row.phone ?? undefined,
        timeline,
        latestNote,
      };
    }
  );

  const applicationsCount = applications.length;

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <header className="mb-4 border-b border-slate-100 pb-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
          ATS • Job pipeline
        </p>
        <h1 className="mt-1 text-xl font-semibold text-slate-900">
          {jobData.title}
        </h1>
        <p className="mt-1 text-[12px] text-slate-500">
          {jobData.location || "Location not specified"}
          {jobData.status ? ` • Status: ${jobData.status}` : null}
          {applicationsCount > 0
            ? ` • ${applicationsCount} application${
                applicationsCount === 1 ? "" : "s"
              }`
            : " • No applications yet"}
        </p>
      </header>

      <section>
        <ApplicationsSplitView applications={applications} />
      </section>
    </main>
  );
}
