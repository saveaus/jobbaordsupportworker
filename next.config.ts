import { readFileSync } from "node:fs"
import { resolve } from "node:path"
import type { NextConfig } from "next"

function loadCommittedPublicEnv() {
  const path = resolve(process.cwd(), ".env.production")
  try {
    for (const line of readFileSync(path, "utf8").split("\n")) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith("#")) continue
      const separator = trimmed.indexOf("=")
      if (separator < 1) continue
      const key = trimmed.slice(0, separator)
      const value = trimmed.slice(separator + 1)
      if (!key.startsWith("NEXT_PUBLIC_")) continue
      if (!process.env[key]) process.env[key] = value
    }
  } catch {
    // Local workflows can rely on .env.local instead.
  }
}

loadCommittedPublicEnv()

const nextConfig: NextConfig = {
  agentRules: false,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
}

export default nextConfig
