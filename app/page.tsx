"use client"

import { useState, useMemo, useEffect } from "react"
import Link from "next/link"
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
import { filterExpensesByMonth, calculateMonthlyTotal, formatAmount } from "@/lib/expense-utils"
import { fetchExpenses, createExpense, deleteExpense, fetchCategories } from "@/lib/expense-db"
import { supabase } from "@/lib/supabase"
import { Expense, UserRole, Category } from "@/types"
import { Plus } from "lucide-react"
import type { User as SupabaseUser } from "@supabase/supabase-js"
import { DarkModeToggle } from "@/components/dark-mode-toggle"

export default function Home() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [activeFilter, setActiveFilter] = useState<FilterZone>(null)
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [householdId, setHouseholdId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  // Déterminer le currentUser basé sur l'ID de l'utilisateur
  const currentUser: UserRole = user?.id || ""

  const loadExpenses = async (userId: string, householdId: string | null) => {
    try {
      const userExpenses = await fetchExpenses(userId, householdId)
      setExpenses(userExpenses)
    } catch (error) {
      console.error("Error loading expenses:", error)
    }
  }

  const loadCategories = async () => {
    try {
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .order("name", { ascending: true })

      if (error) {
        console.error("Error fetching categories:", error)
        // Si la table est vide, créer les catégories par défaut
        const defaultCategories = [
          { name: "Alimentation", icon: "🛒" },
          { name: "Logement", icon: "🏠" },
          { name: "Transport", icon: "🚗" },
          { name: "Loisirs", icon: "🎉" },
        ]

        const { data: insertedData, error: insertError } = await supabase
          .from("categories")
          .insert(defaultCategories)
          .select()

        if (insertError) {
          console.error("Error creating default categories:", insertError)
          // Retourner les catégories par défaut en mémoire
          setCategories(
            defaultCategories.map((cat, index) => ({
              id: `default-${index}`,
              name: cat.name,
              icon: cat.icon,
              createdAt: new Date(),
            }))
          )
        } else {
          setCategories(
            (insertedData || []).map((cat: any) => ({
              id: cat.id,
              name: cat.name,
              icon: cat.icon,
              createdAt: new Date(cat.created_at),
            }))
          )
        }
      } else if (!data || data.length === 0) {
        // Table vide, créer les catégories par défaut
        const defaultCategories = [
          { name: "Alimentation", icon: "🛒" },
          { name: "Logement", icon: "🏠" },
          { name: "Transport", icon: "🚗" },
          { name: "Loisirs", icon: "🎉" },
        ]

        const { data: insertedData, error: insertError } = await supabase
          .from("categories")
          .insert(defaultCategories)
          .select()

        if (insertError) {
          console.error("Error creating default categories:", insertError)
          setCategories(
            defaultCategories.map((cat, index) => ({
              id: `default-${index}`,
              name: cat.name,
              icon: cat.icon,
              createdAt: new Date(),
            }))
          )
        } else {
          setCategories(
            (insertedData || []).map((cat: any) => ({
              id: cat.id,
              name: cat.name,
              icon: cat.icon,
              createdAt: new Date(cat.created_at),
            }))
          )
        }
      } else {
        setCategories(
          data.map((cat: any) => ({
            id: cat.id,
            name: cat.name,
            icon: cat.icon,
            createdAt: new Date(cat.created_at),
          }))
        )
      }
    } catch (error) {
      console.error("Error loading categories:", error)
    }
  }

  // Charger l'utilisateur et les dépenses
  useEffect(() => {
    const checkUser = async () => {
      try {
        const { data: { user }, error } = await supabase.auth.getUser()
        if (error) throw error
        
        if (user) {
          setUser(user)
          const householdId = user.user_metadata?.household_id || null
          setHouseholdId(householdId)
          await loadExpenses(user.id, householdId)
          await loadCategories()
        } else {
          window.location.href = "/login"
          return
        }
      } catch (error) {
        console.error("Error checking user:", error)
        window.location.href = "/login"
        return
      } finally {
        setLoading(false)
      }
    }

    checkUser()

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
        await loadCategories()
      } else {
        setExpenses([])
        window.location.href = "/login"
      }
    })

    return () => subscription.unsubscribe()
  }, [])

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
      return monthlyExpenses.filter((expense) => expense.paidBy === currentUser)
    } else if (activeFilter === "user2") {
      return monthlyExpenses.filter((expense) => expense.paidBy === "partner")
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
    expenseDate: Date
    isRecurring: boolean
  }) => {
    if (!user) {
      console.error("User not authenticated")
      alert("Vous n'êtes pas authentifié.")
      return
    }

    try {
      const newExpenses = await createExpense(
        {
          name: expenseData.name,
          amount: expenseData.amount,
          categoryId: expenseData.categoryId,
          paidBy: expenseData.paidBy,
          isShared: expenseData.isShared,
          logoUrl: expenseData.logoUrl,
          description: null,
          expenseDate: expenseData.expenseDate,
        },
        user.id,
        householdId,
        expenseData.isRecurring
      )

      setExpenses((prev) => [...newExpenses, ...prev])
      setDrawerOpen(false)
    } catch (error: any) {
      console.error("Error adding expense:", error)
      const errorMessage = error?.message || error?.details || JSON.stringify(error, null, 2)
      alert(`Erreur SQL lors de l'ajout de la dépense:\n${errorMessage}`)
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

  if (loading) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground tracking-tight">Chargement...</p>
        </div>
      </main>
    )
  }

  if (!user) {
    return null
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-md md:max-w-2xl lg:max-w-3xl px-4 py-6">
        {/* Header */}
        <header className="mb-6 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <div className="h-10 w-10 shrink-0 flex items-center justify-center">
              <img
                src="/PILOT_logo.webp"
                alt="PILOT"
                className="h-full w-full object-contain"
              />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-foreground tracking-tight">PILOT</h1>
              <p className="text-xs text-muted-foreground tracking-tight">
                Budget mensuel partagé
              </p>
            </div>
          </Link>
          <div className="flex items-center gap-2">
            <DarkModeToggle />
            {user && (
              <UserProfile />
            )}
          </div>
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
              categories={categories}
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
