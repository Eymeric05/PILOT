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
      console.error("Error fetching categories:", error)
      return [DEFAULT_CATEGORY]
    }

    if (!data || data.length === 0) {
      // Créer une catégorie par défaut
      try {
        const defaultCategory = { name: "Divers", icon: "📦" }
        const { data: inserted, error: insertError } = await supabase
          .from("categories")
          .insert(defaultCategory)
          .select()
        
        if (insertError) {
          console.error("Error creating default category:", insertError)
          return [DEFAULT_CATEGORY]
        }
        
        if (inserted && inserted.length > 0) {
          return inserted
            .filter(c => c.id && c.id !== '')
            .map(c => ({
              id: c.id,
              name: c.name,
              icon: c.icon,
              createdAt: new Date(c.created_at)
            }))
        }
      } catch (insertErr) {
        console.error("Network error creating default category:", insertErr)
      }
      
      return [DEFAULT_CATEGORY]
    }

    // Filtrer les catégories avec des IDs vides
    return data
      .filter(c => c.id && c.id !== '')
      .map(c => ({
        id: c.id,
        name: c.name,
        icon: c.icon,
        createdAt: new Date(c.created_at)
      }))
  } catch (err: any) {
    console.error("Network error fetching categories:", err)
    // Ne pas faire crasher l'app, retourner une catégorie par défaut
    return [DEFAULT_CATEGORY]
  }
}
