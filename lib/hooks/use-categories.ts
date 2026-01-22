import { useState, useEffect, useRef } from "react"
import { fetchCategories } from "@/lib/services/category-service"
import { Category } from "@/types"

export function useCategories() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const loadedRef = useRef(false)

  useEffect(() => {
    if (loadedRef.current) return
    
    const load = async () => {
      loadedRef.current = true
      setLoading(true)
      try {
        const data = await fetchCategories()
        // Filtrer les catégories invalides avant de les définir
        const validData = (data || []).filter(cat => cat && cat.id && cat.id !== '' && cat.id !== 'default')
        setCategories(validData.length > 0 ? validData : data || [])
      } catch (error: any) {
        console.error("Error loading categories:", error)
        // Ne pas faire crasher, définir un tableau vide ou une catégorie par défaut
        setCategories([])
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [])

  const reset = () => {
    loadedRef.current = false
    setCategories([])
  }

  return { categories, loading, setCategories, reset }
}
