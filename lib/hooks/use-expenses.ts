import { useState, useCallback, useRef } from "react"
import { fetchExpenses, createExpense, deleteExpense } from "@/lib/expense-db"
import { Expense } from "@/types"

export function useExpenses(userId: string | null, householdId: string | null) {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(false)
  const loadedRef = useRef(false)

  const loadExpenses = useCallback(async (force = false) => {
    if (!userId) return
    if (!force && loadedRef.current) return
    
    loadedRef.current = true
    setLoading(true)
    try {
      const data = await fetchExpenses(userId, householdId)
      setExpenses(data || [])
    } catch (error: any) {
      console.error("Error loading expenses:", error)
      
      // Si erreur réseau (ERR_HTTP2, ERR_CONNECTION_RESET, etc.), garder les données actuelles
      const isNetworkError = error?.message?.includes('ERR_HTTP2') || 
                            error?.message?.includes('ERR_CONNECTION_RESET') ||
                            error?.message?.includes('ERR_CONNECTION_CLOSED') ||
                            error?.message?.includes('Failed to fetch')
      
      if (isNetworkError) {
        // Garder les données actuelles et ne pas vider l'état
        console.warn("Network error - keeping current expenses data")
        // Déclencher un événement pour afficher une notification discrète
        window.dispatchEvent(new CustomEvent('connectionError', { 
          detail: error.message || 'ERR_HTTP2_PROTOCOL_ERROR' 
        }))
        // Ne pas réinitialiser loadedRef pour éviter les tentatives répétées
      } else {
        // Pour les autres erreurs, on garde aussi pour éviter de perdre les données
      }
      
      loadedRef.current = false
    } finally {
      setLoading(false)
    }
  }, [userId, householdId])

  const reset = useCallback(() => {
    loadedRef.current = false
    setExpenses([])
  }, [])

  const addExpense = useCallback(async (expenseData: any, isRecurring: boolean = false) => {
    if (!userId) throw new Error("User not authenticated")

    // Optimistic UI
    const tempExpense: Expense = {
      id: `temp-${Date.now()}`,
      name: expenseData.name,
      amount: expenseData.amount,
      categoryId: expenseData.categoryId,
      paidBy: expenseData.paidBy,
      isShared: expenseData.isShared,
      logoUrl: expenseData.logoUrl,
      description: expenseData.description,
      expenseDate: expenseData.expenseDate,
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    setExpenses(prev => [tempExpense, ...prev])

    try {
      const createdExpenses = await createExpense(expenseData, userId, householdId, isRecurring)
      
      if (createdExpenses && createdExpenses.length > 0) {
        setExpenses(prev => {
          const withoutTemp = prev.filter(e => !e.id.startsWith('temp-'))
          const newExpenses: Expense[] = createdExpenses.map((exp: any) => ({
            id: exp.id,
            name: exp.name,
            amount: exp.amount,
            categoryId: exp.category_id,
            paidBy: exp.paid_by,
            isShared: exp.is_shared,
            logoUrl: exp.logo_url,
            description: exp.description || null,
            expenseDate: new Date(exp.expense_date),
            createdAt: new Date(exp.created_at),
            updatedAt: new Date(exp.updated_at || exp.created_at),
            user_id: exp.user_id,
            household_id: exp.household_id,
          }))
          return [...newExpenses, ...withoutTemp]
        })
      }
    } catch (error: any) {
      // Rollback on error
      setExpenses(prev => prev.filter(e => !e.id.startsWith('temp-')))
      throw error
    }
  }, [userId, householdId])

  const removeExpense = useCallback(async (id: string) => {
    // Optimistic UI
    setExpenses(prev => prev.filter(e => e.id !== id))
    
    try {
      await deleteExpense(id)
    } catch (error: any) {
      // Reload on error
      if (userId) {
        loadedRef.current = false
        await loadExpenses(true)
      }
      throw error
    }
  }, [userId, loadExpenses])


  return {
    expenses,
    loading,
    loadExpenses,
    addExpense,
    removeExpense,
    setExpenses,
    reset
  }
}
