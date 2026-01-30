/**
 * Upload d'avatars vers Supabase Storage.
 * Utilise la service role key pour créer le bucket si besoin et uploader.
 * Les URLs publiques sont stockées dans user_metadata (pas de base64).
 */

import { createClient } from "@supabase/supabase-js"
import { getSupabaseEnv } from "@/lib/supabase-env"

const BUCKET = "avatars"

function getAdminClient() {
  const { supabaseUrl, serviceRoleKey } = getSupabaseEnv()
  if (!serviceRoleKey) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY est requis pour les photos de profil. Ajoute-la dans tes variables d'environnement (Supabase Dashboard > Project Settings > API)."
    )
  }
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

/** Extrait le buffer et le type MIME d'une data URL (data:image/png;base64,...). */
function parseDataUrl(dataUrl: string): { buffer: Buffer; contentType: string } {
  const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/)
  if (!match) throw new Error("Format data URL invalide")
  const contentType = match[1].trim()
  const base64 = match[2]
  const buffer = Buffer.from(base64, "base64")
  return { buffer, contentType }
}

/**
 * Upload une image (data URL base64) vers Storage et retourne l'URL publique.
 * path = {userId}/profile.png ou {userId}/partner.png
 */
export async function uploadAvatar(
  dataUrl: string,
  userId: string,
  type: "profile" | "partner"
): Promise<string> {
  const { buffer, contentType } = parseDataUrl(dataUrl)
  const ext = contentType.includes("png") ? "png" : contentType.includes("webp") ? "webp" : "jpg"
  const path = `${userId}/${type}.${ext}`

  const supabase = getAdminClient()

  const { data: buckets } = await supabase.storage.listBuckets()
  if (!buckets?.some((b) => b.name === BUCKET)) {
    await supabase.storage.createBucket(BUCKET, { public: true })
  }

  const { error } = await supabase.storage.from(BUCKET).upload(path, buffer, {
    contentType: contentType || "image/png",
    upsert: true,
  })
  if (error) throw new Error(error.message)

  const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(path)
  return urlData.publicUrl
}
