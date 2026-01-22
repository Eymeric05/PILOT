"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"

export default function AuthCallback() {
  const router = useRouter()

  useEffect(() => {
    const handleAuthCallback = async () => {
      // Avec le flow implicite, Supabase détecte automatiquement les tokens dans l'URL
      // On attend que la session soit établie
      const { data: { session }, error } = await supabase.auth.getSession()
      
      if (error) {
        router.replace("/login?error=" + encodeURIComponent(error.message))
        return
      }

      if (session?.user) {
        router.replace("/")
      } else {
        // Attendre un peu et réessayer
        setTimeout(async () => {
          const { data: { session: retrySession } } = await supabase.auth.getSession()
          if (retrySession?.user) {
            router.replace("/")
          } else {
            router.replace("/login?error=Session not found")
          }
        }, 1000)
      }
    }

    handleAuthCallback()
  }, [router])

  return (
    <main className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-muted-foreground">Connexion en cours...</p>
      </div>
    </main>
  )
}
