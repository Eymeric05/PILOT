import { supabase } from "./supabase"
import { Expense, Category } from "@/types"

export async function fetchExpenses(userId: string, householdId?: string | null) {
  let query = supabase
    .from("expenses")
    .select("*")

  // Filtrer par user_id ou household_id
  if (householdId) {
    query = query.or(`user_id.eq.${userId},household_id.eq.${householdId}`)
  } else {
    query = query.eq("user_id", userId)
  }

  query = query.order("expense_date", { ascending: false })

  const { data, error } = await query

  if (error) {
    console.error("Error fetching expenses:", error)
    return []
  }

  // Convertir les données de la base vers le format Expense
  return (data || []).map((expense: any) => ({
    id: expense.id,
    name: expense.name,
    amount: expense.amount,
    categoryId: expense.category_id,
    paidBy: expense.paid_by,
    isShared: expense.is_shared,
    logoUrl: expense.logo_url,
    description: expense.description,
    expenseDate: new Date(expense.expense_date),
    createdAt: new Date(expense.created_at),
    updatedAt: new Date(expense.updated_at),
    user_id: expense.user_id,
    household_id: expense.household_id,
  })) as Expense[]
}

export async function createExpense(
  expense: Omit<Expense, "id" | "createdAt" | "updatedAt">,
  userId: string,
  householdId?: string | null
) {
  const { data, error } = await supabase
    .from("expenses")
    .insert({
      name: expense.name,
      amount: expense.amount,
      category_id: expense.categoryId,
      paid_by: expense.paidBy,
      is_shared: expense.isShared,
      logo_url: expense.logoUrl,
      description: expense.description,
      expense_date: expense.expenseDate.toISOString(),
      user_id: userId,
      household_id: householdId,
    })
    .select()
    .single()

  if (error) {
    console.error("Error creating expense:", error)
    console.log("Error details:", JSON.stringify(error, null, 2))
    alert(`Erreur lors de l'ajout de la dépense: ${error.message}`)
    throw error
  }

  // Convertir les données de la base vers le format Expense
  return {
    id: data.id,
    name: data.name,
    amount: data.amount,
    categoryId: data.category_id,
    paidBy: data.paid_by,
    isShared: data.is_shared,
    logoUrl: data.logo_url,
    description: data.description,
    expenseDate: new Date(data.expense_date),
    createdAt: new Date(data.created_at),
    updatedAt: new Date(data.updated_at),
    user_id: data.user_id,
    household_id: data.household_id,
  } as Expense
}

export async function deleteExpense(expenseId: string) {
  const { error } = await supabase
    .from("expenses")
    .delete()
    .eq("id", expenseId)

  if (error) {
    console.error("Error deleting expense:", error)
    throw error
  }
}

export async function fetchCategories(): Promise<Category[]> {
  try {
    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .order("name", { ascending: true })

    if (error) {
      console.error("Error fetching categories:", error)
      // Si la table n'existe pas ou est vide, créer les catégories par défaut
      return await createDefaultCategories()
    }

    if (!data || data.length === 0) {
      return await createDefaultCategories()
    }

    // Convertir les données de la base vers le format Category
    return data.map((category: any) => ({
      id: category.id,
      name: category.name,
      icon: category.icon,
      createdAt: new Date(category.created_at),
    })) as Category[]
  } catch (error) {
    console.error("Error fetching categories:", error)
    return await createDefaultCategories()
  }
}

async function createDefaultCategories(): Promise<Category[]> {
  const defaultCategories = [
    { name: "Logement", icon: "🏠" },
    { name: "Alimentation", icon: "🍔" },
    { name: "Transport", icon: "🚗" },
    { name: "Santé", icon: "💊" },
  ]

  try {
    const { data, error } = await supabase
      .from("categories")
      .insert(defaultCategories)
      .select()

    if (error) {
      console.error("Error creating default categories:", error)
      // Si l'insertion échoue, retourner les catégories par défaut en mémoire
      return defaultCategories.map((cat, index) => ({
        id: `default-${index}`,
        name: cat.name,
        icon: cat.icon,
        createdAt: new Date(),
      })) as Category[]
    }

    return (data || []).map((category: any) => ({
      id: category.id,
      name: category.name,
      icon: category.icon,
      createdAt: new Date(category.created_at),
    })) as Category[]
  } catch (error) {
    console.error("Error creating default categories:", error)
    // Retourner les catégories par défaut en mémoire si l'insertion échoue
    return defaultCategories.map((cat, index) => ({
      id: `default-${index}`,
      name: cat.name,
      icon: cat.icon,
      createdAt: new Date(),
    })) as Category[]
  }
}
