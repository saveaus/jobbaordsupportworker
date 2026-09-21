/**
 * Plain formatting only: headings and bullets. Everything else is
 * escaped text. Matches the job-page brief.
 */
export function renderDescription(markdown: string): string {
  const escaped = markdown
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")

  const lines = escaped.replace(/\r\n/g, "\n").split("\n")
  const html: string[] = []
  let inList = false

  function closeList() {
    if (inList) {
      html.push("</ul>")
      inList = false
    }
  }

  for (const line of lines) {
    const trimmed = line.trim()
    if (trimmed.startsWith("## ")) {
      closeList()
      html.push(`<h2 class="mt-8 mb-4 text-h2">${trimmed.slice(3)}</h2>`)
      continue
    }
    if (trimmed.startsWith("# ")) {
      closeList()
      html.push(`<h2 class="mt-8 mb-4 text-h2">${trimmed.slice(2)}</h2>`)
      continue
    }
    if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
      if (!inList) {
        html.push('<ul class="flex flex-col gap-2">')
        inList = true
      }
      html.push(`<li class="pl-4">- ${trimmed.slice(2)}</li>`)
      continue
    }
    closeList()
    if (trimmed === "") html.push("")
    else html.push(`<p class="max-w-prose">${trimmed}</p>`)
  }
  closeList()
  return html.filter(Boolean).join("\n")
}
