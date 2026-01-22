"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"

export default function AuthCallback() {
  const router = useRouter()

  useEffect(() => {
    const handleAuthCallback = async () => {
      // Supabase détecte automatiquement les tokens dans l'URL
      const { data: { session } } = await supabase.auth.getSession()
      
      if (session?.user) {
        router.replace("/")
      } else {
        // Attendre un peu pour que Supabase traite le callback
        setTimeout(() => {
          router.replace("/")
        }, 500)
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
