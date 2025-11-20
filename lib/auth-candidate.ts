// lib/auth-candidate.ts

import supabaseAdmin from "@/lib/supabaseAdmin";

/**
 * Internal helper to fetch a candidate row from Supabase
 * using a one-time login token + expiry check.
 *
 * We try both snake_case and camelCase column names so it
 * still works even if the DB uses one or the other.
 */
async function findCandidateByToken(token: string) {
  if (!token) return null;

  const supabase = supabaseAdmin as any;
  const nowIso = new Date().toISOString();

  let candidate: any = null;

  // 1) Try snake_case columns: login_token, login_token_expires_at
  try {
    const { data, error } = await supabase
      .from("candidates")
      .select("*")
      .eq("login_token", token)
      .gt("login_token_expires_at", nowIso)
      .limit(1);

    if (error) {
      console.error("Error fetching candidate (snake_case):", error);
    } else if (data && data.length > 0) {
      candidate = data[0];
    }
  } catch (err) {
    console.error("Unexpected error fetching candidate (snake_case):", err);
  }

  // 2) If nothing found, try camelCase columns: loginToken, loginTokenExpiresAt
  if (!candidate) {
    try {
      const { data: data2, error: error2 } = await supabase
        .from("candidates")
        .select("*")
        .eq("loginToken", token)
        .gt("loginTokenExpiresAt", nowIso)
        .limit(1);

      if (error2) {
        console.error("Error fetching candidate (camelCase):", error2);
      } else if (data2 && data2.length > 0) {
        candidate = data2[0];
      }
    } catch (err) {
      console.error("Unexpected error fetching candidate (camelCase):", err);
    }
  }

  if (!candidate) {
    return null;
  }

  return candidate;
}

/**
 * Main function – this is likely what your other code imports.
 * We keep the name so imports do not break.
 */
export async function getCandidateFromToken(token: string) {
  return findCandidateByToken(token);
}

/**
 * Extra alias – if any other part of the code was using this
 * more explicit name, it will still work.
 */
export async function getCandidateFromLoginToken(token: string) {
  return findCandidateByToken(token);
}
