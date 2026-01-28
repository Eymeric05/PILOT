import { createClient } from "@supabase/supabase-js"
import type { SupabaseClient } from "@supabase/supabase-js"
import { getSupabaseEnv } from "@/lib/supabase-env"

let supabaseServerClient: SupabaseClient | null = null

export function getSupabaseServerClient(): SupabaseClient {
  if (supabaseServerClient) return supabaseServerClient

  const { supabaseUrl, supabaseKey } = getSupabaseEnv()

  supabaseServerClient = createClient(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
    db: { schema: "public" },
  })

  return supabaseServerClient
}

