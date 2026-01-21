"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"

export default function AuthCallback() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let timeoutId: NodeJS.Timeout | null = null
    let subscription: { unsubscribe: () => void } | null = null
    let isMounted = true

    const handleAuthCallback = async () => {
      try {
        // Vérifier s'il y a une erreur dans l'URL
        const urlParams = new URLSearchParams(window.location.search)
        const errorParam = urlParams.get('error')
        const errorDescription = urlParams.get('error_description')
        
        if (errorParam) {
          setError(errorDescription || errorParam || 'Erreur de connexion')
          timeoutId = setTimeout(() => {
            if (isMounted) {
              router.replace("/login")
            }
          }, 3000)
          return
        }

        // Écouter les changements d'authentification
        const { data: { subscription: authSubscription } } = supabase.auth.onAuthStateChange(
          async (event, session) => {
            if (!isMounted) return
            
            if (event === 'SIGNED_IN' && session?.user) {
              router.replace("/")
            } else if (event === 'SIGNED_OUT') {
              setError("Échec de la connexion")
              timeoutId = setTimeout(() => {
                if (isMounted) {
                  router.replace("/login")
                }
              }, 3000)
            }
          }
        )
        subscription = authSubscription

        // Vérifier la session actuelle après un court délai
        // pour gérer le cas où l'événement SIGNED_IN s'est déjà produit
        timeoutId = setTimeout(async () => {
          if (!isMounted) return
          
          try {
            const { data: { session }, error: sessionError } = await supabase.auth.getSession()
            
            if (sessionError) {
              setError(sessionError.message)
              setTimeout(() => {
                if (isMounted) {
                  router.replace("/login")
                }
              }, 3000)
              return
            }

            if (session?.user) {
              router.replace("/")
            } else {
              // Attendre encore un peu pour que Supabase traite le callback
              setTimeout(async () => {
                if (!isMounted) return
                
                const { data: { session: retrySession } } = await supabase.auth.getSession()
                if (retrySession?.user) {
                  router.replace("/")
                } else {
                  setError("Impossible de récupérer la session")
                  setTimeout(() => {
                    if (isMounted) {
                      router.replace("/login")
                    }
                  }, 3000)
                }
              }, 1000)
            }
          } catch (err: any) {
            setError(err.message || "Une erreur est survenue")
            setTimeout(() => {
              if (isMounted) {
                router.replace("/login")
              }
            }, 3000)
          }
        }, 500)
      } catch (error: any) {
        setError(error.message || "Une erreur est survenue")
        timeoutId = setTimeout(() => {
          if (isMounted) {
            router.replace("/login")
          }
        }, 3000)
      }
    }

    handleAuthCallback()

    // Nettoyer l'abonnement et le timeout lors du démontage
    return () => {
      isMounted = false
      if (subscription) {
        subscription.unsubscribe()
      }
      if (timeoutId) {
        clearTimeout(timeoutId)
      }
    }
  }, [router])

  return (
    <main className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="text-center space-y-4 max-w-md">
        {error ? (
          <>
            <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-6 space-y-3">
              <p className="text-destructive font-semibold text-lg">Erreur de connexion</p>
              <p className="text-muted-foreground text-sm break-words">{error}</p>
              <p className="text-muted-foreground text-xs">Redirection en cours...</p>
            </div>
          </>
        ) : (
          <>
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-muted-foreground">Connexion en cours...</p>
          </>
        )}
      </div>
    </main>
  )
}
