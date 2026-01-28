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
    // Un seul appel getSession au démarrage, puis on écoute les événements personnalisés
    const initUser = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (session?.user) {
          setUser(session.user)
          setDisplayName(session.user.user_metadata?.display_name || session.user.email?.split("@")[0] || "")
          setPartnerName(session.user.user_metadata?.partner_name || "Personnel B")
          setProfilePicture(session.user.user_metadata?.profile_picture_url || null)
          setPartnerProfilePicture(session.user.user_metadata?.partner_profile_picture_url || null)
        }
      } catch (error) {
        setUser(null)
      } finally {
        setLoading(false)
      }
    }

    initUser()

    // Utiliser l'événement personnalisé plutôt qu'un listener onAuthStateChange séparé (évite les doublons)
    const handleUserMetadataUpdate = async () => {
      // Récupérer la session mise à jour après les modifications
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        setUser(session.user)
        setDisplayName(session.user.user_metadata?.display_name || session.user.email?.split("@")[0] || "")
        setPartnerName(session.user.user_metadata?.partner_name || "Personnel B")
        setProfilePicture(session.user.user_metadata?.profile_picture_url || null)
        setPartnerProfilePicture(session.user.user_metadata?.partner_profile_picture_url || null)
      }
    }

    window.addEventListener('userMetadataUpdated', handleUserMetadataUpdate)
    return () => {
      window.removeEventListener('userMetadataUpdated', handleUserMetadataUpdate)
    }
  }, [])

  const handleSignOut = async () => {
    try {
      setDrawerOpen(false)
      
      // Signaler la déconnexion avant de fermer le drawer
      const { error } = await supabase.auth.signOut()
      
      if (error) {
        console.error("Error signing out:", error)
        // Même en cas d'erreur, forcer la déconnexion locale et la redirection
      }
      
      // Nettoyer le stockage local
      if (typeof window !== 'undefined') {
        localStorage.clear()
        sessionStorage.clear()
      }
      
      // Forcer la redirection après déconnexion
      window.location.href = "/login"
    } catch (error) {
      console.error("Error signing out:", error)
      // Forcer la redirection même en cas d'erreur
      if (typeof window !== 'undefined') {
        localStorage.clear()
        sessionStorage.clear()
        window.location.href = "/login"
      }
    }
  }

  const handleSaveDisplayName = async () => {
    if (!user || !displayName.trim()) return

    setSavingName(true)
    try {
      // Récupérer le token de session
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) {
        throw new Error("Session expirée")
      }

      // Utiliser la route API au lieu d'appeler Supabase directement
      const res = await fetch("/api/user/update-metadata", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          accessToken: session.access_token,
          metadata: {
            display_name: displayName.trim(),
            partner_name: partnerName.trim(),
            profile_picture_url: profilePicture,
            partner_profile_picture_url: partnerProfilePicture,
          },
        }),
      })

      if (!res.ok) {
        const error = await res.json().catch(() => ({ error: "Erreur inconnue" }))
        throw new Error(error.error || "Erreur lors de la mise à jour")
      }

      // Rafraîchir la session pour obtenir les nouvelles métadonnées
      const { data: { session: newSession } } = await supabase.auth.getSession()
      if (newSession?.user) {
        setUser(newSession.user)
        setDisplayName(newSession.user.user_metadata?.display_name || newSession.user.email?.split("@")[0] || "")
      }

      setIsEditingName(false)
      
      // Déclencher un événement pour mettre à jour l'utilisateur dans page.tsx
      window.dispatchEvent(new CustomEvent('userMetadataUpdated'))
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
      // Récupérer le token de session
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) {
        throw new Error("Session expirée")
      }

      // Utiliser la route API au lieu d'appeler Supabase directement
      const res = await fetch("/api/user/update-metadata", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          accessToken: session.access_token,
          metadata: {
            display_name: displayName.trim(),
            partner_name: partnerName.trim(),
            profile_picture_url: profilePicture,
            partner_profile_picture_url: partnerProfilePicture,
          },
        }),
      })

      if (!res.ok) {
        const error = await res.json().catch(() => ({ error: "Erreur inconnue" }))
        throw new Error(error.error || "Erreur lors de la mise à jour")
      }

      // Rafraîchir la session pour obtenir les nouvelles métadonnées
      const { data: { session: newSession } } = await supabase.auth.getSession()
      if (newSession?.user) {
        setUser(newSession.user)
        setPartnerName(newSession.user.user_metadata?.partner_name || "Personnel B")
      }

      setIsEditingPartnerName(false)
      
      // Déclencher un événement pour mettre à jour l'utilisateur dans page.tsx
      window.dispatchEvent(new CustomEvent('userMetadataUpdated'))
    } catch (error: any) {
      console.error("Error updating partner name:", error)
      alert(`Erreur lors de la mise à jour: ${error.message}`)
    } finally {
      setSavingPartnerName(false)
    }
  }

  const handleUploadPicture = async (file: File, type: "user" | "partner"): Promise<void> => {
    if (!user) {
      return Promise.reject(new Error("Utilisateur non connecté"))
    }

    // Valider le type de fichier
    if (!file.type.startsWith('image/')) {
      alert("Veuillez sélectionner une image")
      return Promise.reject(new Error("Type de fichier invalide"))
    }

    // Valider la taille (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert("L'image est trop grande. Taille maximale : 5MB")
      return Promise.reject(new Error("Fichier trop volumineux"))
    }

    setUploadingPicture(type)
    
    return new Promise((resolve, reject) => {
      try {
        const reader = new FileReader()
        const previousPicture = type === "user" ? profilePicture : partnerProfilePicture
        
        reader.onerror = () => {
          setUploadingPicture(null)
          alert("Erreur lors de la lecture du fichier")
          reject(new Error("Erreur de lecture"))
        }

        reader.onloadend = async () => {
          try {
            const base64String = reader.result as string
            
            if (!base64String) {
              throw new Error("Impossible de convertir l'image")
            }
            
            // Optimistic UI : mettre à jour immédiatement
            if (type === "user") {
              setProfilePicture(base64String)
            } else {
              setPartnerProfilePicture(base64String)
            }

            setUser({
              ...user,
              user_metadata: {
                ...user.user_metadata,
                [type === "user" ? "profile_picture_url" : "partner_profile_picture_url"]: base64String,
              },
            })
            
            // Récupérer le token de session
            const { data: { session } } = await supabase.auth.getSession()
            if (!session?.access_token) {
              throw new Error("Session expirée")
            }

            const metadataKey = type === "user" ? "profile_picture_url" : "partner_profile_picture_url"
            const res = await fetch("/api/user/update-metadata", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                accessToken: session.access_token,
                metadata: {
                  [metadataKey]: base64String,
                  display_name: displayName.trim(),
                  partner_name: partnerName.trim(),
                  profile_picture_url: type === "user" ? base64String : profilePicture,
                  partner_profile_picture_url: type === "partner" ? base64String : partnerProfilePicture,
                },
              }),
            })

            if (!res.ok) {
              const error = await res.json().catch(() => ({ error: "Erreur inconnue" }))
              throw new Error(error.error || "Erreur lors de la mise à jour")
            }

            window.dispatchEvent(new CustomEvent('userMetadataUpdated'))
            resolve()
          } catch (error: any) {
            // En cas d'erreur, restaurer l'état précédent
            if (type === "user") {
              setProfilePicture(previousPicture)
            } else {
              setPartnerProfilePicture(previousPicture)
            }
            setUser(user)
            alert(`Erreur lors du téléchargement: ${error.message || "Une erreur est survenue"}`)
            reject(error)
          } finally {
            setUploadingPicture(null)
          }
        }
        
        reader.readAsDataURL(file)
      } catch (error: any) {
        setUploadingPicture(null)
        alert(`Erreur: ${error.message || "Une erreur est survenue"}`)
        reject(error)
      }
    })
  }

  const handleRemovePicture = async (type: "user" | "partner") => {
    if (!user) return

    const metadataKey = type === "user" ? "profile_picture_url" : "partner_profile_picture_url"
    
    // Optimistic UI : retirer la photo immédiatement
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

    try {
      // Récupérer le token de session
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) {
        throw new Error("Session expirée")
      }

      const res = await fetch("/api/user/update-metadata", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          accessToken: session.access_token,
          metadata: {
            [metadataKey]: null,
            display_name: displayName.trim(),
            partner_name: partnerName.trim(),
            profile_picture_url: type === "user" ? null : profilePicture,
            partner_profile_picture_url: type === "partner" ? null : partnerProfilePicture,
          },
        }),
      })

      if (!res.ok) {
        const error = await res.json().catch(() => ({ error: "Erreur inconnue" }))
        throw new Error(error.error || "Erreur lors de la mise à jour")
      }

      // Déclencher un événement pour mettre à jour l'utilisateur dans page.tsx
      window.dispatchEvent(new CustomEvent('userMetadataUpdated'))
    } catch (error: any) {
      // En cas d'erreur, restaurer la photo
      if (type === "user") {
        setProfilePicture(user.user_metadata?.profile_picture_url || null)
      } else {
        setPartnerProfilePicture(user.user_metadata?.partner_profile_picture_url || null)
      }
      setUser(user)
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
              <Label className="text-sm font-semibold">Mon profil ({user.user_metadata?.display_name || user.email?.split("@")[0] || "Utilisateur"})</Label>
            </div>
            <div className="flex items-center gap-4 p-4 rounded-2xl bg-card border-2 border-border">
              <div className="relative flex items-center gap-2">
                {profilePicture ? (
                  <div className="relative h-16 w-16 rounded-xl overflow-hidden border-2 border-border">
                    {profilePicture.startsWith('data:image') || profilePicture.startsWith('data:image/') ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={profilePicture}
                        alt="Photo de profil"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Image
                        src={profilePicture}
                        alt="Photo de profil"
                        width={64}
                        height={64}
                        className="w-full h-full object-cover"
                        unoptimized
                      />
                    )}
                  </div>
                ) : (
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-primary/10 border-2 border-border">
                    <User className="h-8 w-8 text-primary" />
                  </div>
                )}
                <div className="flex flex-col gap-1">
                  <label
                    htmlFor="userPicture"
                    className="p-1.5 bg-primary rounded-full text-primary-foreground hover:bg-primary/80 transition-colors cursor-pointer"
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
                        const input = e.target
                        if (file) {
                          handleUploadPicture(file, "user").finally(() => {
                            // Réinitialiser l'input après traitement
                            input.value = ''
                          })
                        } else {
                          input.value = ''
                        }
                      }}
                      disabled={uploadingPicture === "user"}
                    />
                  </label>
                  {profilePicture && (
                    <button
                      onClick={() => handleRemovePicture("user")}
                      disabled={uploadingPicture === "user"}
                      className="p-1.5 bg-destructive rounded-full text-white hover:bg-destructive/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      aria-label="Supprimer la photo"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
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
              <div className="relative flex items-center gap-2">
                {partnerProfilePicture ? (
                  <div className="relative h-16 w-16 rounded-xl overflow-hidden border-2 border-border">
                    {partnerProfilePicture.startsWith('data:image') || partnerProfilePicture.startsWith('data:image/') ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={partnerProfilePicture}
                        alt="Photo du partenaire"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Image
                        src={partnerProfilePicture}
                        alt="Photo du partenaire"
                        width={64}
                        height={64}
                        className="w-full h-full object-cover"
                        unoptimized
                      />
                    )}
                  </div>
                ) : (
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-secondary/50 border-2 border-border">
                    <User className="h-8 w-8 text-muted-foreground" />
                  </div>
                )}
                <div className="flex flex-col gap-1">
                  <label
                    htmlFor="partnerPicture"
                    className="p-1.5 bg-secondary rounded-full text-secondary-foreground hover:bg-secondary/80 transition-colors cursor-pointer"
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
                      const input = e.target
                      if (file) {
                        handleUploadPicture(file, "partner").finally(() => {
                          // Réinitialiser l'input après traitement
                          input.value = ''
                        })
                      } else {
                        input.value = ''
                      }
                    }}
                    disabled={uploadingPicture === "partner"}
                    />
                  </label>
                  {partnerProfilePicture && (
                    <button
                      onClick={() => handleRemovePicture("partner")}
                      disabled={uploadingPicture === "partner"}
                      className="p-1.5 bg-destructive rounded-full text-white hover:bg-destructive/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      aria-label="Supprimer la photo"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
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
