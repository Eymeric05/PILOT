"use client"

import { useState, useMemo, useEffect } from "react"
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
import { mockCategories } from "@/lib/mock-data"
import { filterExpensesByMonth, calculateMonthlyTotal, formatAmount } from "@/lib/expense-utils"
import { fetchExpenses, createExpense, deleteExpense } from "@/lib/expense-db"
import { supabase } from "@/lib/supabase"
import { Expense, UserRole } from "@/types"
import { Plus } from "lucide-react"
import type { User as SupabaseUser } from "@supabase/supabase-js"

export default function Home() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [activeFilter, setActiveFilter] = useState<FilterZone>(null)
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [householdId, setHouseholdId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  // Déterminer le currentUser basé sur les métadonnées de l'utilisateur
  const currentUser: UserRole = user?.user_metadata?.role || "user1"

  // Charger l'utilisateur et les dépenses
  useEffect(() => {
    // Récupérer l'utilisateur actuel
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user)
      if (user) {
        // Récupérer le household_id depuis les métadonnées ou la table users
        setHouseholdId(user.user_metadata?.household_id || null)
        loadExpenses(user.id, user.user_metadata?.household_id || null)
      } else {
        setLoading(false)
      }
    })

    // Écouter les changements d'authentification
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const currentUser = session?.user ?? null
      setUser(currentUser)
      if (currentUser) {
        const householdId = currentUser.user_metadata?.household_id || null
        setHouseholdId(householdId)
        await loadExpenses(currentUser.id, householdId)
      } else {
        setExpenses([])
        setLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const loadExpenses = async (userId: string, householdId: string | null) => {
    try {
      setLoading(true)
      const userExpenses = await fetchExpenses(userId, householdId)
      setExpenses(userExpenses)
    } catch (error) {
      console.error("Error loading expenses:", error)
    } finally {
      setLoading(false)
    }
  }

  // Filtrer les dépenses du mois courant
  const monthlyExpenses = useMemo(() => {
    return filterExpensesByMonth(
      expenses,
      currentDate.getFullYear(),
      currentDate.getMonth()
    )
  }, [expenses, currentDate])

  // Filtrer les dépenses selon la zone active
  const filteredExpenses = useMemo(() => {
    if (!activeFilter) {
      return monthlyExpenses
    }

    if (activeFilter === "shared") {
      return monthlyExpenses.filter((expense) => expense.isShared)
    } else if (activeFilter === "user1") {
      return monthlyExpenses.filter((expense) => expense.paidBy === "user1")
    } else if (activeFilter === "user2") {
      return monthlyExpenses.filter((expense) => expense.paidBy === "user2")
    }

    return monthlyExpenses
  }, [monthlyExpenses, activeFilter])

  // Calculer le total du mois
  const monthlyTotal = useMemo(() => {
    return calculateMonthlyTotal(monthlyExpenses, currentUser)
  }, [monthlyExpenses, currentUser])

  // Trier les dépenses par date (plus récentes en premier)
  const sortedExpenses = useMemo(() => {
    return [...filteredExpenses].sort((a, b) => {
      return new Date(b.expenseDate).getTime() - new Date(a.expenseDate).getTime()
    })
  }, [filteredExpenses])

  const handleAddExpense = async (expenseData: {
    name: string
    amount: string
    categoryId: string
    paidBy: UserRole
    isShared: boolean
    logoUrl: string | null
  }) => {
    if (!user) {
      console.error("User not authenticated")
      return
    }

    try {
      const newExpense = await createExpense(
        {
          name: expenseData.name,
          amount: expenseData.amount,
          categoryId: expenseData.categoryId,
          paidBy: expenseData.paidBy,
          isShared: expenseData.isShared,
          logoUrl: expenseData.logoUrl,
          description: null,
          expenseDate: new Date(currentDate),
        },
        user.id,
        householdId
      )

      setExpenses((prev) => [newExpense, ...prev])
      setDrawerOpen(false)
    } catch (error) {
      console.error("Error adding expense:", error)
    }
  }

  const handleDeleteExpense = async (expenseId: string) => {
    try {
      await deleteExpense(expenseId)
      setExpenses((prev) => prev.filter((expense) => expense.id !== expenseId))
    } catch (error) {
      console.error("Error deleting expense:", error)
    }
  }

  // Rediriger vers la page de connexion si l'utilisateur n'est pas connecté
  useEffect(() => {
    if (!loading && !user) {
      window.location.href = "/login"
    }
  }, [user, loading])

  if (!user && !loading) {
    return null
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-[600px] px-6 py-8">
        {/* Header */}
        <header className="mb-8 flex items-center justify-between pb-6">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 shrink-0 flex items-center justify-center">
              <img
                src="/img/PILOT_logo.webp"
                alt="PILOT"
                className="h-full w-full object-contain"
              />
            </div>
            <div>
              <h1 className="text-3xl font-semibold mb-1 text-foreground tracking-tight">PILOT</h1>
              <p className="text-sm text-muted-foreground tracking-tight">
                Budget mensuel partagé
              </p>
            </div>
          </div>
          {user && (
            <UserProfile />
          )}
        </header>

        {/* Sélecteur de mois */}
        <MonthSelector currentDate={currentDate} onDateChange={setCurrentDate} />

        {/* Barre Horizon Split */}
        <HorizonSplit
          expenses={monthlyExpenses}
          currentUser={currentUser}
          activeFilter={activeFilter}
          onFilterChange={setActiveFilter}
        />

        {/* Liste des dépenses */}
        <div className="mb-6">
          {loading ? (
            <div className="py-12 text-center text-muted-foreground tracking-tight">
              <p>Chargement des dépenses...</p>
            </div>
          ) : (
            <ExpenseList
              expenses={sortedExpenses}
              categories={mockCategories}
              currentUser={currentUser}
              onDelete={handleDeleteExpense}
            />
          )}
        </div>

        {/* Bouton d'ajout - Drawer sur mobile */}
        <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
          <DrawerTrigger asChild>
            <Button className="fixed bottom-6 right-6 h-14 w-14 rounded-full md:static md:h-11 md:w-auto md:rounded-full shadow-sm">
              <Plus className="h-5 w-5 md:mr-2" />
              <span className="hidden md:inline tracking-tight">Ajouter une dépense</span>
            </Button>
          </DrawerTrigger>
          <DrawerContent>
            <DrawerHeader className="text-left">
              <DrawerTitle>Nouvelle dépense</DrawerTitle>
              <DrawerDescription>
                Ajoutez une nouvelle dépense à votre budget mensuel
              </DrawerDescription>
            </DrawerHeader>
            <div className="px-4 pb-8">
              <ExpenseForm
                categories={mockCategories}
                currentUser={currentUser}
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
