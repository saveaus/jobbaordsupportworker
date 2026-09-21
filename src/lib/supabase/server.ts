import { cookies } from "next/headers"
import { createServerClient } from "@supabase/ssr"
import { isSupabaseConfigured, supabaseAnonKey, supabaseUrl } from "@/lib/supabase/config"

export { isSupabaseConfigured }

/**
 * Request-scoped Supabase client using the caller's session, so RLS
 * applies. Use this for all reads and writes except webhooks, cron and
 * admin actions (those use the service client).
 */
export async function createSupabaseServerClient() {
  const cookieStore = await cookies()
  if (!isSupabaseConfigured())
    throw new Error("Supabase environment variables are not set.")

  return createServerClient(
    supabaseUrl(),
    supabaseAnonKey(),
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            for (const { name, value, options } of cookiesToSet)
              cookieStore.set(name, value, options)
          } catch (error) {
            if (
              error instanceof Error &&
              error.message.includes("Cookies can only be modified")
            )
              return
            throw error
          }
        },
      },
    }
  )
}

export async function getSessionUser() {
  if (!isSupabaseConfigured()) return null
  try {
    const supabase = await createSupabaseServerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    return user
  } catch {
    return null
  }
}
