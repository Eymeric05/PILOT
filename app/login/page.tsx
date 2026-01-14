"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { supabase } from "@/lib/supabase"
import { useRouter } from "next/navigation"
import { LogIn, Mail } from "lucide-react"

export default function LoginPage() {
  const [loading, setLoading] = useState(false)
  const [isSignUp, setIsSignUp] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
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
      setError(null)
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      })
      if (error) throw error
    } catch (error: any) {
      setError(error.message || "Erreur lors de la connexion avec Google")
    } finally {
      setLoading(false)
    }
  }

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setMessage(null)

    try {
      if (isSignUp) {
        // Inscription
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`,
          },
        })

        if (error) throw error

        if (data.user && !data.session) {
          // Email de confirmation envoyé
          setMessage("Un email de confirmation a été envoyé. Vérifiez votre boîte mail.")
        } else if (data.session) {
          // Connexion automatique après inscription
          router.push("/")
        }
      } else {
        // Connexion
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })

        if (error) throw error

        router.push("/")
      }
    } catch (error: any) {
      setError(error.message || "Une erreur est survenue")
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-background flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="h-12 w-12">
              <img
                src="/img/PILOT_logo.webp"
                alt="PILOT"
                className="h-full w-full object-contain"
              />
            </div>
            <h1 className="text-3xl font-medium">PILOT</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Budget mensuel partagé
          </p>
        </div>
        <div className="border border-border rounded-lg bg-card p-6 md:p-8 space-y-5">
          <div className="text-center">
            <h2 className="text-lg font-medium mb-1">
              {isSignUp ? "Créer un compte" : "Connexion"}
            </h2>
            <p className="text-sm text-muted-foreground">
              {isSignUp ? "Créez votre compte pour commencer" : "Connectez-vous pour accéder à votre budget"}
            </p>
          </div>

          {/* Formulaire email/mot de passe */}
          <form onSubmit={handleEmailAuth} className="space-y-4" noValidate>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="votre@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Mot de passe</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
                minLength={6}
              />
            </div>

            {error && (
              <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">
                {error}
              </div>
            )}

            {message && (
              <div className="text-sm text-green-600 bg-green-50 border border-green-200 rounded-lg p-3">
                {message}
              </div>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full gap-2"
            >
              <Mail className="h-4 w-4" />
              {loading
                ? "Chargement..."
                : isSignUp
                ? "Créer un compte"
                : "Se connecter"}
            </Button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">Ou</span>
            </div>
          </div>

          {/* Bouton Google */}
          <Button
            onClick={handleGoogleLogin}
            disabled={loading}
            variant="outline"
            className="w-full gap-2"
          >
            <LogIn className="h-4 w-4" />
            {loading ? "Connexion..." : "Continuer avec Google"}
          </Button>

          {/* Toggle inscription/connexion */}
          <div className="text-center text-sm pt-2">
            <button
              type="button"
              onClick={() => {
                setIsSignUp(!isSignUp)
                setError(null)
                setMessage(null)
              }}
              className="text-muted-foreground hover:text-foreground transition-colors duration-200 underline underline-offset-2"
              disabled={loading}
            >
              {isSignUp
                ? "Déjà un compte ? Se connecter"
                : "Pas encore de compte ? S'inscrire"}
            </button>
          </div>
        </div>
      </div>
    </main>
  )
}
