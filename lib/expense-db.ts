import { supabase } from "./supabase"
import { Expense, Category } from "@/types"

export async function fetchExpenses(userId: string, householdId?: string | null) {
  let query = supabase
    .from("expenses")
    .select("*")

  if (householdId) {
    query = query.or(`user_id.eq.${userId},household_id.eq.${householdId}`)
  } else {
    query = query.eq("user_id", userId)
  }

  // Utilisation de la colonne correcte pour le tri
  query = query.order("expense_date", { ascending: false })

  const { data, error } = await query

  if (error) {
    console.error("Error fetching expenses:", error)
    return []
  }

  return (data || []).map((expense: any) => ({
    id: expense.id,
    name: expense.name,
    amount: expense.amount,
    categoryId: expense.category_id,
    paidBy: expense.paid_by,
    isShared: expense.is_shared,
    logoUrl: expense.logo_url,
    description: expense.description || null,
    expenseDate: new Date(expense.expense_date),
    createdAt: new Date(expense.created_at),
    updatedAt: new Date(expense.updated_at || expense.created_at),
    user_id: expense.user_id,
    household_id: expense.household_id,
  })) as Expense[]
}

export async function createExpense(
  expense: Omit<Expense, "id" | "createdAt" | "updatedAt">,
  userId: string,
  householdId?: string | null,
  isRecurring: boolean = false
): Promise<Expense[]> {
  const expensesToInsert: any[] = []

  // Logique de récurrence sur 12 mois
  const count = isRecurring ? 12 : 1;
  
  for (let i = 0; i < count; i++) {
    const expenseDate = new Date(expense.expenseDate)
    expenseDate.setMonth(expenseDate.getMonth() + i)

    expensesToInsert.push({
      name: expense.name,
      amount: expense.amount,
      category_id: expense.categoryId,
      paid_by: expense.paidBy, // Correspond à ta table SQL
      is_shared: expense.isShared,
      logo_url: expense.logoUrl,
      expense_date: expenseDate.toISOString(), // Correspond à ta table SQL
      user_id: userId,
      household_id: householdId,
    })
  }

  const { data, error } = await supabase
    .from("expenses")
    .insert(expensesToInsert)
    .select()

  if (error) {
    console.error("Erreur détaillée Supabase:", JSON.stringify(error, null, 2))
    throw error
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
    updatedAt: new Date(exp.updated_at || exp.created_at),
    user_id: exp.user_id,
    household_id: exp.household_id,
  })) as Expense[]
}

export async function deleteExpense(expenseId: string) {
  const { error } = await supabase
    .from("expenses")
    .delete()
    .eq("id", expenseId)

  if (error) throw error
}

export async function fetchCategories(): Promise<Category[]> {
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .order("name", { ascending: true })

  if (error || !data || data.length === 0) {
    return await createDefaultCategories()
  }

  return data.map((cat: any) => ({
    id: cat.id,
    name: cat.name,
    icon: cat.icon,
    createdAt: new Date(cat.created_at),
  }))
}

async function createDefaultCategories(): Promise<Category[]> {
  const defaultCategories = [
    { name: "Alimentation", icon: "🛒" },
    { name: "Logement", icon: "🏠" },
    { name: "Transport", icon: "🚗" },
    { name: "Loisirs", icon: "🎉" },
  ]

  const { data, error } = await supabase
    .from("categories")
    .insert(defaultCategories)
    .select()

  if (error || !data) {
    return defaultCategories.map((cat, i) => ({
      id: `temp-${i}`,
      ...cat,
      createdAt: new Date()
    }))
  }

  return data.map((cat: any) => ({
    id: cat.id,
    name: cat.name,
    icon: cat.icon,
    createdAt: new Date(cat.created_at),
  }))
}