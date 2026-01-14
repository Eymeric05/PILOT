"use client"

import { useState, useMemo } from "react"
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
import { mockExpenses, mockCategories } from "@/lib/mock-data"
import { filterExpensesByMonth, calculateMonthlyTotal, formatAmount } from "@/lib/expense-utils"
import { Expense, UserRole } from "@/types"
import { Plus } from "lucide-react"

export default function Home() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [expenses, setExpenses] = useState<Expense[]>(mockExpenses)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [activeFilter, setActiveFilter] = useState<FilterZone>(null)
  const currentUser: UserRole = "user1" // À remplacer par la logique d'auth plus tard

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

  const handleAddExpense = (expenseData: {
    name: string
    amount: string
    categoryId: string
    paidBy: UserRole
    isShared: boolean
    logoUrl: string | null
  }) => {
    const newExpense: Expense = {
      id: Date.now().toString(),
      name: expenseData.name,
      amount: expenseData.amount,
      categoryId: expenseData.categoryId,
      paidBy: expenseData.paidBy,
      isShared: expenseData.isShared,
      logoUrl: expenseData.logoUrl,
      description: null,
      expenseDate: new Date(currentDate),
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    setExpenses((prev) => [newExpense, ...prev])
    setDrawerOpen(false)
  }

  const handleDeleteExpense = (expenseId: string) => {
    // TODO: Remplacer par un appel API vers la BDD
    setExpenses((prev) => prev.filter((expense) => expense.id !== expenseId))
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="container mx-auto max-w-2xl px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-medium mb-2">PILOT</h1>
          <p className="text-sm text-muted-foreground">
            Budget mensuel partagé
          </p>
        </div>

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
          <ExpenseList
            expenses={sortedExpenses}
            categories={mockCategories}
            currentUser={currentUser}
            onDelete={handleDeleteExpense}
          />
        </div>

        {/* Bouton d'ajout - Drawer sur mobile */}
        <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
          <DrawerTrigger asChild>
            <Button className="fixed bottom-6 right-4 h-14 w-14 rounded-full md:static md:h-11 md:w-auto md:rounded border border-border md:shadow-none">
              <Plus className="h-5 w-5 md:mr-2" />
              <span className="hidden md:inline">Ajouter une dépense</span>
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
