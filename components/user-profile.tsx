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
import { User, LogOut, Mail, Edit2, Upload, X, Settings } from "lucide-react"
import Image from "next/image"
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
  const [partnerName, setPartnerName] = useState("")
  const [isEditingPartnerName, setIsEditingPartnerName] = useState(false)
  const [savingPartnerName, setSavingPartnerName] = useState(false)
  const [profilePicture, setProfilePicture] = useState<string | null>(null)
  const [partnerProfilePicture, setPartnerProfilePicture] = useState<string | null>(null)
  const [uploadingPicture, setUploadingPicture] = useState<"user" | "partner" | null>(null)
  const router = useRouter()

  useEffect(() => {
    let isMounted = true

    const checkUser = async () => {
      try {
        // Utiliser getSession() pour une vérification locale rapide (pas de requête réseau)
        const { data: { session } } = await supabase.auth.getSession()
        if (!isMounted) return

        if (session?.user) {
          setUser(session.user)
          setDisplayName(session.user.user_metadata?.display_name || session.user.email?.split("@")[0] || "")
          setPartnerName(session.user.user_metadata?.partner_name || "Personnel B")
          setProfilePicture(session.user.user_metadata?.profile_picture_url || null)
          setPartnerProfilePicture(session.user.user_metadata?.partner_profile_picture_url || null)
        } else {
          setUser(null)
        }
      } catch (error) {
        // Ignorer les erreurs silencieusement
        if (isMounted) {
          setUser(null)
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }

      // NE PAS faire d'appel getUser() en arrière-plan - cela cause des erreurs réseau en boucle
      // La session locale est suffisante
    }

    checkUser()

    // Écouter UNIQUEMENT les changements d'authentification explicites
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!isMounted) return

      // Ignorer INITIAL_SESSION et TOKEN_REFRESHED pour éviter les mises à jour inutiles
      if (event === 'INITIAL_SESSION' || event === 'TOKEN_REFRESHED') {
        return
      }

      setUser(session?.user ?? null)
      if (session?.user) {
        setDisplayName(session.user.user_metadata?.display_name || session.user.email?.split("@")[0] || "")
        setPartnerName(session.user.user_metadata?.partner_name || "Personnel B")
        setProfilePicture(session.user.user_metadata?.profile_picture_url || null)
        setPartnerProfilePicture(session.user.user_metadata?.partner_profile_picture_url || null)
      }
    })

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
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
        data: { 
          display_name: displayName.trim(),
          partner_name: partnerName.trim(),
          profile_picture_url: profilePicture,
          partner_profile_picture_url: partnerProfilePicture,
        },
      })

      if (error) throw error

      // Mettre à jour l'utilisateur localement
      setUser({
        ...user,
        user_metadata: {
          ...user.user_metadata,
          display_name: displayName.trim(),
          partner_name: partnerName.trim(),
          profile_picture_url: profilePicture,
          partner_profile_picture_url: partnerProfilePicture,
        },
      })
      setIsEditingName(false)
    } catch (error: any) {
      console.error("Error updating display name:", error)
      alert(`Erreur lors de la mise à jour: ${error.message}`)
    } finally {
      setSavingName(false)
    }
  }

  const handleSavePartnerName = async () => {
    if (!user || !partnerName.trim()) return

    setSavingPartnerName(true)
    try {
      const { error } = await supabase.auth.updateUser({
        data: { 
          display_name: displayName.trim(),
          partner_name: partnerName.trim(),
          profile_picture_url: profilePicture,
          partner_profile_picture_url: partnerProfilePicture,
        },
      })

      if (error) throw error

      setUser({
        ...user,
        user_metadata: {
          ...user.user_metadata,
          partner_name: partnerName.trim(),
        },
      })
      setIsEditingPartnerName(false)
    } catch (error: any) {
      console.error("Error updating partner name:", error)
      alert(`Erreur lors de la mise à jour: ${error.message}`)
    } finally {
      setSavingPartnerName(false)
    }
  }

  const handleUploadPicture = async (file: File, type: "user" | "partner") => {
    if (!user) return

    setUploadingPicture(type)
    try {
      // Convertir l'image en base64 pour stockage dans user_metadata
      const reader = new FileReader()
      reader.onloadend = async () => {
        const base64String = reader.result as string
        
        try {
          const metadataKey = type === "user" ? "profile_picture_url" : "partner_profile_picture_url"
          const { error } = await supabase.auth.updateUser({
            data: { 
              [metadataKey]: base64String,
              display_name: displayName.trim(),
              partner_name: partnerName.trim(),
              profile_picture_url: type === "user" ? base64String : profilePicture,
              partner_profile_picture_url: type === "partner" ? base64String : partnerProfilePicture,
            },
          })

          if (error) throw error

          if (type === "user") {
            setProfilePicture(base64String)
          } else {
            setPartnerProfilePicture(base64String)
          }

          setUser({
            ...user,
            user_metadata: {
              ...user.user_metadata,
              [metadataKey]: base64String,
            },
          })

          // Déclencher un événement pour mettre à jour l'utilisateur dans page.tsx
          window.dispatchEvent(new CustomEvent('userMetadataUpdated'))
        } catch (error: any) {
          console.error("Error uploading picture:", error)
          alert(`Erreur lors du téléchargement: ${error.message}`)
        } finally {
          setUploadingPicture(null)
        }
      }
      reader.readAsDataURL(file)
    } catch (error: any) {
      console.error("Error reading file:", error)
      alert(`Erreur lors de la lecture du fichier: ${error.message}`)
      setUploadingPicture(null)
    }
  }

  const handleRemovePicture = async (type: "user" | "partner") => {
    if (!user) return

    try {
      const metadataKey = type === "user" ? "profile_picture_url" : "partner_profile_picture_url"
      const { error } = await supabase.auth.updateUser({
        data: { 
          [metadataKey]: null,
          display_name: displayName.trim(),
          partner_name: partnerName.trim(),
          profile_picture_url: type === "user" ? null : profilePicture,
          partner_profile_picture_url: type === "partner" ? null : partnerProfilePicture,
        },
      })

      if (error) throw error

      if (type === "user") {
        setProfilePicture(null)
      } else {
        setPartnerProfilePicture(null)
      }

      setUser({
        ...user,
        user_metadata: {
          ...user.user_metadata,
          [metadataKey]: null,
        },
      })

      // Déclencher un événement pour mettre à jour l'utilisateur dans page.tsx
      window.dispatchEvent(new CustomEvent('userMetadataUpdated'))
    } catch (error: any) {
      console.error("Error removing picture:", error)
      alert(`Erreur lors de la suppression: ${error.message}`)
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
          {/* Mon profil */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 mb-2">
              <Settings className="h-4 w-4 text-muted-foreground" />
              <Label className="text-sm font-semibold">Mon profil (Personnel A)</Label>
            </div>
            <div className="flex items-center gap-4 p-4 rounded-2xl bg-card border-2 border-border">
              <div className="relative">
                {profilePicture ? (
                  <div className="relative h-16 w-16 rounded-xl overflow-hidden border-2 border-border">
                    <Image
                      src={profilePicture}
                      alt="Photo de profil"
                      width={64}
                      height={64}
                      className="object-cover"
                      unoptimized
                    />
                    <button
                      onClick={() => handleRemovePicture("user")}
                      className="absolute -top-1 -right-1 p-1 bg-destructive rounded-full text-white hover:bg-destructive/80 transition-colors"
                      aria-label="Supprimer la photo"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ) : (
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-primary/10 border-2 border-border">
                    <User className="h-8 w-8 text-primary" />
                  </div>
                )}
                <label
                  htmlFor="userPicture"
                  className="absolute -bottom-1 -right-1 p-1.5 bg-primary rounded-full text-primary-foreground hover:bg-primary/80 transition-colors cursor-pointer"
                  title="Changer la photo"
                >
                  <Upload className="h-3.5 w-3.5" />
                  <input
                    id="userPicture"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) handleUploadPicture(file, "user")
                    }}
                    disabled={uploadingPicture === "user"}
                  />
                </label>
              </div>
              <div className="flex-1 min-w-0">
                {isEditingName ? (
                  <div className="space-y-2">
                    <Label htmlFor="displayName">Nom</Label>
                    <div className="flex gap-2">
                      <Input
                        id="displayName"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        placeholder="Votre nom"
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
                        aria-label="Modifier le nom"
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
          </div>

          {/* Partenaire (Personnel B) */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 mb-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <Label className="text-sm font-semibold">Partenaire (Personnel B)</Label>
            </div>
            <div className="flex items-center gap-4 p-4 rounded-2xl bg-card border-2 border-border">
              <div className="relative">
                {partnerProfilePicture ? (
                  <div className="relative h-16 w-16 rounded-xl overflow-hidden border-2 border-border">
                    <Image
                      src={partnerProfilePicture}
                      alt="Photo du partenaire"
                      width={64}
                      height={64}
                      className="object-cover"
                      unoptimized
                    />
                    <button
                      onClick={() => handleRemovePicture("partner")}
                      className="absolute -top-1 -right-1 p-1 bg-destructive rounded-full text-white hover:bg-destructive/80 transition-colors"
                      aria-label="Supprimer la photo"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ) : (
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-secondary/50 border-2 border-border">
                    <User className="h-8 w-8 text-muted-foreground" />
                  </div>
                )}
                <label
                  htmlFor="partnerPicture"
                  className="absolute -bottom-1 -right-1 p-1.5 bg-secondary rounded-full text-secondary-foreground hover:bg-secondary/80 transition-colors cursor-pointer"
                  title="Changer la photo"
                >
                  <Upload className="h-3.5 w-3.5" />
                  <input
                    id="partnerPicture"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) handleUploadPicture(file, "partner")
                    }}
                    disabled={uploadingPicture === "partner"}
                  />
                </label>
              </div>
              <div className="flex-1 min-w-0">
                {isEditingPartnerName ? (
                  <div className="space-y-2">
                    <Label htmlFor="partnerName">Nom du partenaire</Label>
                    <div className="flex gap-2">
                      <Input
                        id="partnerName"
                        value={partnerName}
                        onChange={(e) => setPartnerName(e.target.value)}
                        placeholder="Nom du partenaire"
                        className="flex-1"
                      />
                      <Button
                        size="sm"
                        onClick={handleSavePartnerName}
                        disabled={savingPartnerName || !partnerName.trim()}
                      >
                        {savingPartnerName ? "..." : "OK"}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setIsEditingPartnerName(false)
                          setPartnerName(user?.user_metadata?.partner_name || "Personnel B")
                        }}
                      >
                        Annuler
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-base truncate tracking-tight">
                      {user.user_metadata?.partner_name || "Personnel B"}
                    </p>
                    <button
                      type="button"
                      onClick={() => setIsEditingPartnerName(true)}
                      className="p-1 hover:bg-muted rounded transition-colors"
                      aria-label="Modifier le nom du partenaire"
                    >
                      <Edit2 className="h-3.5 w-3.5 text-muted-foreground" />
                    </button>
                  </div>
                )}
              </div>
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
