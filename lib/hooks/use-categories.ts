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
        // #region agent log (hypothesis C)
        fetch('http://127.0.0.1:7242/ingest/be811f15-89d2-4f9f-b032-887ed6b81c01',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId:'debug-session',runId:'pre-fix',hypothesisId:'C',location:'lib/hooks/use-categories.ts:load:entry',message:'useCategories load start',data:{loadedRef:loadedRef.current},timestamp:Date.now()})}).catch(()=>{});
        // #endregion agent log

        const data = await fetchCategories()
        // Filtrer les catégories invalides avant de les définir
        const validData = (data || []).filter(cat => cat && cat.id && cat.id !== '' && cat.id !== 'default')
        setCategories(validData.length > 0 ? validData : data || [])

        // #region agent log (hypothesis B/C)
        fetch('http://127.0.0.1:7242/ingest/be811f15-89d2-4f9f-b032-887ed6b81c01',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId:'debug-session',runId:'pre-fix',hypothesisId:'B',location:'lib/hooks/use-categories.ts:load:result',message:'useCategories loaded',data:{rawLen:(data||[]).length,validLen:validData.length,rawIds:(data||[]).slice(0,5).map(c=>c?.id ?? null),validIds:validData.slice(0,5).map(c=>c?.id ?? null)},timestamp:Date.now()})}).catch(()=>{});
        // #endregion agent log
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
