import { AU_STATES, DEFAULT_SEARCH_RADIUS_KM, ROLE_CATEGORIES, SEARCH_RADIUS_KM, WORK_TYPES } from "@/lib/constants"
import { Button } from "@/components/ui/button"
import { Input, Select } from "@/components/ui/input"
import { applySearch } from "@/app/search-actions"

interface SearchBarProps {
  keyword?: string
  locationLabel?: string
  state?: string
  workType?: string
  roleCategory?: string
  radius?: number
}

export function SearchBar({
  keyword,
  locationLabel,
  state,
  workType,
  roleCategory,
  radius,
}: SearchBarProps) {
  return (
    <form action={applySearch} className="flex flex-col gap-3">
      <div className="flex flex-col gap-3 md:flex-row md:items-end">
        <div className="flex min-w-0 grow flex-col gap-2">
          <label htmlFor="q" className="text-sm text-muted">
            Keyword
          </label>
          <Input
            id="q"
            name="q"
            defaultValue={keyword ?? ""}
            placeholder="Job title or provider"
          />
        </div>
        <div className="flex min-w-0 grow flex-col gap-2">
          <label htmlFor="location" className="text-sm text-muted">
            Suburb or postcode
          </label>
          <Input
            id="location"
            name="location"
            defaultValue={locationLabel ?? ""}
            placeholder="Suburb or postcode"
          />
        </div>
        <Button type="submit">Search</Button>
      </div>
      <div className="flex flex-wrap gap-2">
        <div className="w-32">
          <label className="sr-only" htmlFor="state">
            State
          </label>
          <Select id="state" name="state" defaultValue={state ?? ""}>
            <option value="">State</option>
            {AU_STATES.map(function renderState(value) {
              return (
                <option key={value} value={value}>
                  {value}
                </option>
              )
            })}
          </Select>
        </div>
        <div className="w-40">
          <label className="sr-only" htmlFor="work">
            Work type
          </label>
          <Select id="work" name="work" defaultValue={workType ?? ""}>
            <option value="">Job type</option>
            {Object.entries(WORK_TYPES).map(function renderType([value, label]) {
              return (
                <option key={value} value={value}>
                  {label}
                </option>
              )
            })}
          </Select>
        </div>
        <div className="w-48">
          <label className="sr-only" htmlFor="category">
            Role category
          </label>
          <Select id="category" name="category" defaultValue={roleCategory ?? ""}>
            <option value="">Role</option>
            {Object.entries(ROLE_CATEGORIES).map(function renderCategory([value, label]) {
              return (
                <option key={value} value={value}>
                  {label}
                </option>
              )
            })}
          </Select>
        </div>
        <div className="w-40">
          <label className="sr-only" htmlFor="radius">
            Distance from suburb
          </label>
          <Select id="radius" name="radius" defaultValue={String(radius ?? DEFAULT_SEARCH_RADIUS_KM)}>
            {SEARCH_RADIUS_KM.map(function renderRadius(km) {
              return (
                <option key={km} value={km}>
                  Within {km} km
                </option>
              )
            })}
          </Select>
        </div>
      </div>
    </form>
  )
}
