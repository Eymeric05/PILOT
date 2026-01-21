"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"

export default function AuthCallback() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [detailedInstructions, setDetailedInstructions] = useState<string>('')

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
          console.error('[AUTH CALLBACK] Erreur dans l\'URL:', errorParam, errorDescription)
          
          // Traduire et améliorer les messages d'erreur courants
          let errorMessage = errorDescription || errorParam
          let instructions = ''
          
          if (errorMessage.includes('Unable to exchange external code')) {
            errorMessage = 'Erreur : Impossible d\'échanger le code OAuth avec Google'
            const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '[VOTRE-URL-SUPABASE]'
            const supabaseCallbackUrl = supabaseUrl.replace(/\/$/, '') + '/auth/v1/callback'
            instructions = `IMPORTANT - Vérifiez ces 3 points dans l'ordre :

1. GOOGLE CLOUD CONSOLE (le plus important !) :
   - Allez dans votre projet Google Cloud
   - APIs & Services > Credentials > Votre OAuth 2.0 Client ID
   - Dans "Authorized redirect URIs", ajoutez EXACTEMENT :
     ${supabaseCallbackUrl}
   - ⚠️ C'est l'URL de SUPABASE, pas celle de votre app !

2. SUPABASE - URL Configuration :
   - Authentication > URL Configuration
   - Dans "Redirect URLs", ajoutez :
     ${window.location.origin}/auth/callback

3. SUPABASE - Provider Google :
   - Authentication > Providers > Google
   - Vérifiez que le provider est ACTIVÉ (toggle ON)
   - Vérifiez que Client ID correspond EXACTEMENT à celui de Google Cloud Console
   - Vérifiez que Client Secret correspond EXACTEMENT (copiez-collez, pas de caractères cachés)
   - Si vous avez modifié les credentials, attendez 2-3 minutes

4. GOOGLE CLOUD CONSOLE - Type d'application :
   - Vérifiez que votre OAuth Client est de type "Web application"
   - Pas "Desktop app" ou "Mobile app"

5. DÉLAI DE PROPAGATION :
   - Après modification dans Google Cloud Console, attendez 2-5 minutes
   - Essayez de vider le cache du navigateur (Ctrl+Shift+Delete)`
          } else if (errorParam === 'server_error') {
            errorMessage = 'Erreur serveur lors de l\'authentification'
            instructions = 'Vérifiez la configuration OAuth dans Supabase et Google Cloud Console.'
          }
          
          setError(errorMessage)
          setDetailedInstructions(instructions)
          timeoutId = setTimeout(() => {
            if (isMounted) {
              router.replace("/login")
            }
          }, 5000) // Plus de temps pour lire le message
          return
        }

        // Écouter les changements d'authentification
        const { data: { subscription: authSubscription } } = supabase.auth.onAuthStateChange(
          async (event, session) => {
            if (!isMounted) return
            
            console.log('[AUTH CALLBACK] Auth state change:', event, session?.user?.email || 'No user')
            
            if (event === 'SIGNED_IN' && session?.user) {
              console.log('[AUTH CALLBACK] Connexion réussie, redirection vers /')
              router.replace("/")
            } else if (event === 'SIGNED_OUT') {
              console.log('[AUTH CALLBACK] Déconnexion détectée')
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
              console.error('[AUTH CALLBACK] Erreur lors de la récupération de la session:', sessionError)
              setError(sessionError.message)
              setTimeout(() => {
                if (isMounted) {
                  router.replace("/login")
                }
              }, 3000)
              return
            }

            if (session?.user) {
              console.log('[AUTH CALLBACK] Session trouvée, redirection vers /')
              router.replace("/")
            } else {
              console.log('[AUTH CALLBACK] Aucune session trouvée après délai')
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
            console.error('[AUTH CALLBACK] Exception:', err)
            setError(err.message || "Une erreur est survenue")
            setTimeout(() => {
              if (isMounted) {
                router.replace("/login")
              }
            }, 3000)
          }
        }, 500)
      } catch (error: any) {
        console.error('[AUTH CALLBACK] Erreur dans handleAuthCallback:', error)
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
            <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-6 space-y-4 max-w-2xl">
              <p className="text-destructive font-semibold text-lg">Erreur de connexion</p>
              <p className="text-muted-foreground text-sm break-words font-medium">{error}</p>
              {detailedInstructions && (
                <div className="pt-3 border-t border-destructive/20">
                  <div className="bg-background/50 rounded p-4">
                    <pre className="text-xs text-muted-foreground whitespace-pre-wrap font-mono leading-relaxed">
                      {detailedInstructions}
                    </pre>
                  </div>
                </div>
              )}
              <p className="text-muted-foreground text-xs pt-2">Redirection en cours dans quelques secondes...</p>
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
