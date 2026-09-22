import type { Metadata } from "next"
import Link from "next/link"
import { PageNav } from "@/components/site/page-nav"
import { getPostingState } from "./require-provider"

export const metadata: Metadata = { title: "Post a job" }

export default async function PostJobPage({
  searchParams,
}: PageProps<"/jobs/new">) {
  const params = await searchParams
  const { isProvider, requiresPayment } = await getPostingState()
  const checkoutOk = params.checkout === "ok"
  const steps = requiresPayment ? trialSteps : liveSteps

  return (
    <div className="flex flex-col">
      <section className="-mx-6 -mt-8 bg-night px-6 pt-8 pb-12 text-paper md:-mx-12 md:px-12">
        <PageNav
          backHref={isProvider ? "/dashboard" : "/"}
          backLabel={isProvider ? "Back to job posts" : "Back to jobs"}
          className="text-[#CFD5E0] hover:text-paper"
        />
        <div className="mt-8 flex max-w-prose flex-col items-start gap-6">
          <span
            aria-hidden
            className="size-0 border-x-8 border-b-[14px] border-x-transparent border-b-[#B4F34D]"
          />
          <h1 className="text-h1">
            Post a job.
            <br />
            Reach the board.
          </h1>
          <p>Workers search here. You list. We review it before it goes live.</p>
          {requiresPayment && !checkoutOk ? (
            <p className="text-sm text-[#CFD5E0]">
              14 days free. Then $249 a month plus GST.
            </p>
          ) : null}
          {checkoutOk ? <p className="text-sm text-[#CFD5E0]">Your trial is active.</p> : null}
          {!requiresPayment && !checkoutOk ? (
            <p className="text-sm text-[#CFD5E0]">Write the listing. It goes to review.</p>
          ) : null}
          <Link
            href="/jobs/new/write"
            className="inline-flex h-11 items-center rounded-sm bg-[#B4F34D] px-4 font-semibold text-[#0B110F] hover:underline"
          >
            Write the listing
          </Link>
        </div>
      </section>

      <section className="flex max-w-prose flex-col gap-8 py-12">
        <ol className="flex flex-col gap-6">
          {steps.map(function renderStep(step, index) {
            return (
              <li key={step.title} className="flex flex-col gap-1">
                <p className="text-sm text-muted">{String(index + 1).padStart(2, "0")}</p>
                <h2 className="text-h2">{step.title}</h2>
                <p>{step.body}</p>
              </li>
            )
          })}
        </ol>
        <p className="text-sm text-muted">
          Unlimited listings. Applications arrive with a profile and CV.
        </p>
      </section>
    </div>
  )
}

const trialSteps = [
  {
    title: "Write",
    body: "Title, suburb, shifts, and the work. Same fields workers see.",
  },
  {
    title: "Pay",
    body: "A card starts the trial. Cancel anytime. Jobs stay drafts until you pay.",
  },
  {
    title: "Review",
    body: "Each listing is reviewed before it goes live.",
  },
]

const liveSteps = [
  {
    title: "Write",
    body: "Title, suburb, shifts, and the work. Same fields workers see.",
  },
  {
    title: "Review",
    body: "Each listing is reviewed before it goes live.",
  },
  {
    title: "Applicants",
    body: "Profiles and CVs land on the job.",
  },
]
