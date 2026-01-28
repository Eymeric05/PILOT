import { supabase } from "@/lib/supabase"
import { Category } from "@/types"

const DEFAULT_CATEGORY_SEED = { name: "Divers", icon: "📦" }

export async function fetchCategories(): Promise<Category[]> {
  const mapRow = (c: any): Category => ({
    id: c.id,
    name: c.name,
    icon: c.icon ?? null,
    createdAt: new Date(c.created_at),
  })

  const { data, error } = await supabase.from("categories").select("*").order("created_at", { ascending: true })

  if (error) {
    console.error("Error fetching categories:", error)
    throw error
  }

  if (data && data.length > 0) {
    return data.filter((c) => c?.id).map(mapRow)
  }

  // If the table is empty, seed a default category (real UUID from DB)
  const { data: inserted, error: insertError } = await supabase
    .from("categories")
    .insert(DEFAULT_CATEGORY_SEED)
    .select()

  if (insertError) {
    console.error("Error seeding default category:", insertError)
    throw insertError
  }

  return (inserted || []).filter((c) => c?.id).map(mapRow)
}
