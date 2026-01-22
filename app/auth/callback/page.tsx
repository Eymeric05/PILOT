"use client"

import { useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"

export default function AuthCallback() {
  const router = useRouter()
  const handledRef = useRef(false)

  useEffect(() => {
    if (handledRef.current) return
    handledRef.current = true

    let redirectDone = false

    const redirect = (path: string) => {
      if (!redirectDone) {
        redirectDone = true
        router.replace(path)
      }
    }

    // Utiliser onAuthStateChange pour détecter la connexion
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        subscription.unsubscribe()
        redirect("/")
      }
    })

    // Fallback : vérifier la session après un court délai
    const checkSession = async () => {
      await new Promise(resolve => setTimeout(resolve, 500))
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        subscription.unsubscribe()
        redirect("/")
      } else {
        subscription.unsubscribe()
        redirect("/login?error=Connexion échouée")
      }
    }

    checkSession()

    // Timeout de sécurité
    const timeout = setTimeout(() => {
      subscription.unsubscribe()
      redirect("/login?error=Timeout de connexion")
    }, 3000)

    return () => {
      subscription.unsubscribe()
      clearTimeout(timeout)
    }
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
