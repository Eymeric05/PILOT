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
    if (zone === "shared") {
      // Pour la zone "Commun", on compte le montant COMPLET de chaque dépense partagée
      // (sans division, car c'est le total des dépenses partagées)
      if (expense.isShared) {
        return total + parseFloat(expense.amount)
      }
      return total
    } else if (zone === "user1") {
      // Pour user1 (Personnel A)
      if (expense.isShared) {
        // Si la dépense est partagée, user1 doit toujours payer la moitié, peu importe qui l'a payée
        return total + parseFloat(expense.amount) / 2
      } else {
        // Si la dépense n'est pas partagée, on compte seulement si c'est user1 qui l'a payée
        if (expense.paidBy === currentUser) {
          return total + parseFloat(expense.amount)
        }
      }
      return total
    } else if (zone === "user2") {
      // Pour user2 (Personnel B)
      if (expense.isShared) {
        // Si la dépense est partagée, user2 doit toujours payer la moitié, peu importe qui l'a payée
        return total + parseFloat(expense.amount) / 2
      } else {
        // Si la dépense n'est pas partagée, on compte seulement si c'est user2 qui l'a payée
        if (expense.paidBy === "partner") {
          return total + parseFloat(expense.amount)
        }
      }
      return total
    }
    return total
  }, 0)
}

export function HorizonSplit({ expenses, currentUser, activeFilter, onFilterChange, user }: HorizonSplitProps) {
  const user1Total = calculateZoneTotal(expenses, "user1", currentUser)
  const sharedTotal = calculateZoneTotal(expenses, "shared", currentUser)
  const user2Total = calculateZoneTotal(expenses, "user2", currentUser)

  // Récupérer les noms depuis user_metadata, avec fallback intelligent
  const user1Name = user?.user_metadata?.display_name 
    || user?.email?.split("@")[0]?.charAt(0).toUpperCase() + user?.email?.split("@")[0]?.slice(1)
    || "Personnel A"
  
  // Pour user2, utiliser le nom personnalisé ou garder "Personnel B" si non défini
  const user2Name = user?.user_metadata?.partner_name || "Personnel B"
  
  // Récupérer les photos depuis user_metadata
  const user1Picture = user?.user_metadata?.profile_picture_url || null
  const user2Picture = user?.user_metadata?.partner_profile_picture_url || null

  // Debug: vérifier les valeurs récupérées
  useEffect(() => {
    if (user) {
      console.log('[HorizonSplit] Métadonnées utilisateur:', {
        user1Name,
        user2Name,
        user1Picture: user1Picture ? `Present (${user1Picture.substring(0, 30)}...)` : 'Missing',
        user2Picture: user2Picture ? `Present (${user2Picture.substring(0, 30)}...)` : 'Missing',
        raw_metadata: {
          display_name: user.user_metadata?.display_name,
          partner_name: user.user_metadata?.partner_name,
          profile_picture_url: user.user_metadata?.profile_picture_url ? 'Present' : 'Missing',
          partner_profile_picture_url: user.user_metadata?.partner_profile_picture_url ? 'Present' : 'Missing',
        }
      })
    }
  }, [user, user1Name, user2Name, user1Picture, user2Picture])

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
                <div className="relative h-12 w-12 rounded-full overflow-hidden border-2 border-border/50 mx-auto">
                  {card.picture.startsWith('data:image') ? (
                    // Image base64
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
                      className="object-cover"
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
