import { createClient } from '@supabase/supabase-js'
import type { SupabaseClient } from '@supabase/supabase-js'
import { getSupabaseEnv } from "@/lib/supabase-env"

let supabaseClient: SupabaseClient | null = null

function getSupabaseClient(): SupabaseClient {
  if (supabaseClient) {
    return supabaseClient
  }

  const { supabaseUrl, supabaseKey } = getSupabaseEnv()

  // Singleton : une seule instance du client Supabase
  supabaseClient = createClient(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storage: typeof window !== 'undefined' ? window.localStorage : undefined,
      flowType: 'pkce',
    },
    global: {
      headers: {
        'x-client-info': 'planning-depenses',
      },
    },
    db: {
      schema: 'public',
    },
  })
  
  // Vérification que le singleton est bien créé
  if (!supabaseClient) {
    throw new Error('Failed to create Supabase client')
  }
  
  return supabaseClient
}

export const supabase = getSupabaseClient()
