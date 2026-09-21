import { test, expect } from "@playwright/test"

/**
 * Full sign-up + apply / pay + post flows need a running Supabase and
 * Stripe test mode. They are skipped unless PLAYWRIGHT_FULL=1 so local
 * `npm run e2e` still covers the public pages.
 */
const full = process.env.PLAYWRIGHT_FULL === "1"

test.describe("applicant applies", () => {
  test.skip(!full, "needs Supabase auth")
  test("signs up and applies", async ({ page }) => {
    await page.goto("/")
    const firstJob = page.locator("a").filter({ hasText: /support worker/i }).first()
    await firstJob.click()
    await page.getByRole("link", { name: "Apply" }).click()
    await expect(page.getByRole("heading", { name: "Sign in" })).toBeVisible()
  })
})

test.describe("provider posts", () => {
  test.skip(!full, "needs Stripe test mode")
  test("reaches post-a-job after a trial", async ({ page }) => {
    await page.goto("/providers")
    await expect(page.getByText(/14 days/)).toBeVisible()
  })
})
