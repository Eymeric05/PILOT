"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"

export default function AuthCallback() {
  const router = useRouter()

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Récupérer le code depuis l'URL
        const { data, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error("Error getting session:", error)
          router.push("/login")
          return
        }

        if (data.session) {
          // L'utilisateur est connecté, rediriger vers la page d'accueil
          router.push("/")
        } else {
          // Pas de session, rediriger vers la page de connexion
          router.push("/login")
        }
      } catch (error) {
        console.error("Error in auth callback:", error)
        router.push("/login")
      }
    }

    handleAuthCallback()
  }, [router])

  return (
    <main className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <p className="text-muted-foreground">Connexion en cours...</p>
      </div>
    </main>
  )
}
