"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Category, UserRole } from "@/types"
import { getLogoDevUrl } from "@/lib/logo-utils" // Changé pour Logo.dev
import { CreditCard } from "lucide-react"
import Image from "next/image"

interface ExpenseFormProps {
  categories: Category[]
  currentUser: UserRole
  userId: string
  onSubmit: (expense: {
    name: string
    amount: string
    categoryId: string
    paidBy: UserRole
    isShared: boolean
    logoUrl: string | null
    expenseDate: Date
    isRecurring: boolean
    description?: string | null
  }) => Promise<void>
  onCancel?: () => void
}

export function ExpenseForm({
  categories,
  currentUser,
  userId,
  onSubmit,
  onCancel,
}: ExpenseFormProps) {
  const [name, setName] = useState("")
  const [amount, setAmount] = useState("")
  // Sécurisation de la catégorie initiale
  const [categoryId, setCategoryId] = useState("")
  const [paidBy, setPaidBy] = useState<UserRole>(userId || "")
  const [isShared, setIsShared] = useState(false)
  const [logoUrl, setLogoUrl] = useState<string | null>(null)
  const [expenseDate, setExpenseDate] = useState<string>(() => {
    const today = new Date()
    return today.toISOString().split("T")[0]
  })
  const [isRecurring, setIsRecurring] = useState(false)
  const [description, setDescription] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Réinitialiser isSubmitting si le composant reste bloqué trop longtemps (sécurité)
  useEffect(() => {
    if (isSubmitting) {
      const timeout = setTimeout(() => {
        setIsSubmitting(false)
      }, 10000) // 10 secondes max
      return () => clearTimeout(timeout)
    }
  }, [isSubmitting])

  // Réinitialiser isSubmitting immédiatement quand la visibilité change (Alt+Tab)
  useEffect(() => {
    const handleReset = () => {
      setIsSubmitting(false)
    }

    // Écouter l'événement global de réinitialisation
    window.addEventListener('resetBlockedStates', handleReset)
    
    // Aussi écouter directement les événements de visibilité/focus
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        setIsSubmitting(false)
      }
    }

    const handleFocus = () => {
      setIsSubmitting(false)
    }

    const handleBlur = () => {
      setIsSubmitting(false)
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('focus', handleFocus)
    window.addEventListener('blur', handleBlur)
    
    return () => {
      window.removeEventListener('resetBlockedStates', handleReset)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('focus', handleFocus)
      window.removeEventListener('blur', handleBlur)
    }
  }, [])

  // Synchroniser le categoryId quand les catégories chargent depuis la BDD
  // Filtrer les catégories avec id='default' qui ne sont pas des UUID valides
  const validCategories = categories.filter(cat => cat.id !== 'default' && cat.id !== '')
  
  useEffect(() => {
    if (validCategories.length > 0 && !categoryId) {
      setCategoryId(validCategories[0].id)
    } else if (validCategories.length === 0 && categoryId) {
      setCategoryId("")
    }
  }, [categories, categoryId])


  // Débounce pour récupérer le logo via Logo.dev
  useEffect(() => {
    if (!name || name.length < 2) {
      setLogoUrl(null)
      return
    }

    const timer = setTimeout(() => {
      const url = getLogoDevUrl(name) // Utilisation de Logo.dev
      if (url) {
        setLogoUrl(url)
      }
    }, 500)

    return () => clearTimeout(timer)
  }, [name])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isSubmitting) return
    
    if (!name || !amount || !categoryId || categoryId === 'default') {
      if (!categoryId || categoryId === 'default') {
        alert("Veuillez sélectionner une catégorie valide")
      }
      return
    }

    setIsSubmitting(true)
    const finalLogoUrl = getLogoDevUrl(name.trim())

    try {
      await onSubmit({
        name: name.trim(),
        amount,
        categoryId,
        paidBy: paidBy || userId,
        isShared,
        logoUrl: finalLogoUrl,
        expenseDate: new Date(expenseDate),
        isRecurring,
        description: description.trim() || null,
      })

      // Reset form immédiatement après succès
      setName("")
      setAmount("")
      setIsShared(false)
      setLogoUrl(null)
      setIsRecurring(false)
      setPaidBy(userId || "")
      setExpenseDate(() => {
        const today = new Date()
        return today.toISOString().split("T")[0]
      })
      if (validCategories.length > 0) {
        setCategoryId(validCategories[0].id)
      } else {
        setCategoryId("")
      }
      setDescription("")
    } catch (error) {
      // L'erreur est gérée par le parent
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-3.5">
      <div className="space-y-1.5">
        <Label htmlFor="name" className="text-sm font-medium tracking-tight">Nom de la dépense</Label>
        <div className="flex items-center gap-2.5">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted overflow-hidden border-2 border-border/50">
            {logoUrl ? (
              <Image
                src={logoUrl}
                alt={name}
                width={32}
                height={32}
                className="h-full w-full object-contain"
                unoptimized // Nécessaire pour les URLs externes dynamiques comme Logo.dev
              />
            ) : (
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            )}
          </div>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex: Netflix, Carrefour..."
            required
            disabled={isSubmitting}
            className="h-10"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="amount" className="text-sm font-medium tracking-tight">Montant (€)</Label>
          <Input
            id="amount"
            type="number"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            required
            disabled={isSubmitting}
            className="h-10"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="category" className="text-sm font-medium tracking-tight">Catégorie</Label>
          <Select value={categoryId} onValueChange={setCategoryId} disabled={isSubmitting}>
            <SelectTrigger id="category" className="h-10">
              <SelectValue placeholder="Choisir une catégorie" />
            </SelectTrigger>
            <SelectContent>
              {validCategories.length === 0 ? (
                <SelectItem value="" disabled>
                  Aucune catégorie disponible
                </SelectItem>
              ) : (
                validCategories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.icon} {category.name}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="expenseDate" className="text-sm font-medium tracking-tight">Date de la dépense</Label>
          <Input
            id="expenseDate"
            type="date"
            value={expenseDate}
            onChange={(e) => setExpenseDate(e.target.value)}
            onClick={(e) => {
              const input = e.currentTarget
              if (input.showPicker) {
                try {
                  input.showPicker()
                } catch (err) {
                  // Fallback si showPicker n'est pas supporté
                  input.focus()
                }
              }
            }}
            className="cursor-pointer h-10"
            required
            disabled={isSubmitting}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="paidBy" className="text-sm font-medium tracking-tight">Payé par</Label>
          <Select value={paidBy} onValueChange={(value) => setPaidBy(value as UserRole)} disabled={isSubmitting || isShared}>
            <SelectTrigger id="paidBy" className="h-10" disabled={isShared}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={userId || "user"}>Moi</SelectItem>
              <SelectItem value="partner">Partenaire</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
        <div className="flex items-center gap-2.5">
          <input
            type="checkbox"
            id="isShared"
            checked={isShared}
            onChange={(e) => setIsShared(e.target.checked)}
            disabled={isSubmitting}
            className="h-4 w-4 rounded border-border/50 accent-primary transition-colors"
          />
          <Label htmlFor="isShared" className="text-sm font-normal tracking-tight cursor-pointer">Partager la dépense</Label>
        </div>

        <div className="flex items-center gap-2.5">
          <input
            type="checkbox"
            id="isRecurring"
            checked={isRecurring}
            onChange={(e) => setIsRecurring(e.target.checked)}
            disabled={isSubmitting}
            className="h-4 w-4 rounded border-border/50 accent-primary transition-colors"
          />
          <Label htmlFor="isRecurring" className="text-sm font-normal tracking-tight cursor-pointer">Répéter chaque mois (12 mois)</Label>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="description" className="text-sm font-medium tracking-tight">Objet / Description (optionnel)</Label>
        <Input
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Ex: Paiement en plusieurs fois, remboursement..."
          disabled={isSubmitting}
          className="h-10"
        />
      </div>

      <div className="flex gap-3 pt-1">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting} className="flex-1 h-10">
            Annuler
          </Button>
        )}
        <Button type="submit" className="flex-1 h-10" disabled={isSubmitting}>
          {isSubmitting ? "Ajout..." : "Ajouter"}
        </Button>
      </div>
    </form>
  )
}