"use client"

import { Expense, Category } from "@/types"
import { formatAmount, getDisplayAmount } from "@/lib/expense-utils"
import { getClearbitLogoUrl, getGoogleFaviconUrl } from "@/lib/logo-utils"
import { Users, X } from "lucide-react"
import { useState } from "react"

interface ExpenseListProps {
  expenses: Expense[]
  categories: Category[]
  currentUser: "user1" | "user2"
  onDelete?: (expenseId: string) => void
}

function LogoDisplay({ logoUrl, name }: { logoUrl: string | null | undefined; name: string }) {
  const [useFallback, setUseFallback] = useState(false)
  const [useInitial, setUseInitial] = useState(false)
  const [isHovered, setIsHovered] = useState(false)

  // Générer la première lettre pour le fallback
  const getInitial = (text: string): string => {
    if (!text || text.length === 0) return "?"
    return text.trim().charAt(0).toUpperCase()
  }

  // Générer une couleur basée sur le nom (pour la cohérence)
  const getColorFromName = (text: string): string => {
    const colors = [
      "bg-blue-500",
      "bg-purple-500",
      "bg-pink-500",
      "bg-red-500",
      "bg-orange-500",
      "bg-yellow-500",
      "bg-green-500",
      "bg-teal-500",
      "bg-cyan-500",
      "bg-indigo-500",
    ]
    if (!text) return colors[0]
    const index = text.charCodeAt(0) % colors.length
    return colors[index]
  }

  // Si on utilise l'initiale (dernier recours)
  if (useInitial) {
    return (
      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${getColorFromName(name)}`}>
        <span className="text-sm font-semibold text-white">{getInitial(name)}</span>
      </div>
    )
  }

  // Déterminer l'URL à utiliser
  let imageUrl: string
  if (useFallback) {
    // Utiliser Google Favicon en secours
    imageUrl = getGoogleFaviconUrl(name)
  } else if (logoUrl) {
    // Utiliser l'URL Clearbit stockée
    imageUrl = logoUrl
  } else {
    // Générer l'URL Clearbit à partir du nom
    imageUrl = getClearbitLogoUrl(name, true)
  }

  // Convertir l'URL en niveaux de gris si c'est Clearbit
  let greyscaleUrl = imageUrl
  let colorUrl = imageUrl
  
  if (imageUrl.includes("clearbit.com") && imageUrl.includes("greyscale=true")) {
    colorUrl = imageUrl.replace(/[?&]greyscale=true/, "").replace(/[?&]$/, "")
  } else if (imageUrl.includes("clearbit.com") && !imageUrl.includes("greyscale=true")) {
    greyscaleUrl = imageUrl.includes("?") 
      ? `${imageUrl}&greyscale=true`
      : `${imageUrl}?greyscale=true`
  }

  return (
    <div 
      className="flex h-10 w-10 shrink-0 items-center justify-center rounded bg-muted"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <img
        src={isHovered && imageUrl.includes("clearbit.com") ? colorUrl : greyscaleUrl}
        alt={name}
        className="h-8 w-8 rounded object-contain transition-opacity duration-300 ease-out"
        onError={() => {
          if (!useFallback) {
            // Essayer Google Favicon en secours
            setUseFallback(true)
          } else {
            // Afficher la première lettre si même Google Favicon échoue
            setUseInitial(true)
          }
        }}
      />
    </div>
  )
}

export function ExpenseList({ expenses, categories, currentUser, onDelete }: ExpenseListProps) {
  const getCategoryName = (categoryId: string | null | undefined): string => {
    if (!categoryId) return "Autres"
    const category = categories.find((c) => c.id === categoryId)
    return category?.name || "Autres"
  }

  const getCategoryIcon = (categoryId: string | null | undefined): string => {
    if (!categoryId) return "📦"
    const category = categories.find((c) => c.id === categoryId)
    return category?.icon || "📦"
  }

  return (
    <div className="space-y-3">
      {expenses.length === 0 ? (
        <div className="py-12 text-center text-muted-foreground tracking-tight">
          <p>Aucune dépense pour ce mois</p>
        </div>
      ) : (
        expenses.map((expense) => {
          const displayAmount = getDisplayAmount(expense, currentUser)
          const categoryName = getCategoryName(expense.categoryId)
          const categoryIcon = getCategoryIcon(expense.categoryId)

          return (
            <div
              key={expense.id}
              className="flex items-center gap-3 rounded-3xl bg-white shadow-sm p-4 animate-in fade-in slide-in-from-bottom-2 duration-200"
            >
              {/* Logo ou icône générique */}
              <LogoDisplay logoUrl={expense.logoUrl} name={expense.name} />

              {/* Informations de la dépense */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium truncate text-sm tracking-tight">{expense.name}</p>
                  {expense.isShared && (
                    <Users className="h-4 w-4 text-muted-foreground shrink-0" />
                  )}
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-sm text-muted-foreground tracking-tight">
                    {categoryIcon} {categoryName}
                  </span>
                  <span className="text-xs text-muted-foreground">•</span>
                  <span className="text-sm text-muted-foreground tracking-tight">
                    {expense.paidBy === currentUser ? "Vous" : "Partenaire"}
                  </span>
                </div>
              </div>

              {/* Montant */}
              <div className="text-right shrink-0">
                <p className="font-medium tracking-tight">{formatAmount(displayAmount)}</p>
                {expense.isShared && (
                  <p className="text-xs text-muted-foreground tracking-tight">
                    sur {formatAmount(expense.amount)}
                  </p>
                )}
              </div>

              {/* Bouton de suppression */}
              {onDelete && (
                <button
                  type="button"
                  onClick={() => onDelete(expense.id)}
                  className="ml-2 p-1.5 rounded-full hover:bg-muted transition-all duration-200 ease-out opacity-60 hover:opacity-100 active:scale-95"
                  aria-label="Supprimer la dépense"
                >
                  <X className="h-4 w-4 text-muted-foreground" />
                </button>
              )}
            </div>
          )
        })
      )}
    </div>
  )
}
