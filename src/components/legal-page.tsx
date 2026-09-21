import { readFileSync } from "node:fs"
import { join } from "node:path"
import { siteConfig } from "@/config/site"
import { renderDescription } from "@/lib/markdown"

export function LegalPage({ file }: { file: "privacy.md" | "terms.md" }) {
  const raw = readFileSync(join(process.cwd(), "content", file), "utf8")
  const html = renderDescription(
    raw
      .replaceAll("{Site name}", siteConfig.name)
      .replaceAll("{contact email}", siteConfig.contactEmail)
  )
  return (
    <article
      className="flex flex-col gap-4"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}
