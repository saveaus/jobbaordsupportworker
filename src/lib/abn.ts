const ABN_WEIGHTS = [10, 1, 3, 5, 7, 9, 11, 13, 15, 17, 19]

/**
 * Validates an ABN with the official checksum algorithm: subtract 1
 * from the first digit, multiply each digit by its weight, and the sum
 * must be divisible by 89.
 */
export function isValidAbn(input: string): boolean {
  const digits = input.replace(/\s/g, "")
  if (!/^[0-9]{11}$/.test(digits)) return false
  const sum = ABN_WEIGHTS.reduce(function addDigit(total, weight, index) {
    const digit = Number(digits[index]) - (index === 0 ? 1 : 0)
    return total + digit * weight
  }, 0)
  return sum % 89 === 0
}

/** Digits only, for storage. */
export function normaliseAbn(input: string): string {
  return input.replace(/\s/g, "")
}
