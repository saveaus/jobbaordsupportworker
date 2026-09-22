/**
 * The only four icons permitted by the design brief.
 * 16px, 1.5px stroke, currentColor.
 */
interface IconProps {
  className?: string
}

const iconAttrs = {
  width: 16,
  height: 16,
  viewBox: "0 0 16 16",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": "true",
} as const

export function IconChevronDown({ className }: IconProps) {
  return (
    <svg {...iconAttrs} className={className}>
      <path d="M4 6l4 4 4-4" />
    </svg>
  )
}

export function IconExternal({ className }: IconProps) {
  return (
    <svg {...iconAttrs} className={className}>
      <path d="M5 11L11 5M6 5h5v5" />
    </svg>
  )
}

export function IconCheck({ className }: IconProps) {
  return (
    <svg {...iconAttrs} className={className}>
      <path d="M3 8.5l3.5 3.5L13 5" />
    </svg>
  )
}

export function IconClose({ className }: IconProps) {
  return (
    <svg {...iconAttrs} className={className}>
      <path d="M4 4l8 8M12 4l-8 8" />
    </svg>
  )
}

export function IconBookmark({ className, filled = false }: IconProps & { filled?: boolean }) {
  return (
    <svg {...iconAttrs} className={className} fill={filled ? "currentColor" : "none"}>
      <path d="M4 2.5h8v11.5L8 11.5 4 14V2.5z" />
    </svg>
  )
}

