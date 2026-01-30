function normalizeEnv(value: string | undefined): string | null {
  if (!value) return null
  const trimmed = value.trim()
  if (!trimmed) return null
  // Support values copied with surrounding quotes in hosting providers
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    const unquoted = trimmed.slice(1, -1).trim()
    return unquoted || null
  }
  return trimmed
}

export function getSupabaseEnv() {
  const supabaseUrl =
    normalizeEnv(process.env.NEXT_PUBLIC_SUPABASE_URL) ??
    normalizeEnv(process.env.NEXT_PUBLIC_SUPABASE_PROJECT_URL)

  // Supabase provides "publishable" keys (sb_publishable_...) in addition to legacy anon keys.
  // Accept both to avoid mismatches between env naming and code.
  const supabaseKey =
    normalizeEnv(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) ??
    normalizeEnv(process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY) ??
    normalizeEnv(process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY)

  if (!supabaseUrl || !supabaseKey) {
    throw new Error(
      "Missing Supabase environment variables. Please set NEXT_PUBLIC_SUPABASE_URL and either NEXT_PUBLIC_SUPABASE_ANON_KEY or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY."
    )
  }

  // Validate URL early to avoid opaque "Failed to fetch"
  try {
    // eslint-disable-next-line no-new
    new URL(supabaseUrl)
  } catch {
    throw new Error(
      `Invalid NEXT_PUBLIC_SUPABASE_URL value. Expected a full URL like "https://xyzcompany.supabase.co" but got "${supabaseUrl}".`
    )
  }

  const serviceRoleKey =
    normalizeEnv(process.env.SUPABASE_SERVICE_ROLE_KEY) ??
    normalizeEnv(process.env.SUPABASE_SERVICE_ROLE_KEY_SECRET)

  return { supabaseUrl, supabaseKey, serviceRoleKey: serviceRoleKey ?? undefined }
}

