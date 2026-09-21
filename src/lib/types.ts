import type { AuState, RequirementCode, RoleCategory, WorkType } from "@/lib/constants"

export interface JobRecord {
  id: string
  provider_id: string
  provider_name: string
  provider_logo_path: string | null
  slug: string
  title: string
  role_category: RoleCategory
  suburb: string
  state: AuState
  postcode: string
  work_type: WorkType
  pay_min: number | null
  pay_max: number | null
  pay_period: "hour" | "year" | null
  requirements: RequirementCode[]
  description: string
  positions: number
  status: string
  source: "posted" | "imported"
  source_url: string | null
  source_name: string | null
  published_at: string | null
  expires_at: string | null
  unpublished_at: string | null
}

export interface ProfileRecord {
  user_id: string
  full_name: string
  email: string
  phone: string | null
  postcode: string
  suburb: string | null
  state: AuState | null
  work_types: WorkType[]
  requirements: RequirementCode[]
  about: string | null
  cv_path: string | null
}
