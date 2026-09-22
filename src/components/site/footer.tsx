import Link from "next/link"

export function SiteFooter() {
  return (
    <footer className="border-t border-line">
      <div className="mx-auto flex w-full max-w-page flex-wrap items-center justify-between gap-x-8 gap-y-2 px-6 py-8 md:px-12">
        <nav className="flex items-center gap-6 text-sm" aria-label="Site">
          <Link href="/" className="inline-flex min-h-11 items-center hover:underline">
            Jobs
          </Link>
          <Link href="/providers" className="inline-flex min-h-11 items-center hover:underline">
            Hire
          </Link>
        </nav>
        <nav className="flex items-center gap-6 text-sm" aria-label="Legal">
          <Link href="/privacy" className="inline-flex min-h-11 items-center hover:underline">
            Privacy
          </Link>
          <Link href="/terms" className="inline-flex min-h-11 items-center hover:underline">
            Terms
          </Link>
          <Link href="/contact" className="inline-flex min-h-11 items-center hover:underline">
            Contact
          </Link>
        </nav>
      </div>
    </footer>
  )
}
