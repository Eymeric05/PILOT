"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
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
import { User, LogOut, Mail } from "lucide-react"
import type { User as SupabaseUser } from "@supabase/supabase-js"
import { DarkModeToggle } from "@/components/dark-mode-toggle"

interface UserProfileProps {
  children?: React.ReactNode
}

export function UserProfile({ children }: UserProfileProps) {
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const checkUser = async () => {
      try {
        const { data: { user }, error } = await supabase.auth.getUser()
        if (error) throw error
        setUser(user)
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
      if (!session?.user) {
        window.location.href = "/login"
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut()
      setDrawerOpen(false)
      window.location.href = "/login"
    } catch (error) {
      console.error("Error signing out:", error)
      window.location.href = "/login"
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
          <Button variant="outline" size="sm" className="gap-2">
            <User className="h-4 w-4" />
            Profil
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
          <div className="flex items-center gap-4 p-4 rounded-3xl bg-card shadow-sm">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10">
              <User className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-base truncate tracking-tight">
                {user.user_metadata?.full_name || user.email?.split("@")[0] || "Utilisateur"}
              </p>
              <div className="flex items-center gap-2 mt-1">
                <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                <p className="text-sm text-muted-foreground truncate tracking-tight">
                  {user.email}
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <DarkModeToggle />
            </div>
            <Button
              variant="outline"
              onClick={handleSignOut}
              className="flex-1 gap-2 hover:bg-destructive/10 hover:text-destructive transition-all duration-200"
            >
              <LogOut className="h-4 w-4" />
              Se déconnecter
            </Button>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  )
}
