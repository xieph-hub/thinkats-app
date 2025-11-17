// lib/supabaseAdmin.ts
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY; // fallback so it never ends up "undefined"

if (!url) {
  throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL for Supabase client");
}

if (!serviceKey) {
  throw new Error(
    "Missing SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY for Supabase client"
  );
}

export const supabaseAdmin = createClient(url, serviceKey, {
  auth: {
    persistSession: false,
  },
});
