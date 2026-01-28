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
    // #region agent log (hypothesis A/C/D)
    fetch('http://127.0.0.1:7242/ingest/be811f15-89d2-4f9f-b032-887ed6b81c01',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId:'debug-session',runId:'pre-fix',hypothesisId:'A',location:'lib/services/category-service.ts:fetchCategories:entry',message:'fetchCategories start',data:{hasSupabase:!!supabase},timestamp:Date.now()})}).catch(()=>{});
    // #endregion agent log

    const sessionRes = await supabase.auth.getSession()
    const sessionUserId = sessionRes.data?.session?.user?.id ?? null
    // #region agent log (hypothesis C)
    fetch('http://127.0.0.1:7242/ingest/be811f15-89d2-4f9f-b032-887ed6b81c01',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId:'debug-session',runId:'pre-fix',hypothesisId:'C',location:'lib/services/category-service.ts:fetchCategories:session',message:'supabase session status',data:{hasSession:!!sessionRes.data?.session,userIdPresent:!!sessionUserId},timestamp:Date.now()})}).catch(()=>{});
    // #endregion agent log

    const { data, error } = await supabase.from("categories").select("*")
    
    if (error) {
      console.error("Error fetching categories:", error)
      // #region agent log (hypothesis A)
      fetch('http://127.0.0.1:7242/ingest/be811f15-89d2-4f9f-b032-887ed6b81c01',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId:'debug-session',runId:'pre-fix',hypothesisId:'A',location:'lib/services/category-service.ts:fetchCategories:select-error',message:'supabase select categories failed',data:{errorCode:(error as any)?.code ?? null,errorMessage:(error as any)?.message ?? null,details:(error as any)?.details ?? null,hint:(error as any)?.hint ?? null},timestamp:Date.now()})}).catch(()=>{});
      // #endregion agent log
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
          // #region agent log (hypothesis D)
          fetch('http://127.0.0.1:7242/ingest/be811f15-89d2-4f9f-b032-887ed6b81c01',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId:'debug-session',runId:'pre-fix',hypothesisId:'D',location:'lib/services/category-service.ts:fetchCategories:insert-error',message:'supabase insert default category failed',data:{errorCode:(insertError as any)?.code ?? null,errorMessage:(insertError as any)?.message ?? null,details:(insertError as any)?.details ?? null,hint:(insertError as any)?.hint ?? null},timestamp:Date.now()})}).catch(()=>{});
          // #endregion agent log
          return [DEFAULT_CATEGORY]
        }
        
        if (inserted && inserted.length > 0) {
          // #region agent log (hypothesis B)
          fetch('http://127.0.0.1:7242/ingest/be811f15-89d2-4f9f-b032-887ed6b81c01',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId:'debug-session',runId:'pre-fix',hypothesisId:'B',location:'lib/services/category-service.ts:fetchCategories:inserted',message:'default category inserted',data:{insertedLen:inserted.length,hasId:!!(inserted[0] as any)?.id,keys:Object.keys(inserted[0] as any)},timestamp:Date.now()})}).catch(()=>{});
          // #endregion agent log
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
    // #region agent log (hypothesis B)
    fetch('http://127.0.0.1:7242/ingest/be811f15-89d2-4f9f-b032-887ed6b81c01',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId:'debug-session',runId:'pre-fix',hypothesisId:'B',location:'lib/services/category-service.ts:fetchCategories:select-ok',message:'supabase select categories ok',data:{rows:data.length,firstKeys:data[0]?Object.keys(data[0] as any):[],firstId:(data[0] as any)?.id ?? null},timestamp:Date.now()})}).catch(()=>{});
    // #endregion agent log
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
    // #region agent log (hypothesis E)
    fetch('http://127.0.0.1:7242/ingest/be811f15-89d2-4f9f-b032-887ed6b81c01',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId:'debug-session',runId:'pre-fix',hypothesisId:'E',location:'lib/services/category-service.ts:fetchCategories:catch',message:'fetchCategories threw',data:{errorMessage:err?.message ?? String(err)},timestamp:Date.now()})}).catch(()=>{});
    // #endregion agent log
    // Ne pas faire crasher l'app, retourner une catégorie par défaut
    return [DEFAULT_CATEGORY]
  }
}
