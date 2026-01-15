"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { supabase } from "@/lib/supabase"
import { useRouter } from "next/navigation"
import { LogIn, Mail } from "lucide-react"
import { DarkModeToggle } from "@/components/dark-mode-toggle"
import Link from "next/link"
import Image from "next/image"

export default function LoginPage() {
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
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

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error

      router.push("/")
    } catch (error: any) {
      setError(error.message || "Une erreur est survenue")
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-background flex items-center justify-center px-6 py-8">
      <div className="w-full max-w-md">
        {/* Header avec toggle mode nuit */}
        <div className="absolute top-4 right-4">
          <DarkModeToggle />
        </div>
        
        <div className="text-center mb-10">
          <Link href="/" className="inline-block">
            <div className="flex items-center justify-center gap-3 mb-4 cursor-pointer hover:opacity-80 transition-opacity">
              <div className="h-14 w-14 flex items-center justify-center">
                <Image
                  src="/PILOT_logo.webp"
                  alt="PILOT"
                  width={56}
                  height={56}
                  className="h-full w-full object-contain"
                />
              </div>
              <h1 className="text-4xl font-bold text-foreground tracking-tight">PILOT</h1>
            </div>
          </Link>
          <p className="text-sm text-muted-foreground tracking-tight">
            Application de gestion de budget
          </p>
        </div>
        <div className="rounded-3xl bg-card shadow-sm p-8 space-y-6">
          <div className="text-center">
            <h2 className="text-xl font-semibold mb-2 text-foreground tracking-tight">
              Connexion
            </h2>
            <p className="text-sm text-muted-foreground tracking-tight">
              Connectez-vous pour accéder à votre application de gestion de budget
            </p>
          </div>

          {/* Formulaire email/mot de passe */}
          <form onSubmit={handleEmailLogin} className="space-y-4" noValidate>
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
              <div className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg p-3">
                {error}
              </div>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full gap-2"
            >
              <LogIn className="h-4 w-4" />
              {loading ? "Connexion..." : "Se connecter"}
            </Button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-muted" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground tracking-tight">Ou</span>
            </div>
          </div>

          {/* Bouton Google */}
          <Button
            onClick={handleGoogleLogin}
            disabled={loading}
            variant="outline"
            className="w-full gap-2"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            {loading ? "Connexion..." : "Continuer avec Google"}
          </Button>

          {/* Lien vers inscription */}
          <div className="text-center text-sm pt-2">
            <Link
              href="/register"
              className="text-muted-foreground hover:text-foreground transition-colors duration-200 underline underline-offset-2"
            >
              Pas encore de compte ? S&apos;inscrire
            </Link>
          </div>
        </div>
      </div>
    </main>
  )
}
