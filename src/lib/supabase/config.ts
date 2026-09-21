/**
 * True only when the env looks like a real Supabase project, not an
 * empty or placeholder .env.local. Placeholder values would otherwise
 * make every page try (and fail) to fetch localhost:54321.
 */
export function isSupabaseConfigured() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ""
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ""
  if (!url || !key) return false
  if (key.length < 40) return false
  if (/placeholder|changeme|your-project|example\.com/i.test(`${url} ${key}`))
    return false
  try {
    new URL(url)
  } catch {
    return false
  }
  return true
}
