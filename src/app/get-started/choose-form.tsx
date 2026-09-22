import { Button } from "@/components/ui/button"
import { chooseAccountKind } from "./actions"

export function ChooseForm({
  next,
  intent,
}: {
  next: string
  intent: "apply" | "hire"
}) {
  const hireFirst = intent === "hire"

  const apply = (
    <form action={chooseAccountKind}>
      <input type="hidden" name="next" value={next} />
      <input type="hidden" name="kind" value="applicant" />
      <div className="flex flex-col gap-3 border border-line p-6">
        <h2 className="text-h2">Apply for jobs</h2>
        <p>Build a profile. Apply. Start.</p>
        <Button type="submit" variant={hireFirst ? "secondary" : "primary"}>
          I want to apply
        </Button>
      </div>
    </form>
  )

  const hire = (
    <form action={chooseAccountKind}>
      <input type="hidden" name="next" value={next} />
      <input type="hidden" name="kind" value="provider" />
      <div className="flex flex-col gap-3 border border-line p-6">
        <h2 className="text-h2">Hire support workers</h2>
        <p>Post jobs. Review applicants.</p>
        <Button type="submit" variant={hireFirst ? "primary" : "secondary"}>
          I want to hire
        </Button>
      </div>
    </form>
  )

  return (
    <div className="grid max-w-page gap-4 md:grid-cols-2">
      {hireFirst ? hire : apply}
      {hireFirst ? apply : hire}
    </div>
  )
}
