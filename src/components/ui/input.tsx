import type {
  InputHTMLAttributes,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react"
import { IconChevronDown } from "./icons"

const fieldClasses =
  "h-11 w-full rounded-sm border border-line bg-paper px-3 text-base text-ink placeholder:text-muted focus:border-ink focus:outline-none disabled:bg-panel disabled:text-muted"

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  hasError?: boolean
}

export function Input({ hasError, className, ...props }: InputProps) {
  return (
    <input
      className={`${fieldClasses} ${hasError ? "border-error" : ""} ${className ?? ""}`.trim()}
      aria-invalid={hasError || undefined}
      suppressHydrationWarning
      {...props}
    />
  )
}

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  hasError?: boolean
}

export function Textarea({ hasError, className, ...props }: TextareaProps) {
  return (
    <textarea
      className={`${fieldClasses} h-auto min-h-11 py-2 ${hasError ? "border-error" : ""} ${className ?? ""}`}
      aria-invalid={hasError || undefined}
      rows={props.rows ?? 6}
      {...props}
    />
  )
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  hasError?: boolean
}

export function Select({ hasError, className, children, ...props }: SelectProps) {
  return (
    <div className="relative">
      <select
        className={`${fieldClasses} appearance-none pr-8 ${hasError ? "border-error" : ""} ${className ?? ""}`.trim()}
        aria-invalid={hasError || undefined}
        suppressHydrationWarning
        {...props}
      >
        {children}
      </select>
      <IconChevronDown className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2" />
    </div>
  )
}

export function Checkbox({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      type="checkbox"
      className={`size-4 shrink-0 rounded-sm border-line ${className ?? ""}`}
      {...props}
    />
  )
}
