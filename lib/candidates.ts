// lib/candidates.ts
import { createSupabaseServerClient } from "./supabaseServer";

/**
 * Get full candidate detail:
 * - candidate profile
 * - applications + job context
 * - notes + author info
 */
export async function getCandidateDetail(candidateId: string) {
  const supabase = await createSupabaseServer();

  // Candidate profile
  const { data: candidate, error: candError } = await supabase
    .from("candidates")
    .select("*")
    .eq("id", candidateId)
    .single();

  if (candError) throw candError;

  // Applications + job info
  const { data: applications, error: appsError } = await supabase
    .from("applications")
    .select(
      `
      id,
      status,
      applied_at,
      current_stage_id,
      job:jobs (
        id,
        title,
        department,
        location
      )
    `
    )
    .eq("candidate_id", candidateId)
    .order("applied_at", { ascending: false });

  if (appsError) throw appsError;

  // Notes (timeline)
  const { data: notes, error: notesError } = await supabase
    .from("notes")
    .select(
      `
      id,
      body,
      note_type,
      created_at,
      application_id,
      author:users (
        id,
        full_name
      )
    `
    )
    .eq("candidate_id", candidateId)
    .order("created_at", { ascending: false });

  if (notesError) throw notesError;

  return {
    candidate,
    applications: applications ?? [],
    notes: notes ?? [],
  };
}
