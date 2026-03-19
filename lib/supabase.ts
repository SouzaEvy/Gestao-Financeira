import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;

const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY ??
  "";

// ─────────────────────────────────────────────
// Client-side: anonymous (used for Realtime only)
// ─────────────────────────────────────────────
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { persistSession: false },
  realtime: { params: { eventsPerSecond: 10 } },
});

// ─────────────────────────────────────────────
// Client-side: authenticated with Clerk JWT
// Pass the Clerk session token so Supabase RLS
// can use auth.uid() correctly
// ─────────────────────────────────────────────
export function createAuthClient(clerkToken: string) {
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false },
    global: {
      headers: {
        Authorization: `Bearer ${clerkToken}`,
      },
    },
  });
}

// ─────────────────────────────────────────────
// Server-side admin client — bypasses RLS
// Use only in API routes / server actions
// ─────────────────────────────────────────────
export function createAdminClient() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set");
  }
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
