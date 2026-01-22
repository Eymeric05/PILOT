"use client"

import { Expense, UserRole } from "@/types"
import { formatAmount } from "@/lib/expense-utils"
import { cn } from "@/lib/utils"
import { motion } from "framer-motion"
import { useEffect, useRef } from "react"
import gsap from "gsap"
import Image from "next/image"
import { User, Users } from "lucide-react"
import type { User as SupabaseUser } from "@supabase/supabase-js"

export type FilterZone = "user1" | "shared" | "user2" | null

interface HorizonSplitProps {
  expenses: Expense[]
  currentUser: UserRole
  activeFilter: FilterZone
  onFilterChange: (filter: FilterZone) => void
  user?: SupabaseUser | null
}

function calculateZoneTotal(expenses: Expense[], zone: "user1" | "shared" | "user2", currentUser: UserRole): number {
  return expenses.reduce((total, expense) => {
    const amount = parseFloat(expense.amount) || 0
    
    if (zone === "shared") {
      // Zone "Commun" : montant COMPLET de chaque dépense partagée
      // Exemple : dépense partagée de 100€ → shared = 100€
      if (expense.isShared) {
        return total + amount
      }
      return total
    } else if (zone === "user1") {
      // Zone user1 (Personnel A) :
      // - Si partagée : moitié (ex: 100€ → 50€)
      // - Si non partagée et payée par user1 : montant complet (ex: 100€ → 100€)
      if (expense.isShared) {
        return total + amount / 2
      } else if (expense.paidBy === currentUser) {
        return total + amount
      }
      return total
    } else if (zone === "user2") {
      // Zone user2 (Personnel B) :
      // - Si partagée : moitié (ex: 100€ → 50€)
      // - Si non partagée et payée par user2 : montant complet (ex: 100€ → 100€)
      if (expense.isShared) {
        return total + amount / 2
      } else if (expense.paidBy === "partner") {
        return total + amount
      }
      return total
    }
    return total
  }, 0)
}

export function HorizonSplit({ expenses, currentUser, activeFilter, onFilterChange, user }: HorizonSplitProps) {
  // Calcul des totaux avec partage correct :
  // - Dépense partagée de 100€ : user1 = 50€, shared = 100€, user2 = 50€
  // - Dépense non partagée payée par user1 : user1 = 100€, shared = 0€, user2 = 0€
  const user1Total = calculateZoneTotal(expenses, "user1", currentUser)
  const sharedTotal = calculateZoneTotal(expenses, "shared", currentUser)
  const user2Total = calculateZoneTotal(expenses, "user2", currentUser)

  // Récupérer les noms depuis user_metadata, avec fallback intelligent
  const emailPart = user?.email?.split("@")[0]
  const formattedEmail = emailPart 
    ? emailPart.charAt(0).toUpperCase() + emailPart.slice(1)
    : null
  const user1Name = user?.user_metadata?.display_name 
    || formattedEmail
    || "Personnel A"
  
  // Pour user2, utiliser le nom personnalisé ou garder "Personnel B" si non défini
  const user2Name = user?.user_metadata?.partner_name || "Personnel B"
  
  // Récupérer les photos depuis user_metadata (base64 ou URL)
  const user1Picture = user?.user_metadata?.profile_picture_url || null
  const user2Picture = user?.user_metadata?.partner_profile_picture_url || null


  const cards = [
    { 
      label: user1Name, 
      total: user1Total, 
      filter: "user1" as FilterZone, 
      color: "from-blue-500/20 to-cyan-500/20",
      picture: user1Picture
    },
    { 
      label: "Commun", 
      total: sharedTotal, 
      filter: "shared" as FilterZone, 
      color: "from-purple-500/20 to-pink-500/20",
      picture: null
    },
    { 
      label: user2Name, 
      total: user2Total, 
      filter: "user2" as FilterZone, 
      color: "from-orange-500/20 to-red-500/20",
      picture: user2Picture
    },
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

            {/* Profile picture or icon */}
            {card.picture ? (
              <div className="relative mb-3">
                <div className="relative h-12 w-12 rounded-full overflow-hidden border-2 border-border/50 mx-auto shadow-lg">
                  {card.picture.startsWith('data:image') || card.picture.startsWith('data:image/') ? (
                    // Image base64 - utiliser img pour base64
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={card.picture}
                      alt={card.label}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    // URL externe
                    <Image
                      src={card.picture}
                      alt={card.label}
                      width={48}
                      height={48}
                      className="w-full h-full object-cover"
                      unoptimized
                    />
                  )}
                </div>
              </div>
            ) : card.filter === "shared" ? (
              <div className="relative mb-3 flex justify-center">
                <div className="h-12 w-12 rounded-full bg-purple-500/10 border-2 border-border/50 flex items-center justify-center">
                  <Users className="h-6 w-6 text-purple-400" />
                </div>
              </div>
            ) : (
              <div className="relative mb-3 flex justify-center">
                <div className="h-12 w-12 rounded-full bg-primary/10 border-2 border-border/50 flex items-center justify-center">
                  <User className="h-6 w-6 text-primary" />
                </div>
              </div>
            )}

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
