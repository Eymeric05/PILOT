import { NextResponse } from "next/server"
import { getSupabaseEnv } from "@/lib/supabase-env"
import { uploadAvatar } from "@/lib/avatar-storage"

export const runtime = "nodejs"

const PICTURE_KEYS = ["profile_picture_url", "partner_profile_picture_url"] as const
const TYPE_MAP: Record<string, "profile" | "partner"> = {
  profile_picture_url: "profile",
  partner_profile_picture_url: "partner",
}

/** Remplace les data URLs par des URLs Storage (upload) pour rester sous la limite Supabase. */
async function ensureUrlsOnly(
  merged: Record<string, unknown>,
  userId: string
): Promise<Record<string, unknown>> {
  const out = { ...merged }
  try {
    for (const key of PICTURE_KEYS) {
      const v = out[key]
      if (typeof v === "string" && v.startsWith("data:")) {
        const url = await uploadAvatar(v, userId, TYPE_MAP[key] ?? "profile")
        out[key] = url
      }
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    if (msg.includes("SERVICE_ROLE") || msg.includes("service role")) {
      throw e
    }
    for (const key of PICTURE_KEYS) {
      if (typeof out[key] === "string" && (out[key] as string).startsWith("data:")) {
        out[key] = null
      }
    }
  }
  return out
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null)

    if (!body || !body.metadata || !body.accessToken) {
      return NextResponse.json({ error: "Missing metadata or accessToken" }, { status: 400 })
    }

    const { supabaseUrl, supabaseKey } = getSupabaseEnv()
    const accessToken = body.accessToken as string
    const metadata = body.metadata as Record<string, unknown>

    const headers = {
      Authorization: `Bearer ${accessToken}`,
      apikey: supabaseKey,
      "Content-Type": "application/json",
    }

    const getRes = await fetch(`${supabaseUrl}/auth/v1/user`, {
      method: "GET",
      headers: { Authorization: `Bearer ${accessToken}`, apikey: supabaseKey },
    })
    const getJson = (await getRes.json().catch(() => ({}))) as {
      id?: string
      user_metadata?: Record<string, unknown>
      msg?: string
      error_description?: string
    }
    if (!getRes.ok) {
      const msg = getJson?.msg ?? getJson?.error_description ?? "Session invalide ou expirée"
      return NextResponse.json(
        { error: typeof msg === "string" ? msg : "Session invalide ou expirée" },
        { status: getRes.status === 401 ? 401 : 500 }
      )
    }
    const existing =
      getJson?.user_metadata && typeof getJson.user_metadata === "object"
        ? getJson.user_metadata
        : {}
    const userId = getJson?.id ?? ""

    const merged: Record<string, unknown> = { ...existing, ...metadata }
    const toSend = await ensureUrlsOnly(merged, userId)

    const res = await fetch(`${supabaseUrl}/auth/v1/user`, {
      method: "PUT",
      headers,
      body: JSON.stringify({ user_metadata: toSend }),
    })

    const json = (await res.json().catch(() => ({}))) as Record<string, unknown>
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
