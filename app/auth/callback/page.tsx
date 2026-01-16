"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"

export default function AuthCallback() {
  const router = useRouter()

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Attendre un peu pour que Supabase traite le callback
        await new Promise(resolve => setTimeout(resolve, 500))
        
        // Récupérer la session depuis l'URL (Supabase gère automatiquement les callbacks OAuth)
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error("Error getting session:", error)
          // Attendre un peu avant de rediriger pour laisser le temps à Supabase
          await new Promise(resolve => setTimeout(resolve, 1000))
          router.replace("/login")
          return
        }

        if (session?.user) {
          // L'utilisateur est connecté, rediriger vers la page d'accueil
          router.replace("/")
        } else {
          // Pas de session, attendre un peu et réessayer
          await new Promise(resolve => setTimeout(resolve, 1000))
          const { data: { session: retrySession } } = await supabase.auth.getSession()
          if (retrySession?.user) {
            router.replace("/")
          } else {
            router.replace("/login")
          }
        }
      } catch (error) {
        console.error("Error in auth callback:", error)
        // Attendre avant de rediriger
        await new Promise(resolve => setTimeout(resolve, 1000))
        router.replace("/login")
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
