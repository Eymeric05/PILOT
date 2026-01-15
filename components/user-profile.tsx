"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer"
import { supabase } from "@/lib/supabase"
import { useRouter } from "next/navigation"
import { User, LogOut, Mail, Edit2 } from "lucide-react"
import type { User as SupabaseUser } from "@supabase/supabase-js"

interface UserProfileProps {
  children?: React.ReactNode
}

export function UserProfile({ children }: UserProfileProps) {
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [displayName, setDisplayName] = useState("")
  const [isEditingName, setIsEditingName] = useState(false)
  const [savingName, setSavingName] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const checkUser = async () => {
      try {
        const { data: { user }, error } = await supabase.auth.getUser()
        if (error) throw error
        setUser(user)
        setDisplayName(user?.user_metadata?.display_name || user?.email?.split("@")[0] || "")
      } catch (error) {
        console.error("Error getting user:", error)
        setUser(null)
      } finally {
        setLoading(false)
      }
    }

    checkUser()

    // Écouter les changements d'authentification
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        setDisplayName(session.user.user_metadata?.display_name || session.user.email?.split("@")[0] || "")
      }
      // Ne pas rediriger automatiquement ici pour éviter les conflits avec la déconnexion
    })

    return () => subscription.unsubscribe()
  }, [])

  const handleSignOut = async () => {
    try {
      setDrawerOpen(false)
      // Attendre un peu pour que le drawer se ferme
      await new Promise(resolve => setTimeout(resolve, 100))
      
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      
      // Forcer la redirection après déconnexion
      window.location.href = "/login"
    } catch (error) {
      console.error("Error signing out:", error)
      // Forcer la redirection même en cas d'erreur
      window.location.href = "/login"
    }
  }

  const handleSaveDisplayName = async () => {
    if (!user || !displayName.trim()) return

    setSavingName(true)
    try {
      const { error } = await supabase.auth.updateUser({
        data: { display_name: displayName.trim() },
      })

      if (error) throw error

      // Mettre à jour l'utilisateur localement
      setUser({
        ...user,
        user_metadata: {
          ...user.user_metadata,
          display_name: displayName.trim(),
        },
      })
      setIsEditingName(false)
    } catch (error: any) {
      console.error("Error updating display name:", error)
      alert(`Erreur lors de la mise à jour du pseudo: ${error.message}`)
    } finally {
      setSavingName(false)
    }
  }

  if (loading) {
    return null
  }

  if (!user) {
    return null
  }

  return (
    <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
      <DrawerTrigger asChild>
        {children || (
          <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl">
            <User className="h-4 w-4" />
          </Button>
        )}
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader className="text-left">
          <DrawerTitle>Profil utilisateur</DrawerTitle>
          <DrawerDescription>
            Informations de votre compte
          </DrawerDescription>
        </DrawerHeader>
        <div className="px-4 pb-8 space-y-4">
          <div className="flex items-center gap-4 p-4 rounded-2xl bg-card border-2 border-border">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10">
              <User className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              {isEditingName ? (
                <div className="space-y-2">
                  <Label htmlFor="displayName">Pseudo</Label>
                  <div className="flex gap-2">
                    <Input
                      id="displayName"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="Votre pseudo"
                      className="flex-1"
                    />
                    <Button
                      size="sm"
                      onClick={handleSaveDisplayName}
                      disabled={savingName || !displayName.trim()}
                    >
                      {savingName ? "..." : "OK"}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setIsEditingName(false)
                        setDisplayName(user?.user_metadata?.display_name || user?.email?.split("@")[0] || "")
                      }}
                    >
                      Annuler
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-base truncate tracking-tight">
                      {user.user_metadata?.display_name || user.email?.split("@")[0] || "Utilisateur"}
                    </p>
                    <button
                      type="button"
                      onClick={() => setIsEditingName(true)}
                      className="p-1 hover:bg-muted rounded transition-colors"
                      aria-label="Modifier le pseudo"
                    >
                      <Edit2 className="h-3.5 w-3.5 text-muted-foreground" />
                    </button>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground truncate tracking-tight">
                      {user.email}
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>
          <Button
            variant="outline"
            onClick={handleSignOut}
            className="w-full gap-2 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/20 transition-all duration-200"
          >
            <LogOut className="h-4 w-4" />
            Se déconnecter
          </Button>
        </div>
      </DrawerContent>
    </Drawer>
  )
}
