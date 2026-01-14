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
      // Zone Personnel A : dépenses payées par user1 (non partagées) + moitié des dépenses partagées payées par user1
      if (expense.paidBy === "user1") {
        if (expense.isShared) {
          return total + parseFloat(expense.amount) / 2
        } else {
          return total + parseFloat(expense.amount)
        }
      }
      return total
    } else if (zone === "user2") {
      // Zone Personnel B : dépenses payées par user2 (non partagées) + moitié des dépenses partagées payées par user2
      if (expense.paidBy === "user2") {
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
    <div className="grid grid-cols-3 gap-px border border-border rounded overflow-hidden mb-6">
      <button
        type="button"
        onClick={() => onFilterChange(activeFilter === "user1" ? null : "user1")}
        className={cn(
          "flex flex-col items-center justify-center p-4 bg-card border-r border-border transition-opacity duration-200",
          "hover:opacity-80 focus:outline-none focus:ring-1 focus:ring-foreground focus:ring-offset-0",
          activeFilter === "user1" && "opacity-100 bg-accent",
          activeFilter !== "user1" && "opacity-90"
        )}
      >
        <span className="text-xs text-muted-foreground mb-1 font-medium">Personnel A</span>
        <span className="text-lg font-medium">{formatAmount(user1Total)}</span>
      </button>

      <button
        type="button"
        onClick={() => onFilterChange(activeFilter === "shared" ? null : "shared")}
        className={cn(
          "flex flex-col items-center justify-center p-4 bg-card border-r border-border transition-opacity duration-200",
          "hover:opacity-80 focus:outline-none focus:ring-1 focus:ring-foreground focus:ring-offset-0",
          activeFilter === "shared" && "opacity-100 bg-accent",
          activeFilter !== "shared" && "opacity-90"
        )}
      >
        <span className="text-xs text-muted-foreground mb-1 font-medium">Commun</span>
        <span className="text-lg font-medium">{formatAmount(sharedTotal)}</span>
      </button>

      <button
        type="button"
        onClick={() => onFilterChange(activeFilter === "user2" ? null : "user2")}
        className={cn(
          "flex flex-col items-center justify-center p-4 bg-card transition-opacity duration-200",
          "hover:opacity-80 focus:outline-none focus:ring-1 focus:ring-foreground focus:ring-offset-0",
          activeFilter === "user2" && "opacity-100 bg-accent",
          activeFilter !== "user2" && "opacity-90"
        )}
      >
        <span className="text-xs text-muted-foreground mb-1 font-medium">Personnel B</span>
        <span className="text-lg font-medium">{formatAmount(user2Total)}</span>
      </button>
    </div>
  )
}
