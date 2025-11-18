// lib/candidates.ts
import { createServerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function getCandidateDetail(candidateId: string) {
  const cookieStore = cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: () => cookieStore }
  );

  // candidate profile
  const { data: candidate, error: candError } = await supabase
    .from('candidates')
    .select('*')
    .eq('id', candidateId)
    .single();

  if (candError) throw candError;

  // applications + job context
  const { data: applications, error: appsError } = await supabase
    .from('applications')
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
    .eq('candidate_id', candidateId)
    .order('applied_at', { ascending: false });

  if (appsError) throw appsError;

  // notes
  const { data: notes, error: notesError } = await supabase
    .from('notes')
    .select(
      `
      id,
      body,
      note_type,
      created_at,
      author:users (
        id,
        full_name
      ),
      application_id
    `
    )
    .eq('candidate_id', candidateId)
    .order('created_at', { ascending: false });

  if (notesError) throw notesError;

  return { candidate, applications, notes };
}
