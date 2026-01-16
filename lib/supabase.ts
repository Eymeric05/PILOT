import { createClient, type SupabaseClient } from '@supabase/supabase-js'

let supabaseClient: SupabaseClient | null = null

function getSupabaseClient(): SupabaseClient {
  // Ne créer le client que côté client (dans le navigateur)
  // Cela évite les erreurs lors du build serveur
  if (typeof window === 'undefined') {
    // Côté serveur lors du build, créer un client avec des valeurs par défaut
    // pour éviter l'erreur de build, mais il ne sera pas utilisé
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
    const errorMsg = 'Missing Supabase environment variables. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY'
    console.error('[SUPABASE INIT ERROR]', errorMsg, {
      hasUrl: !!supabaseUrl,
      hasKey: !!supabaseAnonKey,
    })
    throw new Error(errorMsg)
  }

  // Vérifier que l'URL utilise HTTPS (sauf en développement local)
  if (!supabaseUrl.startsWith('https://') && !supabaseUrl.includes('localhost')) {
    console.warn('[SUPABASE WARNING] URL ne commence pas par https://:', supabaseUrl.substring(0, 50))
  }

  // Vérifier le format de la clé
  if (supabaseAnonKey.length < 20) {
    console.warn('[SUPABASE WARNING] La clé API semble trop courte')
  }

  supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  })
  
  return supabaseClient
}

// Export pour compatibilité avec le code existant
// Le client sera créé uniquement quand il est utilisé côté client
export const supabase = getSupabaseClient()
