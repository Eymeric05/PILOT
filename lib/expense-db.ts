import { apiFetch } from "./api"
import { Expense } from "@/types"

export async function fetchExpenses(userId: string, householdId?: string | null): Promise<Expense[]> {
  try {
    const params = new URLSearchParams({ userId })
    if (householdId) params.set("householdId", householdId)
    const res = await apiFetch<{ data: any[] }>(`/api/expenses?${params.toString()}`)
    const data = res?.data || []

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
      updatedAt: new Date(exp.created_at),
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
    const res = await apiFetch<{ data: any[] }>("/api/expenses", {
      method: "POST",
      body: JSON.stringify({ expense, userId, householdId: householdId ?? null, isRecurring }),
    })
    return res?.data || []
  } catch (error: any) {
    console.error("Network error creating expense:", error)
    // Propager l'erreur pour que le composant puisse la gérer
    throw error
  }
}

export async function deleteExpense(id: string) {
  try {
    await apiFetch<{ ok: true }>(`/api/expenses?id=${encodeURIComponent(id)}`, { method: "DELETE" })
  } catch (error: any) {
    console.error("Network error deleting expense:", error)
    throw error
  }
}