/**
 * One plain sentence and one action, per the screen-states brief.
 */
interface EmptyStateProps {
  message: string
  action?: React.ReactNode
}

export function EmptyState({ message, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-start gap-4 py-8">
      <p className="text-base">{message}</p>
      {action}
    </div>
  )
}
