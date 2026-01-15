"use client"

import { useState, useMemo, useEffect } from "react"
import Link from "next/link"
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
import { filterExpensesByMonth, calculateMonthlyTotal } from "@/lib/expense-utils"
import { fetchExpenses, createExpense, deleteExpense } from "@/lib/expense-db"
import { supabase } from "@/lib/supabase"
import { Expense, UserRole, Category } from "@/types"
import { Plus } from "lucide-react"
import type { User as SupabaseUser } from "@supabase/supabase-js"
import { DarkModeToggle } from "@/components/dark-mode-toggle"
import Image from "next/image"

export default function Home() {
  const router = useRouter()
  const [currentDate, setCurrentDate] = useState(new Date())
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [activeFilter, setActiveFilter] = useState<FilterZone>(null)
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [householdId, setHouseholdId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  // Utilisation de l'ID réel pour l'identité
  const currentUser: UserRole = user?.id || ""

  // CHARGEMENT DES CATÉGORIES DEPUIS LA BDD (Supprime l'erreur mockCategories)
  const loadCategories = async () => {
    try {
      const { data, error } = await supabase.from("categories").select("*")
      
      if (error) throw error

      if (!data || data.length === 0) {
        // Insertion automatique si la table est vide (Auto-seed)
        const defaultCategories = [
          { name: "Alimentation", icon: "🛒" },
          { name: "Logement", icon: "🏠" },
          { name: "Transport", icon: "🚗" },
          { name: "Loisirs", icon: "🎉" },
        ]
        const { data: inserted } = await supabase.from("categories").insert(defaultCategories).select()
        if (inserted) setCategories(inserted.map(c => ({ ...c, createdAt: new Date(c.created_at) })))
      } else {
        setCategories(data.map(c => ({
          id: c.id,
          name: c.name,
          icon: c.icon,
          createdAt: new Date(c.created_at)
        })))
      }
    } catch (err) {
      console.error("Erreur catégories:", err)
    }
  }

  const loadExpenses = async (userId: string, hId: string | null) => {
    try {
      const userExpenses = await fetchExpenses(userId, hId)
      setExpenses(userExpenses)
    } catch (error) {
      console.error("Error loading expenses:", error)
    }
  }

  useEffect(() => {
    let isMounted = true
    const initApp = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push("/login")
        return
      }
      if (isMounted) {
        setUser(user)
        const hId = user.user_metadata?.household_id || null
        setHouseholdId(hId)
        await Promise.all([loadExpenses(user.id, hId), loadCategories()])
        setLoading(false)
      }
    }
    initApp()
    return () => { isMounted = false }
  }, [router])

  // LOGIQUE DE FILTRAGE
  const monthlyExpenses = useMemo(() => {
    return filterExpensesByMonth(expenses, currentDate.getFullYear(), currentDate.getMonth())
  }, [expenses, currentDate])

  const filteredExpenses = useMemo(() => {
    if (!activeFilter) return monthlyExpenses
    if (activeFilter === "shared") return monthlyExpenses.filter(e => e.isShared)
    if (activeFilter === "user1") return monthlyExpenses.filter(e => e.paidBy === currentUser)
    if (activeFilter === "user2") return monthlyExpenses.filter(e => e.paidBy === "partner")
    return monthlyExpenses
  }, [monthlyExpenses, activeFilter, currentUser])

  const sortedExpenses = useMemo(() => {
    return [...filteredExpenses].sort((a, b) => new Date(b.expenseDate).getTime() - new Date(a.expenseDate).getTime())
  }, [filteredExpenses])

  // AJOUT AVEC RÉCURRENCE ET LOGO.DEV
  const handleAddExpense = async (expenseData: any) => {
    if (!user) return
    try {
      const newExpenses = await createExpense(
        { ...expenseData, description: null },
        user.id,
        householdId,
        expenseData.isRecurring
      )
      // On recharge tout pour être sûr de voir les récurrences futures si nécessaire
      await loadExpenses(user.id, householdId)
      setDrawerOpen(false)
    } catch (error: any) {
      alert(`Erreur SQL : ${error.message || JSON.stringify(error)}`)
    }
  }

  if (loading) return <div className="flex h-screen items-center justify-center">Chargement...</div>

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-md px-4 py-6">
        <header className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Image src="/PILOT_logo.webp" alt="Logo" width={40} height={40} />
            <div>
              <h1 className="text-xl font-bold">
                {user?.user_metadata?.display_name || user?.email?.split("@")[0]}
              </h1>
              <p className="text-xs text-muted-foreground">Budget PILOT</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <DarkModeToggle />
            <UserProfile />
          </div>
        </header>

        <MonthSelector currentDate={currentDate} onDateChange={setCurrentDate} />

        <HorizonSplit
          expenses={monthlyExpenses}
          currentUser={currentUser}
          activeFilter={activeFilter}
          onFilterChange={setActiveFilter}
        />

        <div className="mt-6">
          <ExpenseList
            expenses={sortedExpenses}
            categories={categories}
            currentUser={currentUser}
            onDelete={async (id) => {
                await deleteExpense(id);
                setExpenses(prev => prev.filter(e => e.id !== id));
            }}
          />
        </div>

        <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
          <DrawerTrigger asChild>
            <Button className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg">
              <Plus className="h-6 w-6" />
            </Button>
          </DrawerTrigger>
          <DrawerContent>
            <div className="p-4">
              <ExpenseForm
                categories={categories}
                currentUser={currentUser}
                userId={user.id}
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