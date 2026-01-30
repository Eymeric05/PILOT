import { NextResponse } from "next/server"
import { getSupabaseEnv } from "@/lib/supabase-env"
import { uploadAvatar } from "@/lib/avatar-storage"

export const runtime = "nodejs"

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null)
    if (!body?.accessToken || !body?.image || body?.type === undefined) {
      return NextResponse.json(
        { error: "Missing accessToken, image (base64), or type (user|partner)" },
        { status: 400 }
      )
    }

    const { supabaseUrl, supabaseKey } = getSupabaseEnv()
    const accessToken = body.accessToken as string
    const image = body.image as string
    const type = body.type as "user" | "partner"

    if (type !== "user" && type !== "partner") {
      return NextResponse.json({ error: "type must be user or partner" }, { status: 400 })
    }
    if (typeof image !== "string" || !image.startsWith("data:image")) {
      return NextResponse.json({ error: "image must be a data URL (base64 image)" }, { status: 400 })
    }

    const getRes = await fetch(`${supabaseUrl}/auth/v1/user`, {
      method: "GET",
      headers: { Authorization: `Bearer ${accessToken}`, apikey: supabaseKey },
    })
    const getJson = (await getRes.json().catch(() => ({}))) as { id?: string }
    if (!getRes.ok || !getJson?.id) {
      return NextResponse.json(
        { error: (getJson as { msg?: string }).msg ?? "Session invalide ou expirée" },
        { status: 401 }
      )
    }

    const url = await uploadAvatar(image, getJson.id, type === "user" ? "profile" : "partner")
    return NextResponse.json({ url }, { status: 200 })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Erreur lors de l'upload"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
