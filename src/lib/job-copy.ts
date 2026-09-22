import { SHIFT_TYPES, type ShiftCode } from "@/lib/constants"

export function isShiftCode(value: string): value is ShiftCode {
  return value in SHIFT_TYPES
}

export function encodeJobDescription(description: string, shifts: string[]): string {
  const labels = shifts.filter(isShiftCode).map(function label(code) {
    return SHIFT_TYPES[code]
  })
  if (labels.length === 0) return description
  return `Shifts: ${labels.join(", ")}.\n\n${description}`
}

export function decodeJobDescription(description: string): {
  shifts: string | null
  body: string
} {
  const match = description.match(/^Shifts: ([^\n]+)\.\n\n([\s\S]*)$/)
  if (!match) return { shifts: null, body: description }
  return { shifts: match[1], body: match[2] }
}
