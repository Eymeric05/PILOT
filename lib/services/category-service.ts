import { apiFetch } from "@/lib/api"
import { Category } from "@/types"

const DEFAULT_CATEGORY_SEED = { name: "Divers", icon: "📦" }

export async function fetchCategories(): Promise<Category[]> {
  const mapRow = (c: any): Category => ({
    id: c.id,
    name: c.name,
    icon: c.icon ?? null,
    createdAt: new Date(c.created_at),
  })

  const res = await apiFetch<{ data: any[] }>("/api/categories")
  const data = res?.data || []
  return data.filter((c) => c?.id).map(mapRow)
}
