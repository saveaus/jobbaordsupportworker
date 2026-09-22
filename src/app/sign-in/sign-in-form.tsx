import { Button } from "@/components/ui/button"
import { Field } from "@/components/ui/field"
import { Input } from "@/components/ui/input"

export function SignInForm({ next }: { next: string }) {
  return (
    <form action="/auth/callback" method="post" className="flex w-full max-w-form flex-col gap-6">
      <Field label="Email" htmlFor="email">
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          placeholder="you@example.com.au"
        />
      </Field>
      <Field label="Password" htmlFor="password">
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          minLength={6}
        />
      </Field>
      <input type="hidden" name="next" value={next} />
      <Button type="submit">Sign in</Button>
    </form>
  )
}
