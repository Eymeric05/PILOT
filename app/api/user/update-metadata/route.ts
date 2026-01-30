import { NextResponse } from "next/server"
import { getSupabaseEnv } from "@/lib/supabase-env"

export const runtime = "nodejs"

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null)

    if (!body || !body.metadata || !body.accessToken) {
      return NextResponse.json({ error: "Missing metadata or accessToken" }, { status: 400 })
    }

    const { supabaseUrl, supabaseKey } = getSupabaseEnv()
    const accessToken = body.accessToken as string
    const metadata = body.metadata as Record<string, unknown>

    // Appel direct à l'API Auth Supabase depuis le serveur (évite ERR_CONNECTION_CLOSED côté navigateur)
    const res = await fetch(`${supabaseUrl}/auth/v1/user`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        apikey: supabaseKey,
        "Content-Type": "application/json",
        "X-Supabase-Api-Version": "2024-01-01",
      },
      body: JSON.stringify({ data: metadata }),
    })

    const json = await res.json().catch(() => ({}))
    if (!res.ok) {
      return NextResponse.json(
        { error: json.msg || json.error_description || json.message || "Erreur Supabase" },
        { status: res.status >= 400 ? res.status : 500 }
      )
    }

    return NextResponse.json({ success: true, user: json }, { status: 200 })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Internal server error" }, { status: 500 })
  }
}
