import { supabase } from "@/lib/supabase"
import { Category } from "@/types"

const DEFAULT_CATEGORY: Category = {
  id: 'default',
  name: 'Divers',
  icon: '📦',
  createdAt: new Date()
}

export async function fetchCategories(): Promise<Category[]> {
  try {
    const { data, error } = await supabase.from("categories").select("*")
    
    if (error) {
      return [DEFAULT_CATEGORY]
    }

    if (!data || data.length === 0) {
      // Créer une catégorie par défaut
      const defaultCategory = { name: "Divers", icon: "📦" }
      const { data: inserted, error: insertError } = await supabase
        .from("categories")
        .insert(defaultCategory)
        .select()
      
      if (insertError) {
        return [DEFAULT_CATEGORY]
      }
      
      if (inserted && inserted.length > 0) {
        return inserted.map(c => ({
          id: c.id,
          name: c.name,
          icon: c.icon,
          createdAt: new Date(c.created_at)
        }))
      }
      
      return [DEFAULT_CATEGORY]
    }

    return data.map(c => ({
      id: c.id,
      name: c.name,
      icon: c.icon,
      createdAt: new Date(c.created_at)
    }))
  } catch (err) {
    return [DEFAULT_CATEGORY]
  }
}
