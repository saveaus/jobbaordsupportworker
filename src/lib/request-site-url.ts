import { headers } from "next/headers"
import { resolveSiteUrl } from "@/lib/site-url"

function isLocalHost(hostname: string) {
  return hostname === "localhost" || hostname === "127.0.0.1"
}

/** Origin of the current request, falling back to the resolved site URL. */
export async function getRequestSiteUrl() {
  const headerStore = await headers()
  const host = headerStore.get("x-forwarded-host") ?? headerStore.get("host")
  if (!host || isLocalHost(host.split(":")[0] ?? host))
    return resolveSiteUrl()
  const proto = headerStore.get("x-forwarded-proto") ?? "https"
  return `${proto}://${host}`
}
