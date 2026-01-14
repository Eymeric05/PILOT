"use client"

import { Expense, Category } from "@/types"
import { formatAmount, getDisplayAmount } from "@/lib/expense-utils"
import { CreditCard, Users, X } from "lucide-react"
import { useState } from "react"

interface ExpenseListProps {
  expenses: Expense[]
  categories: Category[]
  currentUser: "user1" | "user2"
  onDelete?: (expenseId: string) => void
}

function LogoDisplay({ logoUrl, name }: { logoUrl: string | null | undefined; name: string }) {
  const [hasError, setHasError] = useState(false)
  const [isHovered, setIsHovered] = useState(false)

  if (!logoUrl || hasError) {
    return (
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded bg-muted">
        <CreditCard className="h-5 w-5 text-muted-foreground" />
      </div>
    )
  }

  // Convertir l'URL en niveaux de gris si elle ne l'est pas déjà
  let greyscaleUrl = logoUrl
  let colorUrl = logoUrl
  
  if (logoUrl.includes("greyscale=true")) {
    // Si déjà en niveaux de gris, extraire l'URL couleur
    colorUrl = logoUrl.replace(/[?&]greyscale=true/, "").replace(/[?&]$/, "")
  } else {
    // Ajouter le paramètre greyscale
    greyscaleUrl = logoUrl.includes("?") 
      ? `${logoUrl}&greyscale=true`
      : `${logoUrl}?greyscale=true`
  }

  return (
      <div 
      className="flex h-10 w-10 shrink-0 items-center justify-center rounded bg-muted"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <img
        src={isHovered ? colorUrl : greyscaleUrl}
        alt={name}
        className="h-8 w-8 rounded object-contain transition-opacity duration-300 ease-out"
        onError={() => setHasError(true)}
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
    <div className="space-y-2">
      {expenses.length === 0 ? (
        <div className="py-12 text-center text-muted-foreground">
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
              className="flex items-center gap-3 border border-border rounded bg-card p-3 animate-in fade-in slide-in-from-bottom-2 duration-200"
            >
              {/* Logo ou icône générique */}
              <LogoDisplay logoUrl={expense.logoUrl} name={expense.name} />

              {/* Informations de la dépense */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium truncate text-sm">{expense.name}</p>
                  {expense.isShared && (
                    <Users className="h-4 w-4 text-muted-foreground shrink-0" />
                  )}
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-sm text-muted-foreground">
                    {categoryIcon} {categoryName}
                  </span>
                  <span className="text-xs text-muted-foreground">•</span>
                  <span className="text-sm text-muted-foreground">
                    {expense.paidBy === currentUser ? "Vous" : "Partenaire"}
                  </span>
                </div>
              </div>

              {/* Montant */}
              <div className="text-right shrink-0">
                <p className="font-medium">{formatAmount(displayAmount)}</p>
                {expense.isShared && (
                  <p className="text-xs text-muted-foreground">
                    sur {formatAmount(expense.amount)}
                  </p>
                )}
              </div>

              {/* Bouton de suppression */}
              {onDelete && (
                <button
                  type="button"
                  onClick={() => onDelete(expense.id)}
                  className="ml-2 p-1 rounded hover:bg-muted transition-all duration-200 ease-out opacity-60 hover:opacity-100 active:scale-95"
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
