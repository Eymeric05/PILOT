"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"

export default function AuthCallback() {
  const router = useRouter()

  useEffect(() => {
    const handleAuthCallback = async () => {
      // Attendre que Supabase traite le callback OAuth
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      const { data: { session }, error } = await supabase.auth.getSession()
      
      if (error || !session?.user) {
        router.replace("/login?error=Connexion échouée")
        return
      }
      
      router.replace("/")
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
