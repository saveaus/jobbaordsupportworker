import { NextResponse, type NextRequest } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { isSupabaseConfigured, supabaseAnonKey, supabaseUrl } from "@/lib/supabase/config"

/**
 * Session refresh (Next 16 proxy, formerly middleware). Keeps Supabase
 * auth cookies current on every request.
 */
export default async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request })

  if (!isSupabaseConfigured()) return response

  const supabase = createServerClient(
    supabaseUrl(),
    supabaseAnonKey(),
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          for (const { name, value } of cookiesToSet)
            request.cookies.set(name, value)
          response = NextResponse.next({ request })
          for (const { name, value, options } of cookiesToSet)
            response.cookies.set(name, value, options)
        },
      },
    }
  )

  try {
    await supabase.auth.getUser()
  } catch {
    return response
  }
  return response
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|icon.svg|api/stripe|api/cron|auth/confirm|auth/callback|.*\\.(?:png|jpg|svg|webp)$).*)",
  ],
}
