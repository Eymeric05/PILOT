"use client"

import { useState, useEffect, useRef } from "react"
import { Expense, Category, UserRole } from "@/types"
import { formatAmount, getDisplayAmount, formatExpenseDate } from "@/lib/expense-utils"
import { getClearbitLogoUrl, getGoogleFaviconUrl } from "@/lib/logo-utils"
import { Users, X } from "lucide-react"
import Image from "next/image"
import { motion, AnimatePresence } from "framer-motion"
import gsap from "gsap"

function LogoDisplay({ logoUrl, name }: { logoUrl: string | null | undefined; name: string }) {
  const [useFallback, setUseFallback] = useState(false)
  const [useInitial, setUseInitial] = useState(false)
  const logoRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (logoRef.current) {
      gsap.fromTo(
        logoRef.current,
        { scale: 0, rotation: -180 },
        { scale: 1, rotation: 0, duration: 0.5, ease: "back.out(1.7)" }
      )
    }
  }, [logoUrl])

  if (useInitial) {
    return (
      <motion.div
        ref={logoRef}
        className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary via-primary/80 to-primary/60 text-primary-foreground font-bold text-xl shadow-lg ring-2 ring-transparent transition-[box-shadow,transform] duration-200 hover:ring-primary/50 hover:shadow-xl hover:shadow-primary/20"
        whileHover={{ scale: 1.05 }}
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
      >
        {name.charAt(0).toUpperCase()}
      </motion.div>
    )
  }

  const imageUrl = useFallback ? getGoogleFaviconUrl(name) : (logoUrl || getClearbitLogoUrl(name))

  return (
    <motion.div
      ref={logoRef}
      className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl glass overflow-hidden border-2 border-border/30 ring-2 ring-transparent transition-[box-shadow,transform] duration-200 hover:ring-primary/40 hover:shadow-lg hover:shadow-primary/10"
      whileHover={{ scale: 1.05 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
    >
      <Image
        src={imageUrl}
        alt={name}
        width={64}
        height={64}
        unoptimized
        className="w-full h-full object-cover"
        onError={() => useFallback ? setUseInitial(true) : setUseFallback(true)}
      />
    </motion.div>
  )
}

interface ExpenseListProps {
  expenses: Expense[]
  categories: Category[]
  currentUser: UserRole
  onDelete?: (id: string) => void
  activeFilter?: "user1" | "shared" | "user2" | null
}

export function ExpenseList({ expenses, categories, currentUser, onDelete, activeFilter }: ExpenseListProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (containerRef.current) {
      const items = containerRef.current.children
      gsap.fromTo(
        Array.from(items),
        { opacity: 0, x: -50, scale: 0.9 },
        {
          opacity: 1,
          x: 0,
          scale: 1,
          duration: 0.5,
          stagger: 0.08,
          ease: "power3.out",
        }
      )
    }
  }, [expenses])

  return (
    <div ref={containerRef} className="space-y-3">
      <AnimatePresence mode="popLayout">
        {expenses.map((expense: any, index: number) => (
          <motion.div
            key={expense.id}
            layout
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
            className="group relative flex items-center gap-4 rounded-2xl glass border-2 border-border/30 p-5 transition-colors duration-200 overflow-hidden"
          >
            <LogoDisplay logoUrl={expense.logoUrl} name={expense.name} />
            
            <div className="flex-1 min-w-0 relative z-10">
              <div className="flex items-center gap-2 mb-1">
                <p className="text-base font-bold tracking-tight truncate">{expense.name}</p>
                {expense.isShared && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="flex items-center justify-center"
                  >
                    <Users className="h-4 w-4 text-primary" />
                  </motion.div>
                )}
              </div>
              <div className="space-y-1">
                {expense.categoryId && categories.find((c: Category) => c.id === expense.categoryId) && (
                  <p className="text-xs text-muted-foreground tracking-wide flex items-center gap-1">
                    <span>{categories.find((c: Category) => c.id === expense.categoryId)?.icon}</span>
                    <span>{categories.find((c: Category) => c.id === expense.categoryId)?.name}</span>
                  </p>
                )}
                <p className="text-xs text-muted-foreground/70">
                  {formatExpenseDate(expense.expenseDate)}
                </p>
                {expense.description && (
                  <p className="text-xs text-muted-foreground/80 italic mt-1 truncate">
                    {expense.description}
                  </p>
                )}
              </div>
            </div>
            
            <div className="text-right shrink-0 relative z-10 pr-12">
              <motion.p
                key={`${expense.amount}-${activeFilter}`}
                initial={{ scale: 1.2, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="text-xl font-bold tracking-tight"
              >
                {activeFilter === "shared" 
                  ? formatAmount(expense.amount) // Montant entier pour "Commun"
                  : activeFilter && expense.isShared
                    ? formatAmount(getDisplayAmount(expense, currentUser)) // Moitié pour user1/user2 si partagé
                    : formatAmount(expense.amount) // Montant entier sinon
                }
              </motion.p>
            </div>
            
            {onDelete && (
              <button
                onClick={() => onDelete(expense.id)}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-xl glass hover:bg-destructive/20 hover:text-destructive
                           transition-colors duration-200 opacity-0 group-hover:opacity-100 z-20"
                aria-label="Supprimer"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
