"use client"

import Link from "next/link"

export default function ErrorPage() {
  return (
    <div className="flex flex-col items-start gap-4 py-8">
      <p className="text-error">Something went wrong. Try again in a minute.</p>
      <Link href="/" className="underline">
        Go to the job list
      </Link>
    </div>
  )
}
