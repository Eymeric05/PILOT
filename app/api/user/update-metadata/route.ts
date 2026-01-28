import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { getSupabaseEnv } from "@/lib/supabase-env"

export const runtime = "nodejs"

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null)

    if (!body || !body.metadata || !body.accessToken) {
      return NextResponse.json({ error: "Missing metadata or accessToken" }, { status: 400 })
    }

    const { supabaseUrl, supabaseKey } = getSupabaseEnv()
    
    // Créer un client avec le token de l'utilisateur
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: {
        headers: {
          Authorization: `Bearer ${body.accessToken}`,
        },
      },
    })

    const { error } = await supabase.auth.updateUser({
      data: body.metadata,
    })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Internal server error" }, { status: 500 })
  }
}
