import { test, expect } from "@playwright/test"

test("applicant can reach sign-in and the job list", async ({ page }) => {
  await page.goto("/")
  await expect(page.getByRole("heading", { name: /Support work jobs/ })).toBeVisible()
  await page.getByRole("link", { name: "Sign in" }).click()
  await expect(page.getByRole("heading", { name: "Sign in" })).toBeVisible()
  await expect(page.getByLabel("Email")).toBeVisible()
  await expect(page.getByLabel("Password")).toBeVisible()
  await expect(page.getByRole("button", { name: "Sign in" })).toBeVisible()
})

test("provider sign-up states price and GST", async ({ page }) => {
  await page.goto("/providers")
  await expect(page.getByRole("heading", { name: "Hire support workers" })).toBeVisible()
  await expect(page.getByText(/\$249 a month plus GST/)).toBeVisible()
})
