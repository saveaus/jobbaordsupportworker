interface FieldProps {
  label: string
  htmlFor: string
  help?: string
  error?: string
  optional?: boolean
  children: React.ReactNode
}

export function Field({ label, htmlFor, help, error, optional, children }: FieldProps) {
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={htmlFor} className="text-base">
        {label}
        {optional ? <span className="text-muted"> (optional)</span> : null}
      </label>
      {children}
      {help && !error ? <p className="text-sm text-muted">{help}</p> : null}
      {error ? <FieldError message={error} /> : null}
    </div>
  )
}

export function FieldError({ message }: { message: string }) {
  return <p className="text-sm text-error">{message}</p>
}

export function FormError({ message }: { message?: string }) {
  if (!message) return null
  return <p className="text-base text-error">{message}</p>
}

export function FormSuccess({ message }: { message?: string }) {
  if (!message) return null
  return <p className="text-base">{message}</p>
}
