import { NextResponse, type NextRequest } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { supabaseAnonKey, supabaseUrl } from "@/lib/supabase/config"

interface CookieToSet {
  name: string
  value: string
  options?: Parameters<NextResponse["cookies"]["set"]>[2]
}

export function createSupabaseRouteClient(request: NextRequest) {
  const queued: CookieToSet[] = []
  const supabase = createServerClient(supabaseUrl(), supabaseAnonKey(), {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        queued.splice(0, queued.length, ...cookiesToSet)
      },
    },
  })

  function applyCookies(response: NextResponse) {
    for (const { name, value, options } of queued)
      response.cookies.set(name, value, options)
    return response
  }

  return { supabase, applyCookies }
}
