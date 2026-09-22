export const WORK_TYPES = {
  casual: "Casual",
  part_time: "Part time",
  full_time: "Full time",
  contract: "Contract",
} as const

export const ROLE_CATEGORIES = {
  disability_support: "Disability Support",
  aged_care: "Aged Care",
  home_care: "Home Care",
  mental_health_support: "Mental Health Support",
  sil: "Supported Independent Living",
  other: "Other Support Work",
} as const

export const REQUIREMENTS = {
  drivers_licence: "Driver's licence",
  own_vehicle: "Own vehicle",
  ndis_screening: "NDIS Worker Screening",
  wwcc: "Working with Children Check",
  first_aid: "First Aid/CPR",
  qualification: "Cert III or IV",
} as const

export const SHIFT_TYPES = {
  mornings: "Mornings",
  afternoons: "Afternoons",
  evenings: "Evenings",
  overnight: "Overnight",
  sleepover: "Sleepover",
  weekends: "Weekends",
} as const

export const AU_STATES = ["NSW", "VIC", "QLD", "WA", "SA", "TAS", "ACT", "NT"] as const

export const JOB_STATUS_LABELS = {
  draft: "Draft",
  pending_approval: "Pending approval",
  live: "Live",
  filled: "Filled",
  expired: "Expired",
  unpublished: "Unpublished",
  hidden: "Hidden",
  removed: "Removed",
} as const

export const APPLICATION_STATUS_LABELS = {
  sent: "Sent",
  viewed: "Viewed",
  shortlisted: "Shortlisted",
  not_suitable: "Not suitable",
} as const

export type WorkType = keyof typeof WORK_TYPES
export type RoleCategory = keyof typeof ROLE_CATEGORIES
export type RequirementCode = keyof typeof REQUIREMENTS
export type ShiftCode = keyof typeof SHIFT_TYPES
export type AuState = (typeof AU_STATES)[number]
