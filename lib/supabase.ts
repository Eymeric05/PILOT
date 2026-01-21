import { createBrowserClient } from '@supabase/ssr'
import type { SupabaseClient } from '@supabase/supabase-js'

let supabaseClient: SupabaseClient | null = null

function getSupabaseClient(): SupabaseClient {
  // Ne créer le client que côté client (dans le navigateur)
  if (typeof window === 'undefined') {
    // Côté serveur lors du build, créer un client avec des valeurs par défaut
    // pour éviter l'erreur de build, mais il ne sera pas utilisé
    const { createClient } = require('@supabase/supabase-js')
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key'
    return createClient(url, key)
  }

  if (supabaseClient) {
    return supabaseClient
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY')
  }

  // Utiliser createBrowserClient pour stocker le code verifier PKCE dans les cookies
  supabaseClient = createBrowserClient(supabaseUrl, supabaseAnonKey)
  
  return supabaseClient
}

// Export pour compatibilité avec le code existant
// Le client sera créé uniquement quand il est utilisé côté client
export const supabase = getSupabaseClient()
