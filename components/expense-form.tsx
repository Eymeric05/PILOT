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
import { getClearbitLogoUrl } from "@/lib/logo-utils"
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
  }) => void
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
  const [categoryId, setCategoryId] = useState(categories[0]?.id || "")
  const [paidBy, setPaidBy] = useState<UserRole>(userId)
  const [isShared, setIsShared] = useState(true)
  const [logoUrl, setLogoUrl] = useState<string | null>(null)
  const [isLoadingLogo, setIsLoadingLogo] = useState(false)
  const [expenseDate, setExpenseDate] = useState<string>(() => {
    const today = new Date()
    return today.toISOString().split("T")[0]
  })
  const [isRecurring, setIsRecurring] = useState(false)

  // Débounce pour récupérer le logo
  useEffect(() => {
    if (!name || name.length < 2) {
      setLogoUrl(null)
      return
    }

    const timer = setTimeout(() => {
      setIsLoadingLogo(true)
      const url = getClearbitLogoUrl(name, true) // En niveaux de gris par défaut
      if (url) {
        // On teste si le logo existe en essayant de le charger
        // Si ça échoue, on garde null, sinon on garde l'URL
        // Utiliser window.Image pour éviter le conflit avec next/image
        const testImg = new window.Image()
        testImg.onload = () => {
          setLogoUrl(url)
          setIsLoadingLogo(false)
        }
        testImg.onerror = () => {
          setLogoUrl(null)
          setIsLoadingLogo(false)
        }
        testImg.src = url
      } else {
        setLogoUrl(null)
        setIsLoadingLogo(false)
      }
    }, 500)

    return () => clearTimeout(timer)
  }, [name])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name || !amount || !categoryId) return

    // Générer l'URL du logo si elle n'existe pas déjà
    const finalLogoUrl = logoUrl || getClearbitLogoUrl(name.trim(), true)

    onSubmit({
      name: name.trim(),
      amount,
      categoryId,
      paidBy,
      isShared,
      logoUrl: finalLogoUrl,
      expenseDate: new Date(expenseDate),
      isRecurring,
    })

    // Reset form
    setName("")
    setAmount("")
    setCategoryId(categories[0]?.id || "")
    setPaidBy(userId)
    setIsShared(true)
    setLogoUrl(null)
    setExpenseDate(() => {
      const today = new Date()
      return today.toISOString().split("T")[0]
    })
    setIsRecurring(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Nom avec logo preview */}
      <div className="space-y-2">
        <Label htmlFor="name">Nom de la dépense</Label>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded bg-muted">
            {logoUrl ? (
              <Image
                src={logoUrl}
                alt={name || "Logo"}
                width={32}
                height={32}
                className="h-8 w-8 rounded object-contain"
                onError={() => setLogoUrl(null)}
              />
            ) : (
              <CreditCard className="h-5 w-5 text-muted-foreground" />
            )}
          </div>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex: EDF, Carrefour..."
            required
          />
        </div>
      </div>

      {/* Montant */}
      <div className="space-y-2">
        <Label htmlFor="amount">Montant (€)</Label>
        <Input
          id="amount"
          type="number"
          step="0.01"
          min="0"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="0.00"
          required
        />
      </div>

      {/* Catégorie */}
      <div className="space-y-2">
        <Label htmlFor="category">Catégorie</Label>
        <Select value={categoryId} onValueChange={setCategoryId}>
          <SelectTrigger id="category">
            <SelectValue />
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

      {/* Date */}
      <div className="space-y-2">
        <Label htmlFor="expenseDate">Date de la dépense</Label>
        <Input
          id="expenseDate"
          type="date"
          value={expenseDate}
          onChange={(e) => setExpenseDate(e.target.value)}
          required
        />
      </div>

      {/* Payé par */}
      <div className="space-y-2">
        <Label htmlFor="paidBy">Payé par</Label>
        <Select value={paidBy} onValueChange={(value) => setPaidBy(value as UserRole)}>
          <SelectTrigger id="paidBy">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={userId}>Moi</SelectItem>
            <SelectItem value="partner">Partenaire</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Partage */}
      <div className="flex items-center gap-3 py-2">
        <input
          type="checkbox"
          id="isShared"
          checked={isShared}
          onChange={(e) => setIsShared(e.target.checked)}
          className="h-5 w-5 rounded border-input text-primary focus:ring-2 focus:ring-ring"
        />
        <Label htmlFor="isShared" className="cursor-pointer font-normal">
          Partager la dépense (divisé par 2)
        </Label>
      </div>

      {/* Récurrence */}
      <div className="flex items-center gap-3 py-2">
        <input
          type="checkbox"
          id="isRecurring"
          checked={isRecurring}
          onChange={(e) => setIsRecurring(e.target.checked)}
          className="h-5 w-5 rounded border-input text-primary focus:ring-2 focus:ring-ring"
        />
        <Label htmlFor="isRecurring" className="cursor-pointer font-normal">
          Dépense récurrente (chaque mois pendant 12 mois)
        </Label>
      </div>

      {/* Boutons */}
      <div className="flex gap-3 pt-4">
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            className="flex-1"
          >
            Annuler
          </Button>
        )}
        <Button type="submit" className="flex-1">
          Ajouter
        </Button>
      </div>
    </form>
  )
}
