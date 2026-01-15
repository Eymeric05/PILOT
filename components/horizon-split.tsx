"use client"

import { Expense, UserRole } from "@/types"
import { formatAmount } from "@/lib/expense-utils"
import { cn } from "@/lib/utils"

export type FilterZone = "user1" | "shared" | "user2" | null

interface HorizonSplitProps {
  expenses: Expense[]
  currentUser: UserRole
  activeFilter: FilterZone
  onFilterChange: (filter: FilterZone) => void
}

function calculateZoneTotal(expenses: Expense[], zone: "user1" | "shared" | "user2", currentUser: UserRole): number {
  return expenses.reduce((total, expense) => {
    if (zone === "shared") {
      // Zone Commun : seulement les dépenses partagées
      if (expense.isShared) {
        return total + parseFloat(expense.amount) / 2
      }
      return total
    } else if (zone === "user1") {
      // Zone Personnel A : dépenses payées par l'utilisateur actuel (non partagées) + moitié des dépenses partagées payées par l'utilisateur
      if (expense.paidBy === currentUser) {
        if (expense.isShared) {
          return total + parseFloat(expense.amount) / 2
        } else {
          return total + parseFloat(expense.amount)
        }
      }
      return total
    } else if (zone === "user2") {
      // Zone Personnel B : dépenses payées par le partenaire (non partagées) + moitié des dépenses partagées payées par le partenaire
      if (expense.paidBy === "partner") {
        if (expense.isShared) {
          return total + parseFloat(expense.amount) / 2
        } else {
          return total + parseFloat(expense.amount)
        }
      }
      return total
    }
    return total
  }, 0)
}

export function HorizonSplit({ expenses, currentUser, activeFilter, onFilterChange }: HorizonSplitProps) {
  const user1Total = calculateZoneTotal(expenses, "user1", currentUser)
  const sharedTotal = calculateZoneTotal(expenses, "shared", currentUser)
  const user2Total = calculateZoneTotal(expenses, "user2", currentUser)

  return (
    <div className="grid grid-cols-3 gap-3 mb-6">
      <button
        type="button"
        onClick={() => onFilterChange(activeFilter === "user1" ? null : "user1")}
        className={cn(
          "flex flex-col items-center justify-center p-4 rounded-3xl bg-card shadow-sm transition-all duration-200 ease-out",
          "hover:shadow-md focus:outline-none focus:ring-2 focus:ring-primary/20 active:scale-[0.98]",
          activeFilter === "user1" && "ring-2 ring-accent shadow-md"
        )}
      >
        <span className="text-xs text-muted-foreground mb-1 font-medium tracking-tight">Personnel A</span>
        <span className="text-lg font-medium tracking-tight">{formatAmount(user1Total)}</span>
      </button>

      <button
        type="button"
        onClick={() => onFilterChange(activeFilter === "shared" ? null : "shared")}
        className={cn(
          "flex flex-col items-center justify-center p-4 rounded-3xl bg-card shadow-sm transition-all duration-200 ease-out",
          "hover:shadow-md focus:outline-none focus:ring-2 focus:ring-primary/20 active:scale-[0.98]",
          activeFilter === "shared" && "ring-2 ring-accent shadow-md"
        )}
      >
        <span className="text-xs text-muted-foreground mb-1 font-medium tracking-tight">Commun</span>
        <span className="text-lg font-medium tracking-tight">{formatAmount(sharedTotal)}</span>
      </button>

      <button
        type="button"
        onClick={() => onFilterChange(activeFilter === "user2" ? null : "user2")}
        className={cn(
          "flex flex-col items-center justify-center p-4 rounded-3xl bg-card shadow-sm transition-all duration-200 ease-out",
          "hover:shadow-md focus:outline-none focus:ring-2 focus:ring-primary/20 active:scale-[0.98]",
          activeFilter === "user2" && "ring-2 ring-accent shadow-md"
        )}
      >
        <span className="text-xs text-muted-foreground mb-1 font-medium tracking-tight">Personnel B</span>
        <span className="text-lg font-medium tracking-tight">{formatAmount(user2Total)}</span>
      </button>
    </div>
  )
}
