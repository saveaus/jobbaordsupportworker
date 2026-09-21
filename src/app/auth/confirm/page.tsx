import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { Button } from "@/components/ui/button"

export const metadata: Metadata = { title: "Continue sign in" }

export default async function ConfirmSignInPage({
  searchParams,
}: PageProps<"/auth/confirm">) {
  const params = await searchParams
  const tokenHash = typeof params.token_hash === "string" ? params.token_hash : ""
  const code = typeof params.code === "string" ? params.code : ""
  const type = typeof params.type === "string" ? params.type : "email"
  const next = typeof params.next === "string" && params.next.startsWith("/")
    ? params.next
    : "/"

  if (!tokenHash && !code)
    redirect("/sign-in?error=link")

  return (
    <div className="flex max-w-form flex-col gap-8">
      <h1 className="text-h1">Continue</h1>
      <p className="max-w-prose">
        Confirm it is you. Mail apps sometimes open the link before you do.
      </p>
      <form action="/auth/callback" method="post" className="flex flex-col gap-6">
        <input type="hidden" name="token_hash" value={tokenHash} />
        <input type="hidden" name="code" value={code} />
        <input type="hidden" name="type" value={type} />
        <input type="hidden" name="next" value={next} />
        <Button type="submit">Sign in</Button>
      </form>
    </div>
  )
}
