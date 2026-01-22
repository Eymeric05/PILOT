import { supabase } from "./supabase"
import { Expense } from "@/types"

export async function fetchExpenses(userId: string, householdId?: string | null): Promise<Expense[]> {
  try {
    let query = supabase.from("expenses").select("*")
    if (householdId) {
      query = query.or(`user_id.eq.${userId},household_id.eq.${householdId}`)
    } else {
      query = query.eq("user_id", userId)
    }
    const { data, error } = await query.order("expense_date", { ascending: false })
    
    if (error) {
      console.error("Error fetching expenses:", error)
      return []
    }

    return (data || []).map((exp: any) => ({
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
      user_id: exp.user_id,
      household_id: exp.household_id,
    })) as Expense[]
  } catch (error: any) {
    console.error("Network error fetching expenses:", error)
    // Ne pas faire crasher l'app, retourner un tableau vide
    return []
  }
}

export async function createExpense(expense: any, userId: string, householdId?: string | null, isRecurring: boolean = false) {
  try {
    const expensesToInsert = []
    const count = isRecurring ? 12 : 1
    for (let i = 0; i < count; i++) {
      const d = new Date(expense.expenseDate)
      d.setMonth(d.getMonth() + i)
      expensesToInsert.push({
        name: expense.name,
        amount: expense.amount,
        category_id: expense.categoryId,
        paid_by: expense.paidBy,
        is_shared: expense.isShared,
        logo_url: expense.logoUrl,
        description: expense.description || null,
        expense_date: d.toISOString(),
        user_id: userId,
        household_id: householdId,
      })
    }
    const { data, error } = await supabase.from("expenses").insert(expensesToInsert).select()
    if (error) {
      console.error("Error creating expense:", error)
      throw error
    }
    return data
  } catch (error: any) {
    console.error("Network error creating expense:", error)
    // Propager l'erreur pour que le composant puisse la gérer
    throw error
  }
}

export async function deleteExpense(id: string) {
  try {
    const { error } = await supabase.from("expenses").delete().eq("id", id)
    if (error) {
      console.error("Error deleting expense:", error)
      throw error
    }
  } catch (error: any) {
    console.error("Network error deleting expense:", error)
    throw error
  }
}