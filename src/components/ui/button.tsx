import type { ButtonHTMLAttributes } from "react"
import Link from "next/link"

const baseClasses =
  "inline-flex h-11 min-w-11 items-center justify-center gap-2 rounded-sm px-4 text-base font-semibold whitespace-nowrap cursor-pointer disabled:cursor-default"

const variantClasses = {
  primary:
    "bg-night text-paper hover:underline disabled:bg-muted disabled:no-underline",
  secondary:
    "border border-ink bg-paper text-ink hover:bg-panel disabled:border-line disabled:text-muted disabled:bg-paper",
} as const

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: keyof typeof variantClasses
}

export function Button({ variant = "primary", className, ...props }: ButtonProps) {
  return (
    <button
      className={`${baseClasses} ${variantClasses[variant]} ${className ?? ""}`.trim()}
      suppressHydrationWarning
      {...props}
    />
  )
}

interface ButtonLinkProps {
  href: string
  variant?: keyof typeof variantClasses
  className?: string
  children: React.ReactNode
}

export function ButtonLink({ href, variant = "primary", className, children }: ButtonLinkProps) {
  return (
    <Link href={href} className={`${baseClasses} ${variantClasses[variant]} ${className ?? ""}`}>
      {children}
    </Link>
  )
}
