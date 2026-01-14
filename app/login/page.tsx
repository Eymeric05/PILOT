"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { supabase } from "@/lib/supabase"
import { useRouter } from "next/navigation"
import { LogIn } from "lucide-react"

export default function LoginPage() {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  useEffect(() => {
    // Vérifier si l'utilisateur est déjà connecté
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        router.push("/")
      }
    })

    // Écouter les changements d'authentification
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        router.push("/")
      }
    })

    return () => subscription.unsubscribe()
  }, [router])

  const handleGoogleLogin = async () => {
    try {
      setLoading(true)
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      })
      if (error) throw error
    } catch (error) {
      console.error("Error logging in:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-background flex items-center justify-center">
      <div className="container mx-auto max-w-md px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-medium mb-2">PILOT</h1>
          <p className="text-sm text-muted-foreground">
            Budget mensuel partagé
          </p>
        </div>
        <div className="border border-border rounded bg-card p-6 space-y-4">
          <p className="text-sm text-muted-foreground text-center">
            Connectez-vous pour accéder à votre budget
          </p>
          <Button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full gap-2"
          >
            <LogIn className="h-4 w-4" />
            {loading ? "Connexion..." : "Se connecter avec Google"}
          </Button>
        </div>
      </div>
    </main>
  )
}
