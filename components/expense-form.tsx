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
  const [isShared, setIsShared] = useState(true)
  const [logoUrl, setLogoUrl] = useState<string | null>(null)
  const [expenseDate, setExpenseDate] = useState<string>(() => {
    const today = new Date()
    return today.toISOString().split("T")[0]
  })
  const [isRecurring, setIsRecurring] = useState(false)
  const [description, setDescription] = useState("")

  // Synchroniser le categoryId quand les catégories chargent depuis la BDD
  useEffect(() => {
    if (categories.length > 0 && !categoryId) {
      setCategoryId(categories[0].id)
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
    if (!name || !amount || !categoryId) return

    // Utilisation finale de l'URL Logo.dev pour la BDD
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

      // Reset form seulement après succès
      setName("")
      setAmount("")
      setIsShared(true)
      setLogoUrl(null)
      setIsRecurring(false)
      setExpenseDate(() => {
        const today = new Date()
        return today.toISOString().split("T")[0]
      })
      if (categories.length > 0) {
        setCategoryId(categories[0].id)
      }
      setDescription("")
    } catch (error) {
      console.error("Error submitting form:", error)
      // Ne pas reset le formulaire en cas d'erreur
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
      <div className="space-y-2">
        <Label htmlFor="name" className="text-sm font-medium tracking-tight">Nom de la dépense</Label>
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-muted overflow-hidden border-2 border-border/50">
            {logoUrl ? (
              <Image
                src={logoUrl}
                alt={name}
                width={40}
                height={40}
                className="h-full w-full object-contain"
                unoptimized // Nécessaire pour les URLs externes dynamiques comme Logo.dev
              />
            ) : (
              <CreditCard className="h-5 w-5 text-muted-foreground" />
            )}
          </div>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex: Netflix, Carrefour..."
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="amount" className="text-sm font-medium tracking-tight">Montant (€)</Label>
        <Input
          id="amount"
          type="number"
          step="0.01"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="0.00"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="category" className="text-sm font-medium tracking-tight">Catégorie</Label>
        <Select value={categoryId} onValueChange={setCategoryId}>
          <SelectTrigger id="category">
            <SelectValue placeholder="Choisir une catégorie" />
          </SelectTrigger>
          <SelectContent>
            {categories.map((category) => (
              <SelectItem key={category.id} value={category.id}>
                {category.icon} {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
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
          className="cursor-pointer"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="paidBy" className="text-sm font-medium tracking-tight">Payé par</Label>
        <Select value={paidBy} onValueChange={(value) => setPaidBy(value as UserRole)}>
          <SelectTrigger id="paidBy">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={userId || "user"}>Moi</SelectItem>
            <SelectItem value="partner">Partenaire</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center gap-3 py-1">
        <input
          type="checkbox"
          id="isShared"
          checked={isShared}
          onChange={(e) => setIsShared(e.target.checked)}
          className="h-4 w-4 rounded border-border/50 accent-primary transition-colors"
        />
        <Label htmlFor="isShared" className="text-sm font-normal tracking-tight cursor-pointer">Partager la dépense</Label>
      </div>

      <div className="flex items-center gap-3 py-1">
        <input
          type="checkbox"
          id="isRecurring"
          checked={isRecurring}
          onChange={(e) => setIsRecurring(e.target.checked)}
          className="h-4 w-4 rounded border-border/50 accent-primary transition-colors"
        />
        <Label htmlFor="isRecurring" className="text-sm font-normal tracking-tight cursor-pointer">Répéter chaque mois (12 mois)</Label>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description" className="text-sm font-medium tracking-tight">Objet / Description (optionnel)</Label>
        <Input
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Ex: Paiement en plusieurs fois, remboursement..."
        />
      </div>

      <div className="flex gap-3 pt-2">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
            Annuler
          </Button>
        )}
        <Button type="submit" className="flex-1">Ajouter</Button>
      </div>
    </form>
  )
}