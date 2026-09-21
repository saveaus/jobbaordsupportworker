import { AU_STATES, ROLE_CATEGORIES, WORK_TYPES } from "@/lib/constants"
import { Button } from "@/components/ui/button"
import { Input, Select } from "@/components/ui/input"
import { applySearch } from "@/app/search-actions"

interface SearchBarProps {
  keyword?: string
  locationLabel?: string
  state?: string
  workType?: string
  roleCategory?: string
}

export function SearchBar({
  keyword,
  locationLabel,
  state,
  workType,
  roleCategory,
}: SearchBarProps) {
  return (
    <form action={applySearch} className="flex flex-col gap-4">
      <div className="flex flex-col gap-4 md:flex-row">
        <div className="flex grow flex-col gap-2">
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
        <div className="flex grow flex-col gap-2">
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
      </div>
      <div className="flex flex-col gap-4 md:flex-row md:items-end">
        <div className="flex grow flex-col gap-2">
          <label htmlFor="state" className="text-sm text-muted">
            State
          </label>
          <Select id="state" name="state" defaultValue={state ?? ""}>
            <option value="">All states</option>
            {AU_STATES.map(function renderState(value) {
              return (
                <option key={value} value={value}>
                  {value}
                </option>
              )
            })}
          </Select>
        </div>
        <div className="flex grow flex-col gap-2">
          <label htmlFor="work" className="text-sm text-muted">
            Work type
          </label>
          <Select id="work" name="work" defaultValue={workType ?? ""}>
            <option value="">All work types</option>
            {Object.entries(WORK_TYPES).map(function renderType([value, label]) {
              return (
                <option key={value} value={value}>
                  {label}
                </option>
              )
            })}
          </Select>
        </div>
        <div className="flex grow flex-col gap-2">
          <label htmlFor="category" className="text-sm text-muted">
            Role category
          </label>
          <Select id="category" name="category" defaultValue={roleCategory ?? ""}>
            <option value="">All categories</option>
            {Object.entries(ROLE_CATEGORIES).map(function renderCategory([value, label]) {
              return (
                <option key={value} value={value}>
                  {label}
                </option>
              )
            })}
          </Select>
        </div>
        <Button type="submit" variant="secondary">Search</Button>
      </div>
    </form>
  )
}
