"use client"

import { useState, useMemo, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer"
import { ExpenseList } from "@/components/expense-list"
import { ExpenseForm } from "@/components/expense-form"
import { MonthSelector } from "@/components/month-selector"
import { HorizonSplit, FilterZone } from "@/components/horizon-split"
import { UserProfile } from "@/components/user-profile"
import { filterExpensesByMonth } from "@/lib/expense-utils"
import { useAuth } from "@/lib/hooks/use-auth"
import { useCategories } from "@/lib/hooks/use-categories"
import { useExpenses } from "@/lib/hooks/use-expenses"
import { Expense, UserRole } from "@/types"
import { Plus, Sparkles } from "lucide-react"
import { DarkModeToggle } from "@/components/dark-mode-toggle"
import Image from "next/image"
import { motion } from "framer-motion"
import gsap from "gsap"

export default function Home() {
  const router = useRouter()
  const [currentDate, setCurrentDate] = useState(new Date())
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [activeFilter, setActiveFilter] = useState<FilterZone>(null)
  const [connectionError, setConnectionError] = useState<string | null>(null)
  const headerRef = useRef<HTMLElement>(null)
  const fabRef = useRef<HTMLDivElement>(null)

  const { user, loading: authLoading, householdId, setUser } = useAuth()
  const { categories, loading: categoriesLoading } = useCategories()
  const { expenses, loading: expensesLoading, loadExpenses, addExpense, removeExpense } = useExpenses(
    user?.id || null,
    householdId
  )

  const currentUser: UserRole = user?.id || ""

  // Charger les dépenses quand l'utilisateur est disponible
  useEffect(() => {
    if (user?.id) {
      loadExpenses()
    }
  }, [user?.id, loadExpenses])

  // Gérer les erreurs de connexion
  useEffect(() => {
    const handleError = (event: Event) => {
      const errorEvent = event as CustomEvent
      if (errorEvent.detail?.includes('Failed to fetch') || errorEvent.detail?.includes('ERR_CONNECTION_RESET')) {
        setConnectionError('Serveur Supabase injoignable')
      }
    }

    window.addEventListener('connectionError', handleError as EventListener)
    return () => window.removeEventListener('connectionError', handleError as EventListener)
  }, [])

  // Animations GSAP
  useEffect(() => {
    if (!authLoading) {
      if (headerRef.current) {
        gsap.fromTo(
          headerRef.current,
          { opacity: 0, y: -30 },
          { opacity: 1, y: 0, duration: 0.8, ease: "power3.out" }
        )
      }

      if (fabRef.current) {
        gsap.fromTo(
          fabRef.current,
          { scale: 0, rotation: -180 },
          { 
            scale: 1, 
            rotation: 0, 
            duration: 0.6, 
            delay: 0.5,
            ease: "back.out(1.7)" 
          }
        )
      }
    }
  }, [authLoading])

  // Calculs memoïsés
  const monthlyExpenses = useMemo(() => {
    return filterExpensesByMonth(expenses, currentDate.getFullYear(), currentDate.getMonth())
  }, [expenses, currentDate])

  const filteredExpenses = useMemo(() => {
    if (!activeFilter) return monthlyExpenses
    if (activeFilter === "shared") {
      return monthlyExpenses.filter(e => e.isShared)
    }
    if (activeFilter === "user1") {
      return monthlyExpenses.filter(e => e.paidBy === currentUser || e.isShared)
    }
    if (activeFilter === "user2") {
      return monthlyExpenses.filter(e => e.paidBy === "partner" || e.isShared)
    }
    return monthlyExpenses
  }, [monthlyExpenses, activeFilter, currentUser])

  const sortedExpenses = useMemo(() => {
    return [...filteredExpenses].sort((a, b) => new Date(b.expenseDate).getTime() - new Date(a.expenseDate).getTime())
  }, [filteredExpenses])

  // Handlers
  const handleAddExpense = async (expenseData: any) => {
    if (!user) {
      const errorMsg = "Vous devez être connecté pour ajouter une dépense"
      alert(errorMsg)
      throw new Error(errorMsg)
    }

    try {
      await addExpense(expenseData, expenseData.isRecurring)
      setDrawerOpen(false)
    } catch (error: any) {
      const errorMsg = error.message || "Une erreur est survenue lors de l'ajout de la dépense"
      alert(`Erreur: ${errorMsg}`)
      throw error
    }
  }

  const handleDeleteExpense = async (id: string) => {
    try {
      await removeExpense(id)
    } catch (error: any) {
      alert(`Erreur lors de la suppression: ${error.message || "Une erreur est survenue"}`)
    }
  }

  // Gérer les mises à jour de l'utilisateur
  useEffect(() => {
    const handleUserMetadataUpdate = () => {
      // L'événement USER_UPDATED sera géré par useAuth
    }
    window.addEventListener('userMetadataUpdated', handleUserMetadataUpdate)
    return () => window.removeEventListener('userMetadataUpdated', handleUserMetadataUpdate)
  }, [])

  // Loading state
  if (authLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background gradient-mesh">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"
          />
          <p className="text-muted-foreground font-medium">Chargement...</p>
        </motion.div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <main className="min-h-screen bg-background gradient-mesh relative overflow-hidden">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      <div className="relative z-10 mx-auto max-w-md px-4 py-8 sm:px-6">
        <motion.header
          ref={headerRef}
          className="mb-8 flex items-center justify-between"
        >
          <div className="flex items-center gap-4">
            <motion.div
              whileHover={{ scale: 1.1, rotate: 10 }}
              whileTap={{ scale: 0.95 }}
              className="relative"
            >
              <Image
                src="/PILOT_logo.webp"
                alt="Logo"
                width={56}
                height={56}
                className="rounded-2xl shadow-2xl glass border-2 border-border/30"
              />
              <motion.div
                animate={{ 
                  scale: [1, 1.2, 1],
                  opacity: [0.5, 1, 0.5]
                }}
                transition={{ 
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                className="absolute -top-1 -right-1"
              >
                <Sparkles className="h-5 w-5 text-primary" />
              </motion.div>
            </motion.div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-gradient">
                {user?.user_metadata?.display_name || user?.email?.split("@")[0] || "PILOT"}
              </h1>
              <p className="text-sm text-muted-foreground tracking-wide font-medium">Budget mensuel partagé</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <DarkModeToggle />
            <UserProfile />
          </div>
        </motion.header>

        {connectionError && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="mb-4 p-4 rounded-2xl glass border-2 border-destructive/50 bg-destructive/10"
          >
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-destructive">{connectionError}</p>
              <button
                onClick={() => setConnectionError(null)}
                className="text-destructive/70 hover:text-destructive transition-colors"
                aria-label="Fermer"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </motion.div>
        )}

        <MonthSelector currentDate={currentDate} onDateChange={setCurrentDate} />

        <HorizonSplit
          expenses={monthlyExpenses}
          currentUser={currentUser}
          activeFilter={activeFilter}
          onFilterChange={setActiveFilter}
          user={user}
        />

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-8"
        >
          <ExpenseList
            expenses={sortedExpenses}
            categories={categories}
            currentUser={currentUser}
            activeFilter={activeFilter}
            onDelete={handleDeleteExpense}
          />
        </motion.div>

        <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
          <DrawerTrigger asChild>
            <motion.div
              ref={fabRef}
              className="fixed bottom-6 right-6 z-50"
            >
              <motion.div
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.9 }}
                className="relative"
              >
                <Button
                  size="lg"
                  className="h-20 w-20 rounded-full shadow-2xl hover:shadow-primary/30
                             bg-gradient-to-br from-primary to-primary/80
                             transition-all duration-300 relative overflow-hidden group"
                  aria-label="Ajouter une dépense"
                >
                  <motion.div
                    animate={{ rotate: drawerOpen ? 45 : 0 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                    className="relative z-10"
                  >
                    <Plus className="h-8 w-8" strokeWidth={3} />
                  </motion.div>
                  <motion.div
                    className="absolute inset-0 bg-white/20 rounded-full"
                    initial={{ scale: 0, opacity: 1 }}
                    animate={{ 
                      scale: drawerOpen ? [1, 2, 0] : 0,
                      opacity: [1, 0.5, 0]
                    }}
                    transition={{ duration: 0.6 }}
                  />
                </Button>
              </motion.div>
            </motion.div>
          </DrawerTrigger>
          <DrawerContent className="max-h-[calc(100vh-2rem)] flex flex-col">
            <DrawerHeader className="text-left pb-2 sm:pb-3 flex-shrink-0">
              <DrawerTitle>Nouvelle dépense</DrawerTitle>
              <DrawerDescription>
                Ajoutez une dépense à votre budget
              </DrawerDescription>
            </DrawerHeader>
            <div className="px-4 pb-4 overflow-y-auto flex-1 min-h-0">
              <ExpenseForm
                categories={categories}
                currentUser={currentUser}
                userId={user?.id || ""}
                onSubmit={handleAddExpense}
                onCancel={() => setDrawerOpen(false)}
              />
            </div>
          </DrawerContent>
        </Drawer>
      </div>
    </main>
  )
}
