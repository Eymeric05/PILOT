import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import type { User as SupabaseUser } from "@supabase/supabase-js"

export function useAuth() {
  const router = useRouter()
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [householdId, setHouseholdId] = useState<string | null>(null)
  const initializedRef = useRef(false)
  const loadingInProgressRef = useRef(false)

  useEffect(() => {
    let isMounted = true

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!isMounted) return

      // Gérer la déconnexion
      if (event === 'SIGNED_OUT' || (event !== 'TOKEN_REFRESHED' && !session?.user)) {
        initializedRef.current = false
        loadingInProgressRef.current = false
        setUser(null)
        setHouseholdId(null)
        setLoading(false)
        router.push("/login")
        return
      }

      // Initialisation uniquement au premier SIGNED_IN ou INITIAL_SESSION
      if ((event === 'SIGNED_IN' || event === 'INITIAL_SESSION') && session?.user && !initializedRef.current && !loadingInProgressRef.current) {
        initializedRef.current = true
        loadingInProgressRef.current = true

        setUser(session.user)
        const hId = session.user.user_metadata?.household_id || null
        setHouseholdId(hId)

        if (isMounted) {
          setLoading(false)
          loadingInProgressRef.current = false
        }
      } else if (event === 'TOKEN_REFRESHED' && session?.user) {
        setUser(session.user)
      } else if (event === 'USER_UPDATED' && session?.user) {
        setUser(session.user)
        const hId = session.user.user_metadata?.household_id || null
        setHouseholdId(hId)
      }
    })

    // Timeout de sécurité
    const timeout = setTimeout(() => {
      if (isMounted && loading && !user) {
        setLoading(false)
        router.replace("/login")
      }
    }, 3000)

    return () => {
      isMounted = false
      subscription.unsubscribe()
      clearTimeout(timeout)
    }
  }, [router, loading, user])

  return { user, loading, householdId, setUser }
}
