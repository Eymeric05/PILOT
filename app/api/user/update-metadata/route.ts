import { NextResponse } from "next/server"
import { getSupabaseEnv } from "@/lib/supabase-env"

/** Limite recommandée pour user_metadata (~4KB pour les cookies JWT). Les images base64 dépassent souvent. */
const USER_METADATA_MAX_BYTES = 4000

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

    const payloadSize = new TextEncoder().encode(JSON.stringify(metadata)).length
    if (payloadSize > USER_METADATA_MAX_BYTES) {
      return NextResponse.json(
        {
          error:
            "Les données du profil (notamment les photos) sont trop volumineuses. Supprimez une photo ou utilisez une image plus petite.",
        },
        { status: 400 }
      )
    }

    // GoTrue attend { user_metadata: ... } pour PUT /auth/v1/user (comme le client supabase-js)
    const res = await fetch(`${supabaseUrl}/auth/v1/user`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        apikey: supabaseKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ user_metadata: metadata }),
    })

    const json = await res.json().catch(() => ({}))
    if (!res.ok) {
      const msg =
        json.msg ?? json.error_description ?? json.message ?? json.error ?? "Erreur Supabase"
      return NextResponse.json(
        { error: typeof msg === "string" ? msg : "Erreur Supabase" },
        { status: res.status >= 400 ? res.status : 500 }
      )
    }

    return NextResponse.json({ success: true, user: json }, { status: 200 })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
