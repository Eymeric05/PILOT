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

  query = query.order("date", { ascending: false })

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
    description: expense.description || null,
    expenseDate: new Date(expense.date || expense.expense_date),
    createdAt: new Date(expense.created_at),
    updatedAt: new Date(expense.updated_at),
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

  if (isRecurring) {
    // Créer 12 dépenses (une par mois)
    for (let i = 0; i < 12; i++) {
      const expenseDate = new Date(expense.expenseDate)
      expenseDate.setMonth(expenseDate.getMonth() + i)

      expensesToInsert.push({
        name: expense.name,
        amount: expense.amount,
        category_id: expense.categoryId,
        paid_by: expense.paidBy,
        is_shared: expense.isShared,
        logo_url: expense.logoUrl,
        date: expenseDate.toISOString(),
        user_id: userId,
        household_id: householdId,
      })
    }
  } else {
    // Créer une seule dépense
    expensesToInsert.push({
      name: expense.name,
      amount: expense.amount,
      category_id: expense.categoryId,
      paid_by: expense.paidBy,
      is_shared: expense.isShared,
      logo_url: expense.logoUrl,
      date: expense.expenseDate.toISOString(),
      user_id: userId,
      household_id: householdId,
    })
  }

  const { data, error } = await supabase
    .from("expenses")
    .insert(expensesToInsert)
    .select()

  if (error) {
    // Log détaillé de l'erreur Supabase complète
    console.error("Error creating expense - Full error object:", error)
    console.error("Error message:", error.message)
    console.error("Error details:", error.details)
    console.error("Error hint:", error.hint)
    console.error("Error code:", error.code)
    console.error("Full error JSON:", JSON.stringify(error, null, 2))
    throw error
  }

  // Convertir les données de la base vers le format Expense
  return (data || []).map((exp: any) => ({
    id: exp.id,
    name: exp.name,
    amount: exp.amount,
    categoryId: exp.category_id,
    paidBy: exp.paid_by,
    isShared: exp.is_shared,
    logoUrl: exp.logo_url,
    description: exp.description || null,
    expenseDate: new Date(exp.date || exp.expense_date),
    createdAt: new Date(exp.created_at),
    updatedAt: new Date(exp.updated_at),
    user_id: exp.user_id,
    household_id: exp.household_id,
  })) as Expense[]
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
    { name: "Alimentation", icon: "🛒" },
    { name: "Logement", icon: "🏠" },
    { name: "Transport", icon: "🚗" },
    { name: "Loisirs", icon: "🎉" },
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
