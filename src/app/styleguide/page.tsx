import type { Metadata } from "next"
import { Button, ButtonLink } from "@/components/ui/button"
import { EmptyState } from "@/components/ui/empty-state"
import { Field, FieldError, FormError } from "@/components/ui/field"
import { IconCheck, IconChevronDown, IconClose, IconExternal } from "@/components/ui/icons"
import { Checkbox, Input, Select, Textarea } from "@/components/ui/input"
import { SkeletonJobList, SkeletonLine } from "@/components/ui/skeleton"
import { Table, Td, Th } from "@/components/ui/table"
import { JobRow } from "@/components/job-row"

export const metadata: Metadata = { title: "Styleguide" }

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-6 border-t border-line py-10 first:border-t-0">
      <h2 className="text-h2">{title}</h2>
      {children}
    </section>
  )
}

export default function StyleguidePage() {
  return (
    <div className="flex flex-col">
      <h1 className="pb-8 text-h1">Styleguide</h1>

      <Section title="Colours">
        <div className="flex flex-wrap gap-6 font-mono text-sm">
          {swatches.map(function renderSwatch(swatch) {
            return (
              <div key={swatch.hex} className="flex items-center gap-2">
                <span
                  className="size-10 rounded-sm border border-line"
                  style={{ background: swatch.hex }}
                />
                <span>
                  {swatch.name} {swatch.hex}
                </span>
              </div>
            )
          })}
        </div>
      </Section>

      <Section title="Type">
        <p className="text-display">Display. Every state.</p>
        <p className="text-h1">Heading one. Jobs listed.</p>
        <p className="text-h2">Heading two. Providers verified.</p>
        <p className="max-w-prose">
          Body 16, weight 400, line height 1.5. One idea per sentence. Ground claims in
          the mechanism.
        </p>
        <p className="font-mono text-sm text-muted">Meta 14, Roboto Mono, #4A5854</p>
        <p>
          <a href="#" className="underline">
            A link is night and underlined
          </a>
        </p>
        <p className="font-mono tabular-nums">$35–$42 per hour · 14 applicants · 12 Sep 2026</p>
      </Section>

      <Section title="Buttons">
        <div className="flex flex-wrap items-center gap-4">
          <Button>Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button disabled>Primary disabled</Button>
          <Button variant="secondary" disabled>
            Secondary disabled
          </Button>
          <ButtonLink href="/styleguide" variant="secondary">
            Link as button
          </ButtonLink>
        </div>
        <p className="font-mono text-sm text-muted">
          One primary action per screen. Primary fills black.
        </p>
      </Section>

      <Section title="Form fields">
        <div className="flex w-full max-w-form flex-col gap-6">
          <Field label="Text input" htmlFor="sg-input" help="Help text sits below at 14px.">
            <Input id="sg-input" placeholder="Placeholder" />
          </Field>
          <Field label="Input with error" htmlFor="sg-error" error="Enter your postcode to continue.">
            <Input id="sg-error" hasError defaultValue="Not a postcode" />
          </Field>
          <Field label="Disabled input" htmlFor="sg-disabled">
            <Input id="sg-disabled" disabled value="Read only" readOnly />
          </Field>
          <Field label="Select" htmlFor="sg-select">
            <Select id="sg-select" defaultValue="">
              <option value="" disabled>
                Choose a work type
              </option>
              <option>Casual</option>
              <option>Part time</option>
              <option>Full time</option>
              <option>Contract</option>
            </Select>
          </Field>
          <Field label="Textarea" htmlFor="sg-textarea">
            <Textarea id="sg-textarea" rows={3} placeholder="Plain formatting only" />
          </Field>
          <label className="flex min-h-11 items-center gap-2">
            <Checkbox defaultChecked /> Checkbox with a label
          </label>
          <FormError message="A form-level error is one plain sentence at the top of the form." />
        </div>
      </Section>

      <Section title="Inline messages">
        <FieldError message="Field error: say what happened and what to do." />
        <p>Success is an inline sentence. Your profile has been saved.</p>
      </Section>

      <Section title="Empty state">
        <EmptyState
          message="No jobs match. Try a wider area."
          action={<Button variant="secondary">Clear filters</Button>}
        />
      </Section>

      <Section title="Loading (skeleton)">
        <SkeletonLine className="w-1/2" />
        <SkeletonJobList rows={2} />
      </Section>

      <Section title="Job row">
        <div className="border-t border-line">
          {sampleJobs.map(function renderJob(job) {
            return <JobRow key={job.title} job={job} />
          })}
        </div>
      </Section>

      <Section title="Table">
        <Table>
          <thead>
            <tr>
              <Th>Job</Th>
              <Th>Status</Th>
              <Th numeric>Views</Th>
              <Th numeric>Applicants</Th>
              <Th numeric>Days left</Th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <Td>Disability support worker - casual, SIL</Td>
              <Td>Live</Td>
              <Td numeric>412</Td>
              <Td numeric className="font-semibold">14</Td>
              <Td numeric>21</Td>
            </tr>
            <tr>
              <Td>Aged care support worker - part time</Td>
              <Td>Pending approval</Td>
              <Td numeric>0</Td>
              <Td numeric className="font-semibold">0</Td>
              <Td numeric>30</Td>
            </tr>
          </tbody>
        </Table>
      </Section>

      <Section title="Icons">
        <div className="flex items-center gap-6">
          <IconChevronDown />
          <IconExternal />
          <IconCheck />
          <IconClose />
        </div>
      </Section>
    </div>
  )
}

const swatches = [
  { name: "Paper", hex: "#FFFFFF" },
  { name: "Night", hex: "#0B110F" },
  { name: "Night/75", hex: "#111819" },
  { name: "Forest", hex: "#55B216" },
  { name: "Lime", hex: "#B4F34D" },
  { name: "Apple", hex: "#3B7F0D" },
  { name: "Slate/20", hex: "#F5F6FF" },
  { name: "Slate/100", hex: "#CFD5E0" },
  { name: "Error", hex: "#EA6B35" },
]

const sampleJobs = [
  {
    href: "/styleguide",
    title: "Disability support worker - casual, SIL",
    providerName: "Banksia Community Care",
    suburb: "Hamilton Hill",
    state: "WA",
    workType: "Casual",
    payMin: 35,
    payMax: 42,
    payPeriod: "hour" as const,
    postedAt: new Date(Date.now() - 3 * 86_400_000),
  },
  {
    href: "/styleguide",
    title:
      "Supported independent living support worker - overnight shifts, complex care experience preferred",
    providerName: "Coastline Home Support",
    suburb: "Broadmeadows",
    state: "VIC",
    workType: "Part time",
    postedAt: new Date(Date.now() - 40 * 86_400_000),
    sourceName: "Adzuna",
  },
]
