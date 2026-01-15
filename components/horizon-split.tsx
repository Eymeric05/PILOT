"use client"

import { Expense, UserRole } from "@/types"
import { formatAmount } from "@/lib/expense-utils"
import { cn } from "@/lib/utils"
import { motion } from "framer-motion"
import { useEffect, useRef } from "react"
import gsap from "gsap"

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
      if (expense.isShared) {
        return total + parseFloat(expense.amount) / 2
      }
      return total
    } else if (zone === "user1") {
      if (expense.paidBy === currentUser) {
        if (expense.isShared) {
          return total + parseFloat(expense.amount) / 2
        } else {
          return total + parseFloat(expense.amount)
        }
      }
      return total
    } else if (zone === "user2") {
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

  const cards = [
    { label: "Personnel A", total: user1Total, filter: "user1" as FilterZone, color: "from-blue-500/20 to-cyan-500/20" },
    { label: "Commun", total: sharedTotal, filter: "shared" as FilterZone, color: "from-purple-500/20 to-pink-500/20" },
    { label: "Personnel B", total: user2Total, filter: "user2" as FilterZone, color: "from-orange-500/20 to-red-500/20" },
  ]

  const cardRefs = useRef<(HTMLButtonElement | null)[]>([])

  useEffect(() => {
    cardRefs.current.forEach((ref, index) => {
      if (ref) {
        gsap.fromTo(
          ref,
          { opacity: 0, y: 30, scale: 0.9 },
          {
            opacity: 1,
            y: 0,
            scale: 1,
            duration: 0.6,
            delay: index * 0.15,
            ease: "back.out(1.7)",
          }
        )
      }
    })
  }, [])

  return (
    <div className="grid grid-cols-3 gap-4 mb-8">
      {cards.map((card, index) => {
        const isActive = activeFilter === card.filter
        return (
          <motion.button
            key={card.filter}
            ref={(el) => { cardRefs.current[index] = el; }}
            type="button"
            onClick={() => onFilterChange(isActive ? null : card.filter)}
            whileHover={{ 
              y: -4,
              scale: 1.02,
              transition: { duration: 0.2 }
            }}
            whileTap={{ scale: 0.98 }}
            className={cn(
              "relative flex flex-col items-center justify-center p-6 rounded-3xl",
              "glass border-2 transition-all duration-500 ease-out cursor-pointer",
              "overflow-hidden group",
              isActive
                ? "border-primary/60 shadow-2xl shadow-primary/20 scale-105"
                : "border-border/30 hover:border-border/60 hover:shadow-xl"
            )}
          >
            {/* Gradient background on hover */}
            <div className={cn(
              "absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity duration-500",
              card.color
            )} />
            
            {/* Shine effect */}
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
            </div>

            <span className="relative text-xs font-semibold text-muted-foreground mb-3 tracking-widest uppercase">
              {card.label}
            </span>
            <motion.span
              key={card.total}
              initial={{ scale: 1.2, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="relative text-2xl font-bold tracking-tight"
            >
              {formatAmount(card.total)}
            </motion.span>
            
            {isActive && (
              <motion.div
                layoutId="activeIndicator"
                className="absolute inset-0 rounded-3xl border-2 border-primary/40"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
              />
            )}
          </motion.button>
        )
      })}
    </div>
  )
}
