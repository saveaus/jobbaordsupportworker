import Link from "next/link"

export default function NotFound() {
  return (
    <div className="flex flex-col items-start gap-4 py-8">
      <p>That page doesn&apos;t exist.</p>
      <Link href="/" className="underline">
        Go to the job list
      </Link>
    </div>
  )
}
