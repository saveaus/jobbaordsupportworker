import Link from "next/link"

/**
 * Footer per the brief: Privacy, Terms, Contact. Nothing else.
 */
export function SiteFooter() {
  return (
    <footer className="border-t border-line">
      <nav
        className="mx-auto flex w-full max-w-page items-center gap-6 px-6 py-8 text-sm md:px-12"
        aria-label="Footer"
      >
        <Link href="/privacy" className="inline-flex min-h-11 items-center underline">
          Privacy
        </Link>
        <Link href="/terms" className="inline-flex min-h-11 items-center underline">
          Terms
        </Link>
        <Link href="/contact" className="inline-flex min-h-11 items-center underline">
          Contact
        </Link>
      </nav>
    </footer>
  )
}
